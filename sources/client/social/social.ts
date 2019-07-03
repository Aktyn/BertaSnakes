import Config from '../../common/config';
import SOCIAL_CODES, {SocialNetworkPackage} from '../../common/social_codes';
import ERROR_CODES from '../../common/error_codes';
import {FriendSchema} from '../../server/social/social_connection';
import Events from "../utils/events";
import {PublicAccountSchema} from "../../server/database";

export {FriendSchema} from '../../server/social/social_connection';

let friends: FriendSchema[] = [];
let potential_friends: PublicAccountSchema[] = [];
let events = new Events();

export const enum EVENT_NAMES {
	ON_FRIENDS_LIST_UPDATE = 'on_friends_update',
	ON_FRIENDS_REQUEST_UPDATE = 'on_friends_request_update'
}

function sortFriends() {
	friends.sort((a) => a.online ? -1 : 1);
}

let socket: WebSocket | null = null;

function handleMessage(message: SocialNetworkPackage) {
	switch (message.type) {
		default:
			throw new Error('Unknown social message type: ' + message.type);
		case SOCIAL_CODES.FRIENDS_LIST:
			friends = message.friends;
			sortFriends();
			events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			break;
		case SOCIAL_CODES.FRIEND_REQUESTS_LIST://potential_friends: PublicAccountSchema
			potential_friends = message.potential_friends;
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, potential_friends);
			break;
		case SOCIAL_CODES.ON_FRIEND_WENT_ONLINE: {
			let friend = friends.find(f => f.friend_data.id === message.friend_id);
			if(friend) {
				friend.online = true;
				sortFriends();
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			}
		}   break;
		case SOCIAL_CODES.ON_FRIEND_WENT_OFFLINE: {
			let friend = friends.find(f => f.friend_data.id === message.friend_id);
			if(friend) {
				friend.online = false;
				sortFriends();
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			}
		}   break;
		case SOCIAL_CODES.ON_FRIEND_REMOVED: {
			let friend_index = friends.findIndex(f => f.friend_data.id === message.friend_id);
			if(friend_index !== -1) {
				friends.splice(friend_index, 1);
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			}
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
	
	getFriendsList() {
		return friends;
	},
	
	getPotentialFriendsList() {
		return potential_friends;
	},
	
	removeFriend(friend_id: string) {
		send({type: SOCIAL_CODES.REMOVE_FRIEND, friend_id});
	}
}