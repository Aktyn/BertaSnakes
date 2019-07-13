import {SocialMessage} from '../server/database/core';
import Config from './config';

declare var _CLIENT_: boolean;

function getPreviousMsgIndex(arr: SocialMessage[], timestamp: number) {
	for(let i=arr.length-1; i>=0; i--) {
		if(arr[i].timestamp < timestamp)
			return i;
	}

	return -1;
}

export function pushSocialMessage(arr: SocialMessage[], msg: SocialMessage) {
	let last_i = getPreviousMsgIndex(arr, msg.timestamp);
	
	//same user wrote again since last message but no more than minute after top message on stack
	if(last_i !== -1 && arr[last_i].left === msg.left && msg.timestamp - arr[last_i].timestamp < 1000*60)
		arr[last_i].content.push(...msg.content);
	else {
		arr.splice(last_i + 1, 0, msg);//push at proper position
		
		if( !_CLIENT_ ) {//shift array if it is getting too big (server-side only)
			while(arr.length > Config.MAXIMUM_LENGTH_OF_MESSAGES_CHUNK)
				arr.shift();
		}
	}
}