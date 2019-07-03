import SOCIAL_CODES, {SocialNetworkPackage} from '../../common/social_codes';
import SocialConnection from './social_connection';
import Database from '../database';
import ERROR_CODES, {errorMsg} from "../../common/error_codes";

export async function handleMessage(connection: SocialConnection, message: SocialNetworkPackage) {
	switch (message.type) {
		default:
			console.error('Incorrect type value in JSON message:', message.type);
			break;
		case SOCIAL_CODES.REMOVE_FRIEND: {//friend_id: string
			if(typeof message.friend_id !== 'string')
				break;
			if( connection.removeFriend(message.friend_id) ) {
				
				let friend_connection = SocialConnection.getConnection(message.friend_id);
				if(friend_connection)
					friend_connection.removeFriend(connection.account.id);//remove self on friend's side
				
				let res = await Database.removeFriendship(message.friend_id, connection.account.id);
				if(res.error !== ERROR_CODES.SUCCESS)
					console.error( errorMsg(res.error) );
			}
		}   break;
	}
}