import Database, {AccountSchema, PublicAccountSchema} from '../database';
import ERROR_CODES from "../../common/error_codes";
import SOCIAL_CODES from "../../common/social_codes";

//account_hex_id is map key
let connections: Map<string, SocialConnection> = new Map();

export interface FriendSchema {
	friend_data: PublicAccountSchema;
	online: boolean;
}

export default class SocialConnection {
	private readonly socket: any;
	
	public readonly account: AccountSchema;
	private friends: FriendSchema[] = [];
	private potential_friends: PublicAccountSchema[] = [];
	
	  //----------------------------------//
	 //        STATIC METHODS            //
	//----------------------------------//
	public static getConnection(id: string) {
		return connections.get(id);
	}
	//----------------------------------//
	
	constructor(socket: any, account: AccountSchema) {
		if(!socket)
			throw new Error('No socket specified');
		this.socket = socket;
		this.account = account;
		
		connections.set(account.id, this);
		
		this.loadFriends().then(() => {
			return this.loadFriendRequests();
		}).catch(console.error);
	}
	
	destroy() {
		if( !connections.delete(this.account.id) )
			console.error('Cannot delete social connection. Object not found in map structure.');
		
		//tell other friends who just went offline
		for(let friend of this.friends) {
			if( friend.online ) {
				let friend_connection = connections.get(friend.friend_data.id);
				if(!friend_connection)
					continue;
				
				friend_connection.onFriendDisappear( this.account.id );
			}
		}
	}
	
	//stringifies serializable object before sending over socket
	private send<T>(data: T & {type: SOCIAL_CODES} & Exclude<T, string>) {//stringified json
		if(this.socket.readyState !== 1)//socket not open
			return;
		this.socket.send( JSON.stringify(data) );
	}
	
	private async loadFriends() {
		let db_res = await Database.getAccountFriends( this.account.id );
		
		if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.friends)
			return;
		
		this.friends = [];
		
		//add online status for each friend
		for(let friend_data of db_res.friends) {
			let friend_connection = connections.get(friend_data.id);
			this.friends.push({
				friend_data,
				online: friend_connection !== undefined
			});
			
			if( friend_connection )
				friend_connection.onFriendAppear( this.account.id );
		}
		
		//distribute
		this.send({type: SOCIAL_CODES.FRIENDS_LIST, friends: this.friends});
	}
	
	private async loadFriendRequests() {
		let db_res = await Database.getAccountFriendRequests( this.account.id );
		
		if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.potential_friends)
			return;
		
		this.potential_friends = db_res.potential_friends;
		
		this.send({type: SOCIAL_CODES.FRIEND_REQUESTS_LIST, potential_friends: this.potential_friends});
	}
	
	public onFriendAppear(friend_id: string) {
		let friend = this.friends.find(f => f.friend_data.id === friend_id);
		if(!friend) {
			console.error('User of id:', this.account.id, 'does not have friend of id:', friend_id);
			return;
		}
		
		friend.online = true;
		
		this.send({type: SOCIAL_CODES.ON_FRIEND_WENT_ONLINE, friend_id: friend.friend_data.id});
	}
	
	public onFriendDisappear(friend_id: string) {
		let friend = this.friends.find(f => f.friend_data.id === friend_id);
		if(!friend) {
			console.error('User of id:', this.account.id, 'does not have friend of id:', friend_id);
			return;
		}
		
		friend.online = false;
		
		this.send({type: SOCIAL_CODES.ON_FRIEND_WENT_OFFLINE, friend_id: friend.friend_data.id});
	}
	
	public removeFriend(friend_id: string, ) {
		let friend_index = this.friends.findIndex(f => f.friend_data.id === friend_id);
		if(friend_index === -1)
			return false;
		
		this.friends.splice(friend_index, 1);
		this.send({type: SOCIAL_CODES.ON_FRIEND_REMOVED, friend_id});
		return true;
	}
}