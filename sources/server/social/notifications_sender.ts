import * as webpush from 'web-push';
import {getArgument} from '../utils';
import Email from '../email';

const PRIVATE_KEY = getArgument('PUSH_SERVICE_PRIVATE_KEY');
const TIMESTAMP_SAMPLES = 4;

webpush.setVapidDetails(
	`mailto: ${Email.getAddress()}`,
	'BJWUuo07UNqWGCazPhDTJyyQ9MZYd5pAqNK48OZXiSxq06IO0YmcXFXiU0N6UAB2IG3qQ0W3WncEbexn8AuBBEI',
	PRIVATE_KEY
);

interface NotificationSchema {
	title: string;
	author_id: string;
	content: string;
	icon: string;
}

function onError(e: Error) {
	console.error('Cannot send notification: ' + e);
}

//anti-spam
let authors_timestamps = new Map<string, number[]>();//<account_id, timestamps>

function registerTimestamp(author_id: string) {
	let timestamps = authors_timestamps.get(author_id);
	if(!timestamps) {
		timestamps = [];
		authors_timestamps.set(author_id, timestamps);
	}
	
	timestamps.push( Date.now() );
	while( timestamps.length > TIMESTAMP_SAMPLES )//store last N message timestamps
		timestamps.shift();
}

function canSendChatMessage(author_id: string) {
	let timestamps = authors_timestamps.get(author_id);
	if(!timestamps)
		return true;
	
	return timestamps.length < TIMESTAMP_SAMPLES ||
		(Date.now() - timestamps[0]) > 1000*60;//one minute per 4 messages
}

export function sendPushNotification(subscription_string: string, data: NotificationSchema) {
	try {
		if( !canSendChatMessage(data.author_id) )
			return;
		registerTimestamp(data.author_id);
		
		let subscription: PushSubscriptionJSON = JSON.parse(subscription_string);
		//console.log('sending notification:', data, subscription);
		
		const pushSubscription = {
			endpoint: subscription.endpoint as string,
			keys: {
				auth:   (subscription.keys as Record<string, string>)['auth'],
				p256dh: (subscription.keys as Record<string, string>)['p256dh']
			}
		};
		
		webpush.sendNotification(pushSubscription, JSON.stringify(data)).catch(onError);
	}
	catch(e) {
		onError(e);
	}
}