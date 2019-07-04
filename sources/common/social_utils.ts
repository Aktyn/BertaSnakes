import {SocialMessage} from '../server/database/database';

function getPreviousMsgIndex(arr: SocialMessage[], timestamp: number) {
	for(let i=arr.length-1; i>=0; i--) {
		if(arr[i].timestamp < timestamp)
			return i;
	}

	return -1;
}

export function pushSocialMessage(arr: SocialMessage[], msg: SocialMessage) {
	let last_i = getPreviousMsgIndex(arr, msg.timestamp);
	
	//TODO - compare timestamps so following messages after one minute wont get stacked
	
	//same user wrote again since last message
	if(last_i !== -1 && arr[last_i].left === msg.left)//TODO: compare timestamp in this if
		arr[last_i].content.push(...msg.content);
	else {
		arr.splice(last_i + 1, 0, msg);
		//TODO - shift array if it is getting too big
	}
}