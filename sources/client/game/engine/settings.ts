import Device from './device';
const device_info = Device.getInfo();

function extendType<T>(target: T): T & {[index: string]: string | number | boolean} {
	return target as T & {[index: string]: string | number | boolean};
}

const DEFAULTS = extendType({
	'shadows_type': 'LONG',//'LONG', 'FLAT;
	'painter_resolution': device_info.is_mobile ? 'MEDIUM' : 'HIGH',
	'sound_effects': device_info.is_mobile ? 1.0 : 0.5,
	'weather_particles': true,
});

//stores key: value pairs 
let settings_store: {[index: string]: boolean | string | number} = {};
let watchers: {[index: string]: (value: boolean | string | number) => void} = {};

const SETTINGS = {
	setValue: (key: string, value?: boolean | string | number) => {
		if(value === undefined)
			return SETTINGS.remove(key);

		settings_store[key] = value;

		localStorage.setItem(key, JSON.stringify({
			type: typeof value,
			value: value.toString()
		}));

		if(typeof watchers[key] === 'function')
			watchers[key](value);
	},

	getValue: (key: string): boolean | string | number | undefined => {
		let stored_item: string | null;
		if(settings_store[key] !== undefined)
			return settings_store[key];
		else if ((stored_item = localStorage.getItem(key)) !== null) {
			let item: {type: string, value: string} = JSON.parse( stored_item );
			switch(item.type) {
				case 'string': 	return (settings_store[key] = item.value);
				case 'boolean':	return (settings_store[key] = item.value === 'true');
				case 'number': 	return (settings_store[key] = Number(item.value));
			}
			throw new Error('Incorrect type: ' + item.type);
		}
		if(DEFAULTS[key] !== undefined)
			return DEFAULTS[key];
		throw new Error('Cannot retrieve setting value of key: ' + key);
	},

	remove(key: string) {
		delete settings_store['key'];
		localStorage.removeItem(key);
	},

	//Set all settings to default values
	reset() {
		for(let [key, value] of Object.entries(DEFAULTS))
			this.setValue(key, value);
	},

	watch(key: string, callback?: (value: boolean | string | number) => void) {
		if(callback === undefined)
			delete watchers[key];
		else
			watchers[key] = callback;
	}
}

export default SETTINGS;
