export interface SocialNetworkPackage {
	type: SOCIAL_CODES;
	[index: string]: any;
}

const enum SOCIAL_CODES {
	//TO SERVER
	REGISTER_CONNECTION = 0,//token: string
	REQUEST_FRIEND,//friend_id: string
	REMOVE_FRIEND,//friend_id: string
	ACCEPT_REQUEST,//user_id: string
	REJECT_REQUEST,//user_id: string
	SEND_CHAT_MESSAGE,//recipient_id: string, content: string
	REQUEST_CONVERSATION_DATA,//friendship_id: string
	
	//TO CLIENT
	FRIENDS_LIST,//friends: FriendsSchema[], awaiting_conversations: [friendship_id: string]
	FRIEND_REQUESTS_LIST,//potential_friends: PublicAccountSchema[]
	REQUESTED_FRIENDS_LIST,//requested_friends: PublicAccountSchema[]
	ON_FRIEND_REQUEST_SENT,//potential_friend: PublicAccountSchema
	ON_FRIEND_REQUEST_RECEIVED,//potential_friend: PublicAccountSchema
	ON_FRIEND_WENT_ONLINE,//friend_id: string
	ON_FRIEND_WENT_OFFLINE,//friend_id: string
	ON_FRIEND_ROOM_DATA_UPDATE,//friend_id: string, room_data: RoomCustomData | null
	ON_FRIEND_IS_PLAYING_STATE_UPDATE,//friend_id: string, is_playing: boolean
	ON_FRIEND_REMOVED,//friend_id: string
	ON_FRIEND_REQUEST_REJECTED,//potential_friend_id: string
	ON_ACCOUNT_REJECTED_FRIEND_REQUEST,//requested_friend_id: string
	ON_FRIEND_REQUEST_ACCEPTED,//accepted_friend_id: string, online: boolean, friendship_id: string, is_left: boolean
	ON_ACCOUNT_ACCEPTED_FRIEND_REQUEST,//requested_friend_id: string, friendship_id: string, is_left: boolean
	ON_SOCIAL_MESSAGE,//friendship_id: string, //message: SocialMessage
	SPAM_WARNING,
	CONVERSATION_DATA,//friendship_id: string, conversation: SocialMessage[]
}

export default SOCIAL_CODES;