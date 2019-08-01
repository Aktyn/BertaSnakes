import ERROR_CODES from "../common/error_codes";

const runtime = require('serviceworker-webpack-plugin/lib/runtime');//no types for this package

const enum STATUS {
	NOT_INITIALIZED,
	PENDING,
	INITIALIZED,
	ERROR
}

const service_worker_support = 'serviceWorker' in navigator &&
	(window.location.protocol === 'https:' || window.location.hostname === 'localhost');

export interface BeforeInstallPromptEvent extends Event {
	prompt: () => void;
	userChoice: Promise<{outcome: string; platform: string}>;
}

let sw_status = STATUS.NOT_INITIALIZED;
let ready_to_install_event: BeforeInstallPromptEvent | null = null;
let initialization_listeners: (() => void)[] = [];
let ready_to_install_listeners: ((e: BeforeInstallPromptEvent) => void)[] = [];
let push_subscription: PushSubscription | null = null;

let sw_handle: ServiceWorkerRegistration | null = null;

//generated here: https://web-push-codelab.glitch.me/
// noinspection SpellCheckingInspection
const public_key = 'BJWUuo07UNqWGCazPhDTJyyQ9MZYd5pAqNK48OZXiSxq06IO0YmcXFXiU0N6UAB2IG3qQ0W3WncEbexn8AuBBEI';

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+')
		.replace(/_/g, '/');
	
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	
	for(let i = 0; i < rawData.length; ++i)
		outputArray[i] = rawData.charCodeAt(i);
	return outputArray;
}

if(service_worker_support) {
	window.addEventListener('beforeinstallprompt', (e) => {
		//console.log(e);
		e.preventDefault();
		
		ready_to_install_event = <BeforeInstallPromptEvent>e;
		ready_to_install_listeners.forEach(listener => listener(<BeforeInstallPromptEvent>e));
	});
}

export default {
	async init() {
		if(sw_status !== STATUS.NOT_INITIALIZED)
			return;
		sw_status = STATUS.PENDING;
		if(/*process.env.NODE_ENV !== 'development' && */service_worker_support) {
			try {
				sw_handle = await runtime.register();
				if( !sw_handle )
					throw new Error("Cannot register service worker");
				console.log('Service worker is registered');

				push_subscription = await sw_handle.pushManager.getSubscription();
				
				sw_status = STATUS.INITIALIZED;
				initialization_listeners.forEach(callback => callback());
			}
			catch(e) {
				sw_status = STATUS.ERROR;
				console.error('Error in service worker management: ' + e);
			}
		}
	},
	
	onceInitialized(callback: () => void) {
		if(sw_status !== STATUS.INITIALIZED)
			initialization_listeners.push( callback );
		else
			callback();
	},
	
	onReadyToInstall(callback: (e: BeforeInstallPromptEvent) => void) {
		ready_to_install_listeners.push(callback);
		if( ready_to_install_event )
			callback(ready_to_install_event);
	},
	
	offReadyToInstall(callback: (e: BeforeInstallPromptEvent) => void) {
		let index = ready_to_install_listeners.indexOf(callback);
		if(index === -1)
			console.warn('Cannot remove readyToInstall listener.');
		else
			ready_to_install_listeners.splice(index, 1);
	},
	
	getPushSubscription() {
		return push_subscription;
	},
	
	async subscribeNotifications() {
		if(!sw_handle)
			return {error: ERROR_CODES.SERVICE_WORKER_IS_NOT_INITIALIZED};
		try {
			const applicationServerKey = urlBase64ToUint8Array(public_key);
			let subscription = await sw_handle.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: applicationServerKey
			});
			
			//console.log(subscription);
			
			push_subscription = subscription;
			return {error: ERROR_CODES.SUCCESS, subscription};
		}
		catch(e) {//permission denied
			//console.error('Failed to subscribe push notifications: ' + e);
			push_subscription = null;
			return {error: ERROR_CODES.CANNOT_SUBSCRIBE_PUSH_NOTIFICATIONS};
		}
	},
	
	async unsubscribeNotifications() {
		if(!sw_handle)
			return ERROR_CODES.SERVICE_WORKER_IS_NOT_INITIALIZED;
		try {
			let subscription = await sw_handle.pushManager.getSubscription();
			push_subscription = null;
			
			if (subscription)
				await subscription.unsubscribe();
			else
				return ERROR_CODES.CANNOT_FIND_CURRENT_SUBSCRIPTION;
				
			return ERROR_CODES.SUCCESS;
		}
		catch(e) {
			console.error('Failed to unsubscribe push notifications: ' + e);
			return ERROR_CODES.CANNOT_UNSUBSCRIBE_PUSH_NOTIFICATIONS;
		}
	}
}