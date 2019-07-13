import {ObjectId} from 'mongodb';
import Config from '../../../common/config';

import {
	COLLECTIONS,
	extractUserPublicData,
	FriendSchema,
	getCollection,
	PublicAccountSchema,
	SocialMessage
} from '../core';
import ERROR_CODES from '../../../common/error_codes';

function mapFriendshipData(data: any[], is_left: boolean) {
	return data.map(friendship_data => {
		if( friendship_data['friend'].length < 1 )
			return null;
		return {
			friendship_id: (friendship_data['_id'] as ObjectId).toHexString(),
			friend_data: extractUserPublicData( friendship_data['friend'][0] ),
			is_left,
			online: false,
			room_data: null,
			is_playing: false
		} as FriendSchema;
	}).filter(acc => acc !== null) as FriendSchema[];
}

export default {
	async getFriendshipID(self_hex: string, friend_hex: string) {
		try {
			let self_id = ObjectId.createFromHexString(self_hex);
			let friend_id = ObjectId.createFromHexString(friend_hex);
			
			let found_on_left = await getCollection(COLLECTIONS.friendships).findOne({
				from: friend_id,
				to: self_id
			}, {projection: {_id: 1}});
			
			if(found_on_left) return {id: (found_on_left['_id'] as ObjectId).toHexString(), left: true};
			
			let found_on_right = await getCollection(COLLECTIONS.friendships).findOne({
				from: self_id,
				to: friend_id
			}, {projection: {_id: 1}});
			
			if(found_on_right) return {id: (found_on_right['_id'] as ObjectId).toHexString(), left: false};
			
			
			return null;
		}
		catch(e) {
			console.error(e);
			return null;
		}
	},
	
	async getAccountFriends(account_hex_id: string) {
		try {
			let account_id = ObjectId.createFromHexString(account_hex_id);
			let from_friends = await getCollection(COLLECTIONS.friendships).aggregate([
				{
					$match: {
						to: account_id,
						accepted: true
					}
				}, {
					$limit: Config.MAXIMUM_NUMBER_OF_FRIENDS
				}, {
					$lookup: {
						from: COLLECTIONS.accounts,
						localField: 'from',
						foreignField: '_id',
						as: 'friend'
					}
				}
			]).toArray();
			let to_friends = await getCollection(COLLECTIONS.friendships).aggregate([
				{
					$match: {
						from: account_id,
						accepted: true
					}
				}, {
					$limit: Config.MAXIMUM_NUMBER_OF_FRIENDS
				}, {
					$lookup: {
						from: COLLECTIONS.accounts,
						localField: 'to',
						foreignField: '_id',
						as: 'friend'
					}
				}
			]).toArray();
			
			let friends = mapFriendshipData(from_friends, true).concat(
				mapFriendshipData(to_friends, false)
			);
			
			return {error: ERROR_CODES.SUCCESS, friends};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getAccountFriendRequests(account_hex_id: string) {//returns those accounts who requested friendship
		try {
			let account_id = ObjectId.createFromHexString(account_hex_id);
			
			let requesting_friends = await getCollection(COLLECTIONS.friendships).aggregate([
				{
					$match: {
						accepted: false,//not accepted request
						to: account_id,//to given account
					}
				}, {
					$limit: Config.MAXIMUM_NUMBER_OF_FRIENDS
				}, {
					$lookup: {
						from: COLLECTIONS.accounts,
						localField: 'from',
						foreignField: '_id',
						as: 'requesting_friend'
					}
				}
			]).toArray();
			
			let potential_friends = requesting_friends.map(friendship_data => {
				if( friendship_data['requesting_friend'].length < 1 )
					return null;
				return extractUserPublicData( friendship_data['requesting_friend'][0] );
			}).filter(acc => acc !== null) as PublicAccountSchema[];
			
			return {error: ERROR_CODES.SUCCESS, potential_friends};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getAccountRequestedFriends(account_hex_id: string) {//returns those friends that user send request to
		try {
			let account_id = ObjectId.createFromHexString(account_hex_id);
			
			let requested_friends_res = await getCollection(COLLECTIONS.friendships).aggregate([
				{
					$match: {
						accepted: false,//not accepted request
						from: account_id,//from given account
					}
				}, {
					$limit: Config.MAXIMUM_NUMBER_OF_FRIENDS
				}, {
					$lookup: {
						from: COLLECTIONS.accounts,
						localField: 'to',
						foreignField: '_id',
						as: 'requested_friend'
					}
				}
			]).toArray();
			
			let requested_friends = requested_friends_res.map(friendship_data => {
				if( friendship_data['requested_friend'].length < 1 )
					return null;
				return extractUserPublicData( friendship_data['requested_friend'][0] );
			}).filter(acc => acc !== null) as PublicAccountSchema[];
			
			return {error: ERROR_CODES.SUCCESS, requested_friends};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async insertAccountFriendRequest(from_hex: string, to_hex: string) {
		try {
			const from_id = ObjectId.createFromHexString(from_hex);
			const to_id = ObjectId.createFromHexString(to_hex);
			
			//make sure that same friendship does not exists already
			let find_res = await getCollection(COLLECTIONS.friendships).findOne({
				$or: [//check both ways
					{
						from: from_id,
						to: to_id
					}, {
						from: to_id,
						to: from_id
					}
				]
			});
			if(find_res)
				return {error: ERROR_CODES.FRIENDSHIP_ALREADY_EXISTS};
			
			let insert_res = await getCollection(COLLECTIONS.friendships).insertOne({
				from: from_id,
				to: to_id,
				accepted: false
			});
			
			if( !insert_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async removeFriendship(friend1_id: string, friend2_id: string) {
		try {
			let id1 = ObjectId.createFromHexString(friend1_id);
			let id2 = ObjectId.createFromHexString(friend2_id);
			
			let remove_res = await getCollection(COLLECTIONS.friendships).deleteOne({
				$or: [
					{
						from: id1,
						to: id2
					}, {
						from: id2,
						to: id1
					}
				]
			});
			if( !remove_res.result.ok || !remove_res.deletedCount )
				return {error: ERROR_CODES.DATABASE_ERROR};
			
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async acceptFriendship(friend1_id: string, friend2_id: string) {
		try {
			let id1 = ObjectId.createFromHexString(friend1_id);
			let id2 = ObjectId.createFromHexString(friend2_id);
			
			let update_res = await getCollection(COLLECTIONS.friendships).updateOne({
				$or: [
					{
						from: id1,
						to: id2
					}, {
						from: id2,
						to: id1
					}
				]
			}, {
				$set: {
					accepted: true
				}
			});
			if( !update_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async insertMessage(friendship_hex: string, is_left_friend: boolean, content: string, timestamp: number) {
		try {
			let insert_res = await getCollection(COLLECTIONS.social_messages).insertOne({
				friendship_id: ObjectId.createFromHexString(friendship_hex),
				left: is_left_friend,
				timestamp,
				content
			});
			
			if( !insert_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS, id: insert_res.insertedId.toHexString()};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async loadSocialMessages(friendship_hex: string) {
		try {
			let messages_raw = await getCollection(COLLECTIONS.social_messages).aggregate([
				{
					$match: {
						friendship_id: ObjectId.createFromHexString(friendship_hex)
					}
				}, {
					$sort: {timestamp: -1}
				}, {
					$project: {
						_id: 1,
						left: 1,
						timestamp: 1,
						content: 1
					}
				}, {
                    $limit: Config.MAXIMUM_LENGTH_OF_MESSAGES_CHUNK
                }
			]).toArray();
			
			let messages = messages_raw.map(msg => {
				return {
					id: (msg['_id'] as ObjectId).toHexString(),
					left: msg['left'],
					timestamp: msg['timestamp'],
					content: [ msg['content'] ]
				}
			}) as SocialMessage[];
			
			return {error: ERROR_CODES.SUCCESS, messages};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	}
}