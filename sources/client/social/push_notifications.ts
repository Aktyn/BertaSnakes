import SwManager from '../sw_manager';
import {AccountSchema} from '../account';
import ERROR_CODES from "../../common/error_codes";
import ServerApi from '../utils/server_api';

function updateAccountSubscription(subscription: PushSubscriptionJSON | null, token: string) {
	return ServerApi.postRequest('/update_account_subscription', {
		token,
		subscription: subscription !== null ? JSON.stringify(subscription) : null
	});
}

export default {
	subscribe(account: AccountSchema, token: string) {
		SwManager.onceInitialized(async () => {
			let current_subscription = SwManager.getPushSubscription();
			//console.log(account.subscription, current_subscription);
			if( !current_subscription ) {//service worker has no subscription
				let res = await SwManager.subscribeNotifications();
				if(res.error !== ERROR_CODES.SUCCESS || !res.subscription)
					return;
				updateAccountSubscription(res.subscription.toJSON(), token).catch(console.error);
			}
			//service worker has subscription but it is not match this on server-side
			else if( JSON.stringify(current_subscription.toJSON()) !== account.subscription ) {
				updateAccountSubscription(current_subscription.toJSON(), token).catch(console.error);
			}
		});
	},
	
	async unsubscribe(token: string) {
		await SwManager.unsubscribeNotifications();
		updateAccountSubscription(null, token).catch(console.error);
	}
}