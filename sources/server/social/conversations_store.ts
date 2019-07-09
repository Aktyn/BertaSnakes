import Database, {SocialMessage} from '../database/database';
// import {pushSocialMessage} from '../../common/social_utils';
import ERROR_CODES, {errorMsg} from "../../common/error_codes";

//key is a friendship id
let conversations: Map<string, SocialMessage[]> = new Map();

export default {
	async getConversation(friendship_id: string) {
		let current = conversations.get(friendship_id);
		if(current)
			return current;//return from memory
		
		let conversation: SocialMessage[] = [];
		conversations.set(friendship_id, conversation);
		
		//load from database
		let db_res = await Database.loadSocialMessages(friendship_id);
		if( db_res.error !== ERROR_CODES.SUCCESS || !db_res.messages ) {
			console.error( errorMsg(db_res.error) );
			return conversation;
		}
		
		//push in reverse order
		for(let i=db_res.messages.length-1; i>=0; i--)
			conversation.push(db_res.messages[i]);
			//pushSocialMessage(conversation, db_res.messages[i]);
		//db_res.messages.forEach(db_msg => pushSocialMessage(conversation, db_msg));
		
		return conversation;
	},
	
	async store(friendship_id: string, message: SocialMessage) {
		let conversation = await this.getConversation(friendship_id);
		conversation.push(message);
		//pushSocialMessage(conversation, message);
	}
}