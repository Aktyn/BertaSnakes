import * as express from 'express'
import ERROR_CODES from '../../common/error_codes'
import Database, { AccountSchema } from '../database'
import Cache from '../cache'
import { checkAdminPermissions } from './index'
import SocialConnection from '../social/social_connection'
import RoomsManager from '../game/rooms_manager'
import { RoomCustomData } from '../../common/room_info'
import getCurrenciesData from '../currencies'

const ranking_cache_name = (page: number, type: number) =>
  `ranking_page_${page}_${type}`

function open(app: express.Express) {
  app.post('/get_ranking', async (req, res) => {
    //page, type
    try {
      if (
        typeof req.body.page !== 'number' ||
        typeof req.body.type !== 'number'
      )
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })

      if (req.body.page === 0) {
        //check for first ranking page in cache
        let cached_page = Cache.getCache(
          ranking_cache_name(req.body.page, req.body.type),
        )
        if (cached_page) return res.json(cached_page.data)
      }

      let db_res = await Database.getRankingPage(req.body.page, req.body.type)
      if (
        db_res.error !== ERROR_CODES.SUCCESS ||
        !db_res.data ||
        !db_res.total_accounts
      )
        return res.json({ error: db_res.error })

      let cached_response = {
        error: ERROR_CODES.SUCCESS,
        data: db_res.data,
        total_users: db_res.total_accounts,
      }
      if (req.body.page === 0)
        Cache.createCache(
          ranking_cache_name(req.body.page, req.body.type),
          1000 * 60 * 5,
          cached_response,
        )
      return res.json(cached_response)
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })

  app.post('/account_games', async (req, res) => {
    //account_id
    try {
      if (!req.body.account_id || typeof req.body.page !== 'number')
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })
      let db_res = await Database.getAccountGames(
        req.body.account_id,
        req.body.page,
      )
      if (db_res.error !== ERROR_CODES.SUCCESS || !db_res.games)
        return res.json({ error: db_res.error })

      return res.json({ error: ERROR_CODES.SUCCESS, games: db_res.games })
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })

  app.post('/game_details', async (req, res) => {
    //game_id
    try {
      if (!req.body.game_id)
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })
      let db_res = await Database.getGame(req.body.game_id)

      if (db_res.error !== ERROR_CODES.SUCCESS || !db_res.game)
        return res.json({ error: db_res.error })

      return res.json({ error: ERROR_CODES.SUCCESS, game: db_res.game })
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })

  app.post('/get_user_public_data', async (req, res) => {
    //account_id
    try {
      if (!req.body.account_id)
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })
      let db_res = await Database.getUserPublicData(req.body.account_id)

      if (db_res.error !== ERROR_CODES.SUCCESS || !db_res.data)
        return res.json({ error: db_res.error })

      return res.json({ error: ERROR_CODES.SUCCESS, data: db_res.data })
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })

  app.post('/get_online_accounts_data', async (req, res) => {
    //token
    try {
      if (typeof req.body.token !== 'string')
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })

      if (false === (await checkAdminPermissions(req.body.token)))
        return res.json({ error: ERROR_CODES.INSUFFICIENT_PERMISSIONS })

      //NOTE - this array stores private accounts data only available for account's owner and admins
      let data: {
        account: AccountSchema
        room_data: RoomCustomData | null
        is_playing: boolean
      }[] = []

      let connections_map = SocialConnection.getConnectionsMap()
      for (let connections of connections_map.values()) {
        if (connections.length < 1) continue
        data.push({
          account: connections[0].account,
          room_data: connections[0].getRoomData(),
          is_playing: connections[0].getIsPlaying(),
        })
      }

      return res.json({ error: ERROR_CODES.SUCCESS, data })
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })

  app.post('/get_rooms_data', async (req, res) => {
    //token
    try {
      if (typeof req.body.token !== 'string')
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })

      if (false === (await checkAdminPermissions(req.body.token)))
        return res.json({ error: ERROR_CODES.INSUFFICIENT_PERMISSIONS })

      let rooms_data = Array.from(RoomsManager.getRooms().values()).map(
        (room) => room.toJSON(),
      )

      return res.json({ error: ERROR_CODES.SUCCESS, rooms: rooms_data })
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })

  app.post('/get_currencies', async (req, res) => {
    //token
    try {
      if (typeof req.body.token !== 'string')
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })

      //authenticate (only logged in users can get currencies data)
      let account_res = await Database.getAccountFromToken(req.body.token)
      if (account_res.error !== ERROR_CODES.SUCCESS)
        return res.json({ error: account_res.error })

      let currencies_data = await getCurrenciesData()
      return res.json(currencies_data)
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })
}

export default { open }
