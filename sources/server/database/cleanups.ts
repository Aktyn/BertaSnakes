import {ObjectId} from 'mongodb';
import {getCollection, COLLECTIONS} from "./core";

async function clearExpiredSessions() {
	let res = await getCollection(COLLECTIONS.sessions).deleteMany({
		expiration: {'$lte': Date.now()}
	});
	
	if((res.deletedCount||0) > 0)
		console.log('Expired sessions removed:', res.deletedCount);
}

async function clearBrokenFriendships() {//removes social messages that does not belong to any friendship
	let res = await getCollection(COLLECTIONS.social_messages).aggregate([
		{
			$group: {
				_id: '$friendship_id',
				messages: {
					$push: '$_id'
				}
			}
		}, {
			$lookup: {
				from: COLLECTIONS.friendships,
				localField: '_id',
				foreignField: '_id',
				as: 'connected_friendship'
			}
		}, {
			$match: {
				connected_friendship: {
					$eq: []
				}
			}
		}, {
			$project: {
				_id: 0,
				messages: 1
			}
		}
	]).toArray() as {messages: ObjectId[]}[];
	
	let messages_to_remove: ObjectId[] = [];
	res.forEach(r => messages_to_remove.push(...r.messages));
	
	let delete_res = await getCollection(COLLECTIONS.social_messages).deleteMany({
		_id: {
			$in: messages_to_remove
		}
	});
	
	if((delete_res.deletedCount||0) > 0)
		console.log('Messages from broken friendships removed:', delete_res.deletedCount);
}

async function clearOldMessages() {//removes social messages older than some threshold
	let res = await getCollection(COLLECTIONS.social_messages).deleteMany({
		_id: {
			$lt: ObjectId.createFromTime((Date.now() - 1000*60*60*24*7 * 4) / 1000)//4 weeks
		}
	});
	if((res.deletedCount||0) > 0)
		console.log('Old messages removed:', res.deletedCount);
}

async function clearOldVisits() {
	let res = await getCollection(COLLECTIONS.visits).deleteMany({
		_id: {
			$lt: ObjectId.createFromTime((Date.now() - 1000*60*60*24 * 365) / 1000)//one year
		}
	});
	if((res.deletedCount||0) > 0)
		console.log('Old visits removed:', res.deletedCount);
}

async function clearGamesWithoutPlayers() {//remove from database game where no account was participating
	let res = await getCollection(COLLECTIONS.games).deleteMany({
		results: {
			$not: {
				$elemMatch: {
					account_id: {
						$exists: true
					}
				}
			}
		}
	});
	if((res.deletedCount||0) > 0)
		console.log('Games without players removed:', res.deletedCount);
}

export default async function cleanUpAll() {
	await clearExpiredSessions();
	await clearBrokenFriendships();
	await clearOldMessages();
	await clearOldVisits();
	await clearGamesWithoutPlayers();
}