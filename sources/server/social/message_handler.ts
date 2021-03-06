import SOCIAL_CODES, {SocialNetworkPackage} from '../../common/social_codes';
import Config from '../../common/config';
import SocialConnection from './social_connection';
import Conversations from './conversations_store';
import Database, {SocialMessage} from '../database';
import ERROR_CODES, {errorMsg} from "../../common/error_codes";
import {sendPushNotification} from "./notifications_sender";
import {trimString} from "../utils";

export async function handleMessage(connection: SocialConnection, message: SocialNetworkPackage) {
	switch (message.type) {
		default:
			console.error('Incorrect type value in JSON message:', message.type);
			break;
		case SOCIAL_CODES.REQUEST_FRIEND: {
			if(typeof message.friend_id !== 'string')
				break;
			let from_id = connection.account.id;
			//let to_account = await Database.getAccount(message.friend_id);
			//checking if requesting account exists
			let to_account_res = await Database.getUserPublicData(message.friend_id);
			if( to_account_res.error !== ERROR_CODES.SUCCESS || !to_account_res.data )
				break;
			let to_account = to_account_res.data;
			
			let res = await Database.insertAccountFriendRequest(from_id, to_account.id);
			if(res.error !== ERROR_CODES.SUCCESS) {
				console.error(errorMsg(res.error));
				break;
			}
			
			connection.onFriendRequestSent( to_account );
			
			let potential_friend_connections = SocialConnection.getConnections(to_account.id);
			if(potential_friend_connections) {
				let get_public_data_res = await Database.getUserPublicData(from_id);
				if( get_public_data_res.data ) {
					for(let potential_friend_conn of potential_friend_connections)
						potential_friend_conn.onFriendRequestReceived(get_public_data_res.data);
				}
			}
		}   break;
		case SOCIAL_CODES.REMOVE_FRIEND: {//friend_id: string
			if(typeof message.friend_id !== 'string')
				break;
			if( connection.removeFriend(message.friend_id) ) {
				
				let friend_connections = SocialConnection.getConnections(message.friend_id);
				if(friend_connections) {
					for(let friend_connection of friend_connections)
						friend_connection.removeFriend(connection.account.id);//remove self on friend's side
				}
				
				let res = await Database.removeFriendship(message.friend_id, connection.account.id);
				if(res.error !== ERROR_CODES.SUCCESS)
					console.error( errorMsg(res.error) );
			}
		}   break;
		case SOCIAL_CODES.ACCEPT_REQUEST: {//user_id: string
			if(typeof message.user_id !== 'string')
				break;
			
			if( connection.getFriends().length >= Config.MAXIMUM_NUMBER_OF_FRIENDS )//some limits are necessary
				break;
			
			let accept_db_res = await Database.acceptFriendship(connection.account.id, message.user_id);
			if(accept_db_res.error !== ERROR_CODES.SUCCESS)
				break;
			
			let friendship = await Database.getFriendshipID(connection.account.id, message.user_id);
			if( !friendship )
				break;
			
			let accepted_friend_connections = SocialConnection.getConnections(message.user_id);
			connection.onRequestAccepted(message.user_id, friendship.id, friendship.left, accepted_friend_connections);
			
			if(accepted_friend_connections) {
				for(let accepted_friend_connection of accepted_friend_connections) {
					accepted_friend_connection.onAccountAcceptedFriendRequest(
						connection.account.id, friendship.id, !friendship.left, connection);
				}
			}
		}   break;
		case SOCIAL_CODES.REJECT_REQUEST: {//user_id: string
			if (typeof message.user_id !== 'string')
				break;
			
			let reject_db_res = await Database.removeFriendship(message.user_id, connection.account.id);
			if(reject_db_res.error !== ERROR_CODES.SUCCESS)
				break;
			
			connection.onRequestRejected(message.user_id);
			
			let rejected_friend_connections = SocialConnection.getConnections(message.user_id);
			if(rejected_friend_connections) {
				for(let rejected_friend_connection of rejected_friend_connections)
					rejected_friend_connection.onAccountRejectedFriendRequest(connection.account.id);
			}
		}   break;
		case SOCIAL_CODES.REQUEST_CONVERSATION_DATA: {//friendship_id: string
			if (typeof message.friendship_id !== 'string')
				break;
			let conversation = await Conversations.getConversation(message.friendship_id);
			connection.send({
				type: SOCIAL_CODES.CONVERSATION_DATA,
				conversation,
				friendship_id: message.friendship_id
			});
		}   break;
		case SOCIAL_CODES.SEND_CHAT_MESSAGE: {//recipient_id: string, content: string
			if (typeof message.recipient_id !== 'string' || typeof message.content !== 'string')
				break;
			
			//anti-spam check for connection sending messages too frequent
			if( !connection.canSendChatMessage() ) {
				connection.sendSpamWarning();
				return;
			}
			
			let friend_data = connection.getFriend(message.recipient_id);
			if(!friend_data)//only messaging friend is allowed
				break;
			
			let recipient_connections = SocialConnection.getConnections(message.recipient_id);
			if( !recipient_connections ) {//making sure this user exists and fetch subscription data at the same time
				//let db_res = await Database.getUserPublicData(message.recipient_id);
				//if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.data)
				//	break;
				let db_res = await Database.getAccountSubscription(message.recipient_id);
				if(db_res.error !== ERROR_CODES.SUCCESS)
					break;
				if( db_res.subscription ) {
					sendPushNotification(db_res.subscription, {
						title: `Message from ${trimString(connection.account.username, 15)}`,
						author_id: connection.account.id,
						content: trimString(message.content, 30),
						icon: connection.account.avatar
					});
				}
			}
			
			//save message in database
			message.content = message.content.substr(0, Config.MAXIMUM_MESSAGE_LENGTH);
			//let timestamp = Date.now();
			
			let res = await Database.insertMessage(
				friend_data.friendship_id, friend_data.is_left, message.content);
			if(res.error !== ERROR_CODES.SUCCESS || !res.id || !res.timestamp)
				break;
			
			let msg: SocialMessage = {
				id: res.id,
				left: friend_data.is_left,
				timestamp: res.timestamp,
				content: [<string>message.content]
			};
			
			connection.registerLastMessageTimestamp(res.timestamp);
			
			await Conversations.store(friend_data.friendship_id, msg);
			
			let self_connections = connection.getAccountConnections();
			if(self_connections) {
				for(let self_connection of self_connections)
					self_connection.onMessage(friend_data.friendship_id, msg);
			}
			if(recipient_connections) {
				for(let recipient_connection of recipient_connections)
					recipient_connection.onMessage(friend_data.friendship_id, msg);
			}
			else {
				//await for this user to login to send him unread messages notification
				let awaits = SocialConnection.awaiting_messages.get(message.recipient_id);
				if(!awaits) {
					awaits = new Set();
					SocialConnection.awaiting_messages.set(message.recipient_id, awaits);
				}
				awaits.add( friend_data.friendship_id );
			}
		}   break;
	}
}