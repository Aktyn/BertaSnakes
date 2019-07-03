export interface SocialNetworkPackage {
	type: SOCIAL_CODES;
	[index: string]: any;
}

const enum SOCIAL_CODES {
	//TO SERVER
	REGISTER_CONNECTION = 0,//token: string
	REMOVE_FRIEND,//friend_id: string
	
	//TO CLIENT
	FRIENDS_LIST,//friends: FriendsSchema[]
	FRIEND_REQUESTS_LIST,//potential_friends: PublicAccountSchema
	ON_FRIEND_WENT_ONLINE,//friend_id: string
	ON_FRIEND_WENT_OFFLINE,//friend_id: string
	ON_FRIEND_REMOVED,//friend_id: string
}

export default SOCIAL_CODES;