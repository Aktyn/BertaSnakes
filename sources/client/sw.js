'use strict';
const DEBUG = false;

// When the user navigates to your site,
// the browser tries to redownload the script file that defined the service
// worker in the background.
// If there is even a byte's difference in the service worker file compared
// to what it currently has, it considers it 'new'.
const { assets } = global.serviceWorkerOption;

const CACHE_NAME = new Date().toISOString();

let assetsToCache = [...assets, './'];

assetsToCache = assetsToCache.map(path => {
    return new URL(path, global.location).toString();
});

// When the service worker is first added to a computer.
self.addEventListener('install', event => {
	// Perform install steps.
	if(DEBUG)
		console.log('[SW] Install event');

	// Add core website files to cache during serviceworker installation.
	event.waitUntil(
		global.caches.open(CACHE_NAME).then(async (cache) => {
			for(let asset of assetsToCache) {
				await cache.add(asset).catch(e => {
					if(DEBUG)
						console.log('Cannot add asset to cache:', asset);
				});
			}
			//return cache.addAll(assetsToCache);
		}).then(() => {
			if(DEBUG)
				console.log('Cached assets: main', assetsToCache)
		}).catch(error => {
			if(DEBUG)
				console.error(e);
		})
	);
});

// After the install event.
self.addEventListener('activate', event => {
	if(DEBUG)
		console.log('[SW] Activate event');

	// Clean the caches
	event.waitUntil(
		global.caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cacheName => {
					// Delete the caches that are not the current one.
					if (cacheName.indexOf(CACHE_NAME) === 0)
						return null;

					return global.caches.delete(cacheName);
				})
			)
		})
	);
});

self.addEventListener('message', event => {
	switch (event.data.action) {
		case 'skipWaiting':
			if(self.skipWaiting) {
				self.skipWaiting();
				self.clients.claim();
			}
			break
		default:
			break
	}
});

self.addEventListener('fetch', event => {
	const request = event.request;

	// Ignore not GET request.
	if (request.method !== 'GET') {
		if(DEBUG)
			console.log(`[SW] Ignore non GET request ${request.method}`);
		return;
	}

	const requestUrl = new URL(request.url);

	// Ignore difference origin.
	if (requestUrl.origin !== location.origin) {
		if(DEBUG)
			console.log(`[SW] Ignore difference origin ${requestUrl.origin}`);
		return;
	}

	const resource = global.caches.match(request).then(response => {
		if (response) {
			if(DEBUG)
				console.log(`[SW] fetch URL ${requestUrl.href} from cache`);
			return response;
		}

		// Load and cache known assets.
		return fetch(request).then(responseNetwork => {
			if(!responseNetwork || !responseNetwork.ok) {
				if(DEBUG) {
					console.log(
						`[SW] URL [${requestUrl.toString()}] wrong responseNetwork: ${
							responseNetwork.status
						} ${responseNetwork.type}`
					);
				}

				return responseNetwork;
			}

			if(DEBUG)
				console.log(`[SW] URL ${requestUrl.href} fetched`);

			const responseCache = responseNetwork.clone();

			global.caches.open(CACHE_NAME).then(cache => {
				return cache.put(request, responseCache);
			}).catch(e => {
				if(DEBUG)
					console.error(e);
			});
			return responseNetwork;
		}).catch(() => {
			// User is landing on our page.
			if(event.request.mode === 'navigate')
				return global.caches.match('./');

			return null;
		});
	});

	event.respondWith(resource);
});

//PUSH NOTIFICATIONS
self.addEventListener('push', function(event) {
	try {
		if(DEBUG)
			console.log(`[SW] Push notification received: "${event.data.text()}"`);
		
		let payload = event.data.text();
		/** @type {{title: string, body: string, icon: string, author_id: string}} */
		let final_data;
		
		try {
			/** @type {{title: string, author_id: string, content: string, icon: string}} */
			let data = JSON.parse(payload);
			final_data = {
				title: data.title || 'Uknown notification title',
				body: data.content || 'Unknown message',
				icon: self.location.host === 'localhost:3000' ?
					`http://localhost:5348/uploads/avatars/${data.icon}` :
					`${self.location.origin}/uploads/avatars/${data.icon}`,
				author_id: data.author_id
			};
		}
		catch(e) {
			//fallback to handle unsuported push message
			final_data = {
				title: 'Unknown notification',
				body: typeof payload === 'string' ? payload.substr(0, 64) : 'unknown message',
				icon: '',
				author_id: undefined
			};
		}
		
		const title = final_data.title;
		const options = {
			body: final_data.body,
			icon: final_data.icon,
			badge: final_data.icon,
			data: final_data.author_id
		};
		
		event.waitUntil( self.registration.showNotification(title, options) );
	}
	catch(e) {
		if(DEBUG)
			console.error(e);
	}
});

self.addEventListener('notificationclick', function(event) {
	if(DEBUG)
		console.log('[SW] Notification click Received.', self.location, clients);
	
	const account_id = event.notification.data;
	
	event.notification.close();
	//return;
	
	event.waitUntil((async () => {
		try {
			const allClients = await clients.matchAll({
				includeUncontrolled: true
			});
			
			let target_url = '/';
			if( account_id )
				target_url = `/users/${account_id}`;
			
			if (allClients.length === 0)//open new client if there is none
				await clients.openWindow(target_url);
			else {
				for (let client of allClients) {
					if (!client.focused) {//find first unfocused client
						client.navigate( target_url );//redirect it
						client.focus();//and focus
						return;
					}
				}
			}
		} catch (e) {
			if (DEBUG)
				console.error(e);
		}
	})());
});