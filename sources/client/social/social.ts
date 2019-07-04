import Config from '../../common/config';
import SOCIAL_CODES, {SocialNetworkPackage} from '../../common/social_codes';
import ERROR_CODES from '../../common/error_codes';
import Events from "../utils/events";

import {PublicAccountSchema} from "../../server/database/database";
import {FriendSchema} from '../../server/database/database';
export {FriendSchema} from '../../server/database/database';

let friends: FriendSchema[] = [];
let potential_friends: PublicAccountSchema[] = [];
let requested_friends: PublicAccountSchema[] = [];
let events = new Events();

export const enum EVENT_NAMES {
	ON_FRIENDS_LIST_UPDATE = 'on_friends_update',
	ON_FRIENDS_REQUEST_UPDATE = 'on_friends_request_update',
	ON_CHAT_MESSAGE = 'on_chat_message'
}

function sortFriends() {
	friends.sort((a) => a.online ? -1 : 1);
}

let socket: WebSocket | null = null;

function handleMessage(message: SocialNetworkPackage) {
	switch (message['type']) {
		default:
			throw new Error('Unknown social message type: ' + message['type']);
			
		case SOCIAL_CODES.FRIENDS_LIST:
			friends = message['friends'];
			sortFriends();
			events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			break;
		case SOCIAL_CODES.FRIEND_REQUESTS_LIST://potential_friends: PublicAccountSchema[]
			potential_friends = message['potential_friends'];
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			break;
		case SOCIAL_CODES.REQUESTED_FRIENDS_LIST://requested_friends: PublicAccountSchema[]
			requested_friends = message['requested_friends'];
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			break;
			
		case SOCIAL_CODES.ON_FRIEND_WENT_ONLINE: {
			let friend = friends.find(f => f.friend_data.id === message['friend_id']);
			if(friend) {
				friend.online = true;
				sortFriends();
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			}
		}   break;
		case SOCIAL_CODES.ON_FRIEND_WENT_OFFLINE: {
			let friend = friends.find(f => f.friend_data.id === message['friend_id']);
			if(friend) {
				friend.online = false;
				sortFriends();
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			}
		}   break;
		
		case SOCIAL_CODES.ON_FRIEND_REQUEST_RECEIVED: {//potential_friend: PublicAccountSchema
			potential_friends.push( message['potential_friend'] );
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
		}   break;
		case SOCIAL_CODES.ON_FRIEND_REQUEST_SENT: {//potential_friend: PublicAccountSchema
			requested_friends.push( message['potential_friend'] );
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
		}   break;
		
		case SOCIAL_CODES.ON_FRIEND_REMOVED: {
			let friend_index = friends.findIndex(f => f.friend_data.id === message['friend_id']);
			if(friend_index !== -1) {
				friends.splice(friend_index, 1);
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			}
		}   break;
		case SOCIAL_CODES.ON_FRIEND_REQUEST_REJECTED: {//potential_friend_id: string
			let potential_friend_index = potential_friends
				.findIndex(f => f.id === message['potential_friend_id']);
			if(potential_friend_index !== -1) {
				potential_friends.splice(potential_friend_index, 1);
				events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			}
		}   break;
		case SOCIAL_CODES.ON_ACCOUNT_REJECTED_FRIEND_REQUEST: {//requested_friend_id: string
			let requested_friend_index = requested_friends
				.findIndex(f => f.id === message['requested_friend_id']);
			if(requested_friend_index !== -1) {
				requested_friends.splice(requested_friend_index, 1);
				events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			}
		}   break;
		case SOCIAL_CODES.ON_FRIEND_REQUEST_ACCEPTED: {//accepted_friend_id: string, online: boolean
			let accepted_friend_index = potential_friends
				.findIndex(f => f.id === message['accepted_friend_id']);
			if(accepted_friend_index !== -1) {
				//move potential friend to friends array
				friends.push({
					online: message['online'],
					friendship_id: message['friendship_id'],
					is_left: message['is_left'],
					friend_data: potential_friends[accepted_friend_index]
				});
				potential_friends.splice(accepted_friend_index, 1);//it is no more potential friend
				
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
				events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			}
		}   break;
		case SOCIAL_CODES.ON_ACCOUNT_ACCEPTED_FRIEND_REQUEST: {//requested_friend_id: string
			let requested_friend_index = requested_friends
				.findIndex(f => f.id === message['requested_friend_id']);
			if(requested_friend_index !== -1) {
				//move requested friend to friends array
				friends.push({
					online: true,//obviously he is online because he just accepted request
					friendship_id: message['friendship_id'],
					is_left: message['is_left'],
					friend_data: requested_friends[requested_friend_index]
				});
				requested_friends.splice(requested_friend_index, 1);//it is no more requested friend
				
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
				events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			}
		}   break;
		case SOCIAL_CODES.ON_SOCIAL_MESSAGE: {//friendship_id: string, //message: SocialMessage
			events.emit(EVENT_NAMES.ON_CHAT_MESSAGE, {
				friendship_id: message['friendship_id'],
				message: message['message']//SocialMessage
			});
		}   break;
	}
	console.log(message);
}

function send(data: SocialNetworkPackage) {
	try {
		if(socket === null)
			throw new Error('socket is null');
		socket.send( JSON.stringify(data) );
		return ERROR_CODES.SUCCESS;
	}
	catch(e) {
		console.error('Cannot send message, reason:', e);
		return ERROR_CODES.CANNOT_SEND_JSON_MESSAGE;
	}
}

export default {
	connect(token: string) {
		if(socket !== null) {
			console.log('Social Websocket connection already established');
			return;
		}
		const server_address = 'ws://' + window.location.hostname + ':' + Config.SOCIAL_WEBSOCKET_PORT;
		console.log('Connecting to websocket server:', server_address, '(social)');
		socket = new WebSocket(server_address);
		
		socket.onopen = async function() {
			send({type: SOCIAL_CODES.REGISTER_CONNECTION, token});
		};

		socket.onmessage = function(msg) {
			if(typeof msg.data !== 'string' || !msg.isTrusted)
				return;
			try {
				handleMessage(JSON.parse(msg.data));
			}
			catch(e) {
				console.error(e);
			}
		};

		socket.onclose = function() {
			console.log('Social connection closed');
			socket = null;
		};
		socket.onerror = function(error) {
			console.log('Socket error:', error);
		};
	},
	
	disconnect() {
		if(socket)
			socket.close();
		socket = null;
	},
	
	on(name: EVENT_NAMES, func: (data: any) => void) {
		events.on(name, func);
	},
	
	off(name: EVENT_NAMES, func: (data: any) => void) {
		events.off(name, func);
	},
	
	getFriend(account_id: string) {
		return friends.find(f => f.friend_data.id === account_id);
	},
	
	getPotentialFriend(account_id: string) {
		return potential_friends.find(f => f.id === account_id);
	},
	
	getRequestedFriend(account_id: string) {
		return requested_friends.find(f => f.id === account_id);
	},
	
	getFriendsList() {
		return friends;
	},
	
	getPotentialFriendsList() {
		return potential_friends;
	},
	
	requestFriend(friend_id: string) {
		send({type: SOCIAL_CODES.REQUEST_FRIEND, friend_id});
	},
	
	removeFriend(friend_id: string) {
		send({type: SOCIAL_CODES.REMOVE_FRIEND, friend_id});
	},
	
	acceptRequest(user_id: string) {
		send({type: SOCIAL_CODES.ACCEPT_REQUEST, user_id});
	},
	rejectRequest(user_id: string) {
		send({type: SOCIAL_CODES.REJECT_REQUEST, user_id});
	},
	
	sendChatMessage(recipient_id: string, content: string) {
		send({type: SOCIAL_CODES.SEND_CHAT_MESSAGE, recipient_id, content});
	}
}