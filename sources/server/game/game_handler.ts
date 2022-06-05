import GameStarter from './game_starter'
import RoomInfo from '../../common/room_info'
import { UserFullData } from '../../common/user_info'
import NetworkCodes from '../../common/network_codes'
import Connections, { Connection } from './connections'
import { GameResultJSON } from '../../common/game/game_result'
import Database from '../database'
import { AccountSchema2UserCustomData } from '../utils'
import Config from '../../common/config'
import { executeCommand } from '../utils'
import RoomsManager from './rooms_manager'
import * as child_process from 'child_process'
import * as path from 'path'
import { PROCESS_ACTIONS, MessageFromClient } from './game_process'
import { ChildProcess } from 'child_process'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

const numCPUs = require('os').cpus().length
console.info('Number of cpus:', numCPUs)

async function saveGameResult(room: RoomInfo, result_json: GameResultJSON) {
  //updating user's database entries according to game result
  if (typeof result_json === 'string') result_json = JSON.parse(result_json)

  //saving game result as database result
  await Database.saveGameResult(room, result_json.players_results).catch(
    console.error,
  )

  //result_json.players_results.forEach(async (result) => {
  for (let result of result_json.players_results) {
    if (!result.account_id)
      //ignore guests
      return
    let account_id = result.account_id

    //update account custom data
    let account_schema = await Database.getAccount(account_id)
    if (!account_schema) {
      console.error('Account not found in database, id:', account_id)
      return
    }
    account_schema.rank = result.rank //rank is already updated in results
    account_schema.coins += result.coins
    account_schema.exp += result.exp
    account_schema.total_games += 1
    if (account_schema.exp >= 1) {
      //level up
      account_schema.level = Math.min(
        Config.MAX_LEVEL,
        account_schema.level + 1,
      )
      account_schema.exp -= 1
      account_schema.exp /=
        account_schema.level / Math.max(1, account_schema.level - 1)
    }

    await Database.updateAccountCustomData(account_id, account_schema)

    let user = room.getUserByID(result.user_id)
    if (user && user.connection && user.account_id === account_id) {
      user.connection.updateUserData(
        AccountSchema2UserCustomData(account_schema),
      )
      RoomsManager.onRoomUserCustomDataUpdate(room, user)
    }
  }
}

interface MessageFromGameProcess {
  room_id: number
  action: NetworkCodes
  data: any
}

interface GameProcessInfo {
  proc: ChildProcess
  running_games: number
}

let processes: GameProcessInfo[] = []

function forkProcess() {
  let proc = child_process.fork(path.join(__dirname, 'game_process'))
  let proc_info: GameProcessInfo = {
    proc,
    running_games: 0,
  }

  proc.on('exit', onProcessExit)
  proc.on('message', onProcessMessage)

  processes.push(proc_info)
  console.log('Forked processes:', processes.length)
  return proc_info
}

function onProcessExit(code: number | null, signal: string) {
  if (code !== null) console.error('Process exited with code:', code, signal)
}

function onProcessMessage(msg: MessageFromGameProcess) {
  let game_handler = GameStarter.getRunningGame(msg.room_id)
  if (game_handler) game_handler.handleGameProcessMessage(msg)
}

export async function getMemUsages() {
  let usages: { games: number; memory: number }[] = []
  for (let proc_info of processes) {
    try {
      let usage_kb = await executeCommand(`ps -p ${proc_info.proc.pid} -o rss=`)
      usages.push({
        games: proc_info.running_games,
        memory: parseInt(usage_kb),
      })
    } catch (e) {
      usages.push({ games: 0, memory: 0 })
    }
  }
  return usages
}

/*setInterval(async () => {//Math.round(process.memoryUsage().rss/1024/1024) + 'MB'
	console.log('memory usages:', await getMemUsages());
},1000*10);*/

export default class GameHandler {
  private readonly onExit: (no_error: boolean) => void
  private readonly room: RoomInfo
  private remaining_confirmations: number[]
  private game_started = false
  private readonly process_info: GameProcessInfo | undefined

  constructor(room: RoomInfo, onExit: (no_error: boolean) => void) {
    this.onExit = onExit
    this.room = room

    //prepare confirmations system
    this.remaining_confirmations = [...room.sits]

    setTimeout(() => {
      //after 10 seconds check if everyone confirmed game start
      if (!this.game_started) {
        //if not started yet
        RoomsManager.onGameFailedToStart(room, this.remaining_confirmations)
        this.onGameEnd()
      }
    }, 10 * 1000)

    //////////////////////////////

    try {
      //spawn process for game
      //this.room.game_handler = child_process.fork( path.join(__dirname, 'game_handler') );
      //deprecated: child_process.fork(__dirname + '/game_handler');
      if (processes.length === 0) this.process_info = forkProcess()
      else {
        processes.sort((p1, p2) => p1.running_games - p2.running_games) //ASC
        if (processes[0].running_games === 0 || processes.length >= numCPUs)
          this.process_info =
            processes[0] //first element has least running_games
        else this.process_info = forkProcess()
      }
      this.process_info.running_games++

      this.room.game_handler = this

      let playing_users_data: UserFullData[] = []
      this.room.forEachUser((user) => {
        if (this.room.isUserSitting(user.id))
          playing_users_data.push(user.toFullJSON())
      })

      this.process_info.proc.send({
        action: PROCESS_ACTIONS.INIT_GAME,
        //sends array of only sitting users (actual players in game)
        playing_users: playing_users_data,
        room_info: this.room.toJSON(),
      })

      //distribute game start message
      room.forEachUser((user) => {
        if (user.connection) user.connection.sendOnGameStartEvent(room)
      })

      //distribute room remove to every lobby subscriber
      Connections.forEachLobbyUser((conn) => conn.onRoomRemove(room))
    } catch (e) {
      console.error(e)

      RoomsManager.onGameFailedToStart(room)
      this.onGameEnd()
    }
  }

  private onGameEnd(no_error = false) {
    if (this.process_info) {
      //kill process before nulling it
      this.process_info.running_games = Math.max(
        0,
        this.process_info.running_games - 1,
      )
      this.process_info.proc.send({
        action: PROCESS_ACTIONS.ON_GAME_END,
        room_id: this.room.id,
      })
      //this.process_info.proc.kill('SIGINT');
    }
    this.room.game_handler = null
    this.room.unreadyAll()
    this.onExit(no_error)
  }

  private startGame() {
    this.game_started = true

    try {
      //running game server-side
      if (!this.process_info) {
        console.error('process_info is not defined')
        return
      }
      this.process_info.proc.send({
        action: PROCESS_ACTIONS.START_GAME,
        room_id: this.room.id,
      })
    } catch (e) {
      console.error('Cannot start game: ' + e)
    }
  }

  private distributeData<T>(
    data: { [index: string]: any } & { type: NetworkCodes },
  ) {
    this.room.forEachUser((room_user) => {
      if (!room_user.connection)
        throw new Error('room_user has not assigned connection handler')

      room_user.connection.sendCustom(data)
    })
  }

  public send(msg: Omit<MessageFromClient, 'room_id'>) {
    if (this.process_info)
      this.process_info.proc.send({ ...msg, room_id: this.room.id })
  }

  public onRoomEmptied(room: RoomInfo) {
    //TODO: speeding up game since there is no one to see it
    if (room !== this.room) throw new Error("GameHandler's room mismatch")
    if (!this.process_info) return
    this.process_info.proc.send({
      action: PROCESS_ACTIONS.ON_EVERYONE_LEFT,
      room_id: this.room.id,
    })
  }

  public handleGameProcessMessage(msg: MessageFromGameProcess) {
    //if(msg.room_id !== this.room.id)
    //	throw new Error('room_ids mismatch');//return;
    switch (msg.action) {
      case NetworkCodes.START_ROUND_ACTION:
        {
          //@msg.data - game duration in seconds
          if (
            typeof msg.data.game_duration !== 'number' ||
            typeof msg.data.round_delay !== 'number' ||
            typeof msg.data.init_data !== 'object'
          )
            break

          //distribute start round message to every user in room
          this.distributeData({
            type: NetworkCodes.START_ROUND_COUNTDOWN,
            ...msg.data,
          })
        }
        break
      case NetworkCodes.START_GAME_FAIL_ACTION:
        RoomsManager.onGameFailedToStart(this.room)
        this.onGameEnd()
        break
      case NetworkCodes.END_GAME_ACTION:
        {
          //distribute game end message to every user in room
          this.distributeData({
            type: NetworkCodes.END_GAME,
            ...msg.data,
          })

          //saving game result to database
          saveGameResult(this.room, msg.data.result)
            .then(() => {
              this.onGameEnd(true)
            })
            .catch((error) => {
              console.error(error)
              this.onGameEnd()
            })
        }
        break
      case NetworkCodes.SEND_DATA_TO_CLIENT_ACTION_FLOAT32:
        {
          //fast data distribution
          try {
            let buffer = Float32Array.from(msg.data)
            this.room.forEachUser((user) => {
              if (user.connection) user.connection.sendBuffer(buffer)
            })
          } catch (e) {
            console.error('Cannot send data to client:', e)
          }
        }
        break
    }
  }

  public onConfirmation(connection: Connection) {
    if (!connection.user) return
    let user_id = connection.user.id
    this.remaining_confirmations = this.remaining_confirmations.filter(
      (c) => c !== user_id,
    )

    if (this.remaining_confirmations.length === 0) {
      console.log('Everyone confirmed, starting game process')
      this.startGame()
    }
  }
}
