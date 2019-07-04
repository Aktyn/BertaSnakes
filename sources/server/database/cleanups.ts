import {getCollection, COLLECTIONS} from "./database";

async function clearExpiredSessions() {
	let res = await getCollection(COLLECTIONS.sessions).deleteMany({
		expiration: {'$lte': Date.now()}
	});
	
	if((res.deletedCount||0) > 0)
		console.log('Expired sessions removed:', res.deletedCount);
}

async function clearBrokenFriendships() {//removes social messages that does not belong to any friendship
	//TODO: clear broken friendships function
}

async function clearOldMessages() {//removes social messages older than some threshold
	//TODO: clear old messages function
}

export default async function cleanUpAll() {
	await clearExpiredSessions();
	await clearBrokenFriendships();
	await clearOldMessages();
}