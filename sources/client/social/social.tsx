import * as React from 'react';
import NotificationsIndicator, {COMMON_LABELS, NotificationSchema} from '../components/widgets/notifications_indicator';
import Config from '../../common/config';
import SOCIAL_CODES, {SocialNetworkPackage} from '../../common/social_codes';
import ERROR_CODES from '../../common/error_codes';
import Events from "../utils/events";

import {FriendSchema, PublicAccountSchema} from "../../server/database/core";
import AccountSidepop, {VIEWS} from "../components/sidepops/account_sidepop";
import UserSidepop from "../components/sidepops/user_sidepop";
import Chat from './chat';

export {FriendSchema} from '../../server/database/core';

let friends: FriendSchema[] = [];
let potential_friends: PublicAccountSchema[] = [];
let requested_friends: PublicAccountSchema[] = [];
let events = new Events();

export const enum EVENT_NAMES {
	ON_DISCONNECT = 0,
	ON_FRIENDS_LIST_UPDATE,
	ON_FRIENDS_REQUEST_UPDATE,
	ON_CHAT_MESSAGE,
	ON_CONVERSATION_DATA,
	ON_SPAM_WARNING
}

function sortFriends() {
	friends.sort((a) => a.online ? -1 : 1);
}

let socket: WebSocket | null = null;
let saved_token: string | null = null;

function handleMessage(message: SocialNetworkPackage) {
	switch (message['type']) {
		default:
			throw new Error('Unknown social message type: ' + message['type']);
			
		case SOCIAL_CODES.FRIENDS_LIST://friends: FriendsSchema[], awaiting_conversations: [friendship_id: string]
			friends = message['friends'];
			sortFriends();
			events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			
			for(let friendship_id of message['awaiting_conversations'] as string[]) {
				let friendship = Social.getFriendByFriendshipID(friendship_id);
				if(friendship) {
					NotificationsIndicator.push({
						content: Chat.getNotificationText(friendship.friend_data.username),
						custom_data: {user_id: friendship.friend_data.id},
						render: (custom_data, onClose) => {
							return <UserSidepop account_id={custom_data.user_id} onClose={onClose} focus_chat={true}/>;
						}
					} as NotificationSchema<{ user_id: string }>);
				}
			}
			break;
		case SOCIAL_CODES.FRIEND_REQUESTS_LIST://potential_friends: PublicAccountSchema[]
			potential_friends = message['potential_friends'];
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			if(potential_friends.length > 0) {
				NotificationsIndicator.push({
					content: COMMON_LABELS.PENDING_FRIEND_REQUESTS + potential_friends.length,
					custom_data: {},
					render: (custom_data, onClose) => {
						return <AccountSidepop onClose={onClose} force_view={VIEWS.FRIENDS} />;
					}
				} as NotificationSchema<{ user_id: string }>);
			}
			break;
		case SOCIAL_CODES.REQUESTED_FRIENDS_LIST://requested_friends: PublicAccountSchema[]
			requested_friends = message['requested_friends'];
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			break;
		case SOCIAL_CODES.CONVERSATION_DATA: {//friendship_id: string, conversation: SocialMessage[]
			events.emit(EVENT_NAMES.ON_CONVERSATION_DATA, {
				friendship_id: message['friendship_id'],
				conversation: message['conversation']
			});
		}   break;
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
		case SOCIAL_CODES.ON_FRIEND_ROOM_DATA_UPDATE: {//friend_id: string, room_data: RoomCustomData | null
			let friend = friends.find(f => f.friend_data.id === message['friend_id']);
			if(friend) {
				friend.room_data = message['room_data'];
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			}
		}   break;
		case SOCIAL_CODES.ON_FRIEND_IS_PLAYING_STATE_UPDATE: {//friend_id: string, is_playing: boolean
			let friend = friends.find(f => f.friend_data.id === message['friend_id']);
			if(friend) {
				friend.is_playing = message['is_playing'];
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
			}
		}   break;
		
		case SOCIAL_CODES.ON_FRIEND_REQUEST_RECEIVED: {//potential_friend: PublicAccountSchema
			potential_friends.push( message['potential_friend'] );
			
			NotificationsIndicator.push({
				content: COMMON_LABELS.FRIEND_REQUEST,
				custom_data: {},
				render: (custom_data, onClose) => {
					return <AccountSidepop onClose={onClose} force_view={VIEWS.FRIENDS} />;
				}
			} as NotificationSchema<{ user_id: string }>);
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
		}   break;
		case SOCIAL_CODES.ON_FRIEND_REQUEST_SENT: {//potential_friend: PublicAccountSchema
			requested_friends.push( message['potential_friend'] );
			events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
		}   break;
		
		case SOCIAL_CODES.ON_FRIEND_REMOVED: {
			let friend_index = friends.findIndex(f => f.friend_data.id === message['friend_id']);
			let old_friend = friends[friend_index];
			if(friend_index !== -1) {
				NotificationsIndicator.push({
					content: old_friend.friend_data.username + COMMON_LABELS.FRIEND_REMOVED,
					custom_data: {},
					render: (custom_data, onClose) => {
						return <UserSidepop onClose={onClose} account_id={old_friend.friend_data.id} />;
					}
				} as NotificationSchema<{ user_id: string }>);
				
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
				let user_that_rejected = requested_friends[requested_friend_index];
				NotificationsIndicator.push({
					content: user_that_rejected.username + COMMON_LABELS.FRIEND_REQUEST_REJECTED,
					custom_data: {},
					render: (custom_data, onClose) => {
						return <UserSidepop onClose={onClose} account_id={user_that_rejected.id} />;
					}
				} as NotificationSchema<{ user_id: string }>);
				
				requested_friends.splice(requested_friend_index, 1);
				events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			}
		}   break;
		case SOCIAL_CODES.ON_FRIEND_REQUEST_ACCEPTED: {//accepted_friend_id: string, online: boolean
														//room_data: RoomCustomData[] | null, is_playing: boolean
			let accepted_friend_index = potential_friends
				.findIndex(f => f.id === message['accepted_friend_id']);
			if(accepted_friend_index !== -1) {
				//move potential friend to friends array
				friends.push({
					online: message['online'],
					friendship_id: message['friendship_id'],
					is_left: message['is_left'],
					friend_data: potential_friends[accepted_friend_index],
					room_data: message['room_data'],
					is_playing: message['is_playing']
				});
				sortFriends();
				potential_friends.splice(accepted_friend_index, 1);//it is no more potential friend
				
				events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
				events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
			}
		}   break;
		case SOCIAL_CODES.ON_ACCOUNT_ACCEPTED_FRIEND_REQUEST: {//requested_friend_id: string
			let requested_friend_index = requested_friends
				.findIndex(f => f.id === message['requested_friend_id']);
			if(requested_friend_index !== -1) {
				let new_friend = requested_friends[requested_friend_index];
				//move requested friend to friends array
				friends.push({
					online: true,//obviously he is online because he just accepted request
					friendship_id: message['friendship_id'],
					is_left: message['is_left'],
					friend_data: new_friend,
					room_data: message['room_data'],
					is_playing: message['is_playing']
				});
				sortFriends();
				requested_friends.splice(requested_friend_index, 1);//it is no more requested friend
				
				NotificationsIndicator.push({
					content: COMMON_LABELS.FRIEND_REQUEST_ACCEPTED + new_friend.username,
					custom_data: {},
					render: (custom_data, onClose) => {
						return <UserSidepop onClose={onClose} account_id={new_friend.id} />;
					}
				} as NotificationSchema<{ user_id: string }>);
				
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
		case SOCIAL_CODES.SPAM_WARNING: {
			events.emit(EVENT_NAMES.ON_SPAM_WARNING, {});
		}   break;
	}
	console.log(message);
}

function send(data: SocialNetworkPackage) {
	try {
		if(socket === null) {
			if(saved_token)//connection was attempted
				Social.connect(saved_token);//try again
			throw new Error('socket is null');
		}
		socket.send( JSON.stringify(data) );
		return ERROR_CODES.SUCCESS;
	}
	catch(e) {
		console.error('Cannot send message, reason:', e);
		return ERROR_CODES.CANNOT_SEND_JSON_MESSAGE;
	}
}

const Social = {
	connect(token: string) {
		saved_token = token;
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
				//console.log('Incoming social data size:',
				//	(new Blob([msg.data]).size/1024).toFixed(2), 'kb');
				handleMessage( JSON.parse(msg.data) );
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
		friends = [];
		potential_friends = [];
		requested_friends = [];
		
		events.emit(EVENT_NAMES.ON_CONVERSATION_DATA, null);
		events.emit(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, {potential_friends, requested_friends});
		events.emit(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, friends);
		events.emit(EVENT_NAMES.ON_DISCONNECT, undefined);
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
	
	getFriendByFriendshipID(friendship_id: string) {
		return friends.find(f => f.friendship_id === friendship_id);
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
		return send({type: SOCIAL_CODES.REQUEST_FRIEND, friend_id});
	},
	
	removeFriend(friend_id: string) {
		return send({type: SOCIAL_CODES.REMOVE_FRIEND, friend_id});
	},
	
	acceptRequest(user_id: string) {
		return send({type: SOCIAL_CODES.ACCEPT_REQUEST, user_id});
	},
	rejectRequest(user_id: string) {
		return send({type: SOCIAL_CODES.REJECT_REQUEST, user_id});
	},
	
	sendChatMessage(recipient_id: string, content: string) {
		return send({type: SOCIAL_CODES.SEND_CHAT_MESSAGE, recipient_id, content});
	},
	
	requestFriendshipConversationData(friendship_id: string) {
		return send({type: SOCIAL_CODES.REQUEST_CONVERSATION_DATA, friendship_id});
	}
};

export default Social;