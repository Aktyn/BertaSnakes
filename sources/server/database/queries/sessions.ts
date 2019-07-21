import {ObjectId} from 'mongodb';

import ERROR_CODES from "../../../common/error_codes";
import {getCollection, COLLECTIONS} from "..";

export default {
	async addSession(_account_id: string, _token: string, _expiration_date: number) {
		try {
			let sessions = getCollection(COLLECTIONS.sessions);
			let target_id = ObjectId.createFromHexString(_account_id);

			//first - remove previous session account session if one exists
			await sessions.deleteOne({
				account_id: target_id
			});

			let res = await sessions.insertOne({
				account_id: target_id,
				token: _token,
				expiration: _expiration_date
			});

			if(!res.result.ok)
				return {error: ERROR_CODES.DATABASE_ERROR};
			
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},

	async getSession(_token: string) {//returns account's id
		try {
			let session_data = await getCollection(COLLECTIONS.sessions).findOne({
				token: _token
			});
			if(session_data && session_data.expiration > Date.now() &&
				typeof session_data.account_id === 'object')
			{
				return (session_data.account_id as ObjectId).toHexString();
			}
			return null;
		}
		catch(e) {
			console.error(e);
			return null;
		}
	},
}