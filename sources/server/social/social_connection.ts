import Database, {AccountSchema, PublicAccountSchema, FriendSchema, SocialMessage} from '../database/database';
import ERROR_CODES from "../../common/error_codes";
import SOCIAL_CODES from "../../common/social_codes";

//account_hex_id is map key
let connections: Map<string, SocialConnection> = new Map();

export default class SocialConnection {
	private readonly socket: any;
	
	public readonly account: AccountSchema;
	private friends: FriendSchema[] = [];
	private potential_friends: PublicAccountSchema[] = [];
	private requested_friends: PublicAccountSchema[] = [];
	
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
		}).then(() => {
			return this.loadSentRequests();
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
	public send<T>(data: T & {type: SOCIAL_CODES} & Exclude<T, string>) {//stringified json
		if(this.socket.readyState !== 1)//socket not open
			return;
		this.socket.send( JSON.stringify(data) );
	}
	
	public getFriend(account_id: string) {
		return this.friends.find(f => f.friend_data.id === account_id);
	}
	
	public getFriends() {
		return this.friends as Readonly<FriendSchema[]>;
	}
	
	private async loadFriends() {
		let db_res = await Database.getAccountFriends( this.account.id );
		
		if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.friends)
			return;
		
		this.friends = [];
		
		//add online status for each friend
		for(let friend_schema of db_res.friends) {
			let friend_connection = connections.get(friend_schema.friend_data.id);
			this.friends.push({
				...friend_schema,//friendship_id, friend_data
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
	
	private async loadSentRequests() {//those request that user sent to others
		let db_res = await Database.getAccountRequestedFriends( this.account.id );
		
		if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.requested_friends)
			return;
		
		this.requested_friends = db_res.requested_friends;
		
		this.send({type: SOCIAL_CODES.REQUESTED_FRIENDS_LIST, requested_friends: this.requested_friends});
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
	
	public onFriendRequestReceived(from: PublicAccountSchema) {
		this.potential_friends.push(from);
		this.send({type: SOCIAL_CODES.ON_FRIEND_REQUEST_RECEIVED, potential_friend: from});
	}
	
	public onFriendRequestSent(to: PublicAccountSchema) {
		this.requested_friends.push( to );
		this.send({type: SOCIAL_CODES.ON_FRIEND_REQUEST_SENT, potential_friend: to});
	}
	
	public onRequestRejected(potential_friend_id: string) {//account rejected someone's request
		let potential_friend_index = this.potential_friends.findIndex(f => f.id === potential_friend_id);
		if(potential_friend_index === -1)
			return false;
		
		this.potential_friends.splice(potential_friend_index, 1);
		this.send({type: SOCIAL_CODES.ON_FRIEND_REQUEST_REJECTED, potential_friend_id});
		return true;
	}
	
	public onAccountRejectedFriendRequest(requested_friend_id: string) {//sent request has been rejected
		let requested_friend_index = this.requested_friends.findIndex(f => f.id === requested_friend_id);
		if(requested_friend_index === -1)
			return false;
		
		this.requested_friends.splice(requested_friend_index, 1);
		this.send({type: SOCIAL_CODES.ON_ACCOUNT_REJECTED_FRIEND_REQUEST, requested_friend_id});
		return true;
	}
	
	//account accepted someone's request
	public onRequestAccepted(accepted_friend_id: string, friendship_id: string, is_left: boolean, is_online: boolean) {
		let accepted_friend_index = this.potential_friends.findIndex(f => f.id === accepted_friend_id);
		if(accepted_friend_index === -1)
			return false;
		
		//move potential friend to friends array
		this.friends.push({
			friendship_id,
			friend_data: this.potential_friends[accepted_friend_index],
			is_left,
			online: is_online
		});
		this.potential_friends.splice(accepted_friend_index, 1);//it is no more potential friend
		
		this.send({
			type: SOCIAL_CODES.ON_FRIEND_REQUEST_ACCEPTED,
			accepted_friend_id,
			online: is_online,
			friendship_id,
			is_left
		});
		return true;
	}
	
	//sent request has been accepted
	public onAccountAcceptedFriendRequest(requested_friend_id: string, friendship_id: string, is_left: boolean) {
		let requested_friend_index = this.requested_friends.findIndex(f => f.id === requested_friend_id);
		if(requested_friend_index === -1)
			return false;
		
		//move requested friend to friends array
		this.friends.push({
			friendship_id,
			friend_data: this.requested_friends[requested_friend_index],
			is_left,
			online: true//obviously he is online because he just accepted request
		});
		this.requested_friends.splice(requested_friend_index, 1);//it is no more requested friend
		
		this.send({
			type: SOCIAL_CODES.ON_ACCOUNT_ACCEPTED_FRIEND_REQUEST,
			requested_friend_id,
			friendship_id,
			is_left
		});
		return true;
	}
	
	public removeFriend(friend_id: string) {
		let friend_index = this.friends.findIndex(f => f.friend_data.id === friend_id);
		if(friend_index === -1)
			return false;
		
		this.friends.splice(friend_index, 1);
		this.send({type: SOCIAL_CODES.ON_FRIEND_REMOVED, friend_id});
		return true;
	}
	
	public onMessage(friendship_id: string, message: SocialMessage) {
		this.send({
			type: SOCIAL_CODES.ON_SOCIAL_MESSAGE,
			friendship_id,
			message
		});
	}
}