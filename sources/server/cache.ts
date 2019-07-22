class Cache {
	public readonly data: any;
	private readonly expiration_date: number;

	constructor(lifetime: number, data: any) {
		this.data = data;
		this.expiration_date = Date.now() + lifetime;
	}

	expired() {
		return Date.now() > this.expiration_date;
	}
}

let cache_store: Map<string, Cache> = new Map();

export default {
	getCache: function(name: string): Cache | undefined {
		let cache = cache_store.get(name);

		if( cache && cache.expired() ) {
			cache_store.delete(name);
			//console.log('Expired cache:', name);
			return undefined;
		}

		return cache;
	},

	createCache: function(name: string, lifetime: number, data: any) {//lifetime - in milliseconds
		if( cache_store.has(name) ) {
			console.warn('Cache with given name already exists:', name);
			return;
		}
		//console.log('New cache object created:', name);
		cache_store.set(name, new Cache(lifetime, data));
	}
};