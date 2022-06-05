import Database, {
  AccountSchema,
  PublicAccountSchema,
  FriendSchema,
  SocialMessage,
} from '../database'
import ERROR_CODES from '../../common/error_codes'
import SOCIAL_CODES from '../../common/social_codes'
import { RoomCustomData } from '../../common/room_info'

const TIMESTAMP_SAMPLES = 10

//account_hex_id is map key
let connections: Map<string, SocialConnection[]> = new Map()

export default class SocialConnection {
  public static awaiting_messages: Map<string, Set<string>> = new Map()

  private readonly socket: any

  public readonly account: AccountSchema
  private friends: FriendSchema[] = []
  private potential_friends: PublicAccountSchema[] = []
  private requested_friends: PublicAccountSchema[] = []

  private room_data: RoomCustomData | null = null
  private is_playing = false

  private message_timestamps: number[] = [] //for anti-spam system

  //----------------------------------//
  //        STATIC METHODS            //
  //----------------------------------//
  public static getConnections(id: string) {
    return connections.get(id)
  }
  public static getConnectionsMap() {
    return connections
  }
  //----------------------------------//

  constructor(socket: any, account: AccountSchema) {
    if (!socket) throw new Error('No socket specified')
    this.socket = socket
    this.account = account

    let account_connections = connections.get(account.id)
    if (account_connections) account_connections.push(this)
    else connections.set(account.id, [this])

    this.loadFriends()
      .then(() => {
        return this.loadFriendRequests()
      })
      .then(() => {
        return this.loadSentRequests()
      })
      .catch(console.error)
  }

  destroy() {
    let removed = false
    let account_connections = connections.get(this.account.id)
    if (account_connections) {
      let conn_i = account_connections.indexOf(this)

      if (conn_i !== -1) {
        account_connections.splice(conn_i, 1)
        removed = true
      }
      if (account_connections.length < 1) connections.delete(this.account.id)
    }
    if (!removed)
      console.error(
        'Cannot delete social connection. Object not found in map structure.',
      )

    //tell other friends who just went offline
    if (!account_connections || account_connections.length === 0) {
      for (let friend of this.friends) {
        if (friend.online) {
          let friend_connections = connections.get(friend.friend_data.id)
          if (!friend_connections) continue
          for (let friend_connection of friend_connections)
            friend_connection.onFriendDisappear(this.account.id)
        }
      }
    }
  }

  public getAccountConnections() {
    return SocialConnection.getConnections(this.account.id)
  }

  //stringifies serializable object before sending over socket
  public send<T>(data: T & { type: SOCIAL_CODES } & Exclude<T, string>) {
    //stringified json
    if (this.socket.readyState !== 1)
      //socket not open
      return
    this.socket.send(JSON.stringify(data))
  }

  public getRoomData() {
    return this.room_data
  }

  public getIsPlaying() {
    return this.is_playing
  }

  public getFriend(account_id: string) {
    return this.friends.find((f) => f.friend_data.id === account_id)
  }

  public getFriends() {
    return this.friends as Readonly<FriendSchema[]>
  }

  private async loadFriends() {
    let db_res = await Database.getAccountFriends(this.account.id)

    if (db_res.error !== ERROR_CODES.SUCCESS || !db_res.friends) return

    this.friends = []

    //add online status for each friend
    for (let friend_schema of db_res.friends) {
      let friend_connections = connections.get(friend_schema.friend_data.id)
      let main_connection = friend_connections
        ? friend_connections[0]
        : undefined
      this.friends.push({
        ...friend_schema, //friendship_id, friend_data
        online: friend_connections !== undefined,
        room_data: main_connection ? main_connection.getRoomData() : null,
        is_playing: main_connection ? main_connection.getIsPlaying() : false,
      })

      if (friend_connections) {
        for (let friend_connection of friend_connections)
          friend_connection.onFriendAppear(this.account.id)
      }
    }

    let awaiting_conversations: string[] = []

    let awaits = SocialConnection.awaiting_messages.get(this.account.id)
    if (awaits) {
      awaiting_conversations = Array.from(awaits)
      SocialConnection.awaiting_messages.delete(this.account.id)
    }

    //distribute
    this.send({
      type: SOCIAL_CODES.FRIENDS_LIST,
      friends: this.friends,
      awaiting_conversations,
    })
  }

  private async loadFriendRequests() {
    let db_res = await Database.getAccountFriendRequests(this.account.id)

    if (db_res.error !== ERROR_CODES.SUCCESS || !db_res.potential_friends)
      return

    this.potential_friends = db_res.potential_friends

    this.send({
      type: SOCIAL_CODES.FRIEND_REQUESTS_LIST,
      potential_friends: this.potential_friends,
    })
  }

  private async loadSentRequests() {
    //those request that user sent to others
    let db_res = await Database.getAccountRequestedFriends(this.account.id)

    if (db_res.error !== ERROR_CODES.SUCCESS || !db_res.requested_friends)
      return

    this.requested_friends = db_res.requested_friends

    this.send({
      type: SOCIAL_CODES.REQUESTED_FRIENDS_LIST,
      requested_friends: this.requested_friends,
    })
  }

  public updateRoomData(
    room_data: RoomCustomData | null,
    prevent_distribution = false,
  ) {
    this.room_data = room_data

    if (prevent_distribution) return

    //distribute to every friend
    for (let friend of this.friends) {
      if (!friend.online)
        //skip offline friend
        continue

      let friend_connections = connections.get(friend.friend_data.id)

      if (friend_connections) {
        for (let friend_connection of friend_connections)
          friend_connection.onFriendRoomDataUpdate(this.account.id, room_data)
      }
    }

    if (room_data === null)
      //additionally make sure the playing flag is false
      this.updatePlayingState(false)
  }

  public updatePlayingState(is_playing: boolean, prevent_distribution = false) {
    this.is_playing = is_playing

    if (prevent_distribution) return

    //distribute to every friend
    for (let friend of this.friends) {
      if (!friend.online)
        //skip offline friend
        continue

      let friend_connections = connections.get(friend.friend_data.id)

      if (friend_connections) {
        for (let friend_connection of friend_connections)
          friend_connection.onFriendPlayingStateUpdate(
            this.account.id,
            is_playing,
          )
      }
    }
  }

  public onFriendRoomDataUpdate(
    friend_id: string,
    room_data: RoomCustomData | null,
  ) {
    let friend = this.friends.find((f) => f.friend_data.id === friend_id)
    if (!friend) {
      console.error(
        'User of id:',
        this.account.id,
        'does not have friend of id:',
        friend_id,
      )
      return
    }

    friend.room_data = room_data

    this.send({
      type: SOCIAL_CODES.ON_FRIEND_ROOM_DATA_UPDATE,
      friend_id: friend.friend_data.id,
      room_data,
    })
  }

  public onFriendPlayingStateUpdate(friend_id: string, is_playing: boolean) {
    let friend = this.friends.find((f) => f.friend_data.id === friend_id)
    if (!friend) {
      console.error(
        'User of id:',
        this.account.id,
        'does not have friend of id:',
        friend_id,
      )
      return
    }

    friend.is_playing = is_playing

    this.send({
      type: SOCIAL_CODES.ON_FRIEND_IS_PLAYING_STATE_UPDATE,
      friend_id: friend.friend_data.id,
      is_playing,
    })
  }

  public onFriendAppear(friend_id: string) {
    let friend = this.friends.find((f) => f.friend_data.id === friend_id)
    if (!friend) {
      console.error(
        'User of id:',
        this.account.id,
        'does not have friend of id:',
        friend_id,
      )
      return
    }

    friend.online = true
    friend.is_playing = false
    friend.room_data = null

    this.send({
      type: SOCIAL_CODES.ON_FRIEND_WENT_ONLINE,
      friend_id: friend.friend_data.id,
    })
  }

  public onFriendDisappear(friend_id: string) {
    let friend = this.friends.find((f) => f.friend_data.id === friend_id)
    if (!friend) {
      console.error(
        'User of id:',
        this.account.id,
        'does not have friend of id:',
        friend_id,
      )
      return
    }

    friend.online = false
    friend.is_playing = false
    friend.room_data = null

    this.send({
      type: SOCIAL_CODES.ON_FRIEND_WENT_OFFLINE,
      friend_id: friend.friend_data.id,
    })
  }

  public onFriendRequestReceived(from: PublicAccountSchema) {
    this.potential_friends.push(from)
    this.send({
      type: SOCIAL_CODES.ON_FRIEND_REQUEST_RECEIVED,
      potential_friend: from,
    })
  }

  public onFriendRequestSent(to: PublicAccountSchema) {
    this.requested_friends.push(to)
    this.send({
      type: SOCIAL_CODES.ON_FRIEND_REQUEST_SENT,
      potential_friend: to,
    })
  }

  public onRequestRejected(potential_friend_id: string) {
    //account rejected someone's request
    let potential_friend_index = this.potential_friends.findIndex(
      (f) => f.id === potential_friend_id,
    )
    if (potential_friend_index === -1) return false

    this.potential_friends.splice(potential_friend_index, 1)
    this.send({
      type: SOCIAL_CODES.ON_FRIEND_REQUEST_REJECTED,
      potential_friend_id,
    })
    return true
  }

  public onAccountRejectedFriendRequest(requested_friend_id: string) {
    //sent request has been rejected
    let requested_friend_index = this.requested_friends.findIndex(
      (f) => f.id === requested_friend_id,
    )
    if (requested_friend_index === -1) return false

    this.requested_friends.splice(requested_friend_index, 1)
    this.send({
      type: SOCIAL_CODES.ON_ACCOUNT_REJECTED_FRIEND_REQUEST,
      requested_friend_id,
    })
    return true
  }

  //account accepted someone's request
  public onRequestAccepted(
    accepted_friend_id: string,
    friendship_id: string,
    is_left: boolean,
    accepted_friend_connections: SocialConnection[] | undefined,
  ) {
    let accepted_friend_index = this.potential_friends.findIndex(
      (f) => f.id === accepted_friend_id,
    )
    if (accepted_friend_index === -1) return false

    let main_connection = accepted_friend_connections
      ? accepted_friend_connections[0]
      : undefined

    const common_data = {
      friendship_id,
      online: !!accepted_friend_connections,
      room_data: main_connection ? main_connection.getRoomData() : null,
      is_playing: main_connection ? main_connection.getIsPlaying() : false,
      is_left,
    }

    //move potential friend to friends array
    this.friends.push({
      friend_data: this.potential_friends[accepted_friend_index],
      ...common_data,
    })
    this.potential_friends.splice(accepted_friend_index, 1) //it is no more potential friend

    this.send({
      type: SOCIAL_CODES.ON_FRIEND_REQUEST_ACCEPTED,
      accepted_friend_id,
      ...common_data,
    })
    return true
  }

  //sent request has been accepted
  public onAccountAcceptedFriendRequest(
    requested_friend_id: string,
    friendship_id: string,
    is_left: boolean,
    requested_friend_connection: SocialConnection,
  ) {
    let requested_friend_index = this.requested_friends.findIndex(
      (f) => f.id === requested_friend_id,
    )
    if (requested_friend_index === -1) return false

    const common_data = {
      friendship_id,
      online: true, //obviously he is online because he just accepted request
      room_data: requested_friend_connection.getRoomData(),
      is_playing: requested_friend_connection.getIsPlaying(),
      is_left,
    }

    //move requested friend to friends array
    this.friends.push({
      friend_data: this.requested_friends[requested_friend_index],
      ...common_data,
    })
    this.requested_friends.splice(requested_friend_index, 1) //it is no more requested friend

    this.send({
      type: SOCIAL_CODES.ON_ACCOUNT_ACCEPTED_FRIEND_REQUEST,
      requested_friend_id,
      ...common_data,
    })
    return true
  }

  public removeFriend(friend_id: string) {
    let friend_index = this.friends.findIndex(
      (f) => f.friend_data.id === friend_id,
    )
    if (friend_index === -1) return false

    this.friends.splice(friend_index, 1)
    this.send({ type: SOCIAL_CODES.ON_FRIEND_REMOVED, friend_id })
    return true
  }

  public onMessage(friendship_id: string, message: SocialMessage) {
    this.send({
      type: SOCIAL_CODES.ON_SOCIAL_MESSAGE,
      friendship_id,
      message,
    })
  }

  public sendSpamWarning() {
    this.send({ type: SOCIAL_CODES.SPAM_WARNING })
  }

  public canSendChatMessage() {
    //server-side only for anti-spam system
    return (
      this.message_timestamps.length < TIMESTAMP_SAMPLES ||
      Date.now() - this.message_timestamps[0] > TIMESTAMP_SAMPLES * 1000
    ) //one second per message
  }

  public registerLastMessageTimestamp(timestamp: number) {
    //server-side only for anti-spam system
    this.message_timestamps.push(timestamp)
    while (this.message_timestamps.length > TIMESTAMP_SAMPLES)
      //store last N message timestamps
      this.message_timestamps.shift()
  }
}
