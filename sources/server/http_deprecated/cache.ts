
class Cache {
	readonly data: any;
	private expiration_date: number;

	constructor(lifetime: number, data: any) {
		this.data = data;
		this.expiration_date = Date.now() + lifetime;
	}

	expired() {
		return Date.now() > this.expiration_date;
	}
}

interface CacheStore {
	[index: string]: Cache
}

var cache_store: CacheStore = {};

export default {
	getCache: function(name: string): Cache | undefined {
		var cache = cache_store[name];

		if(cache && cache.expired()) {
			delete cache_store[name];
			console.log('Expired cache:', name);
			return undefined;
		}

		return cache;
	},

	createCache: function(name: string, lifetime: number, data: any) {//lifetime - in miliseconds
		console.log('New cache object created:', name);
		cache_store[name] = new Cache(lifetime, data);
	}
};