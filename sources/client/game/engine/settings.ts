import Device from './device';
import {PAINTER_RESOLUTION} from '../../../common/game/paint_layer';

const DEFAULTS = {
	'shadows_type': 'LONG',//'LONG', 'FLAT;
	'advanced_shaders': true,
	'painter_resolution': Device.isMobile() ? PAINTER_RESOLUTION.MEDIUM : PAINTER_RESOLUTION.HIGH,
	'particles': true,
	'weather_particles': true,
	'auto_hide_right_panel': Device.isMobile(),
	'auto_hide_chat': true,
	'sound_volume': Device.isMobile() ? 1.0 : 0.5,
};

type setting_name = keyof typeof DEFAULTS;

//stores key: value pairs 
let settings_store: {[index: string]: boolean | string | number} = {};
let watchers: {[index: string]: (value: boolean | string | number) => void} = {};

let storage = typeof localStorage === 'undefined' ? {
	removeItem: () => {},
	setItem: () => {}
} : localStorage;

const Settings = {
	setValue: (key: setting_name, value?: boolean | string | number) => {
		if(value === undefined)
			return Settings.remove(key);

		settings_store[key] = value;

		storage.setItem(key, JSON.stringify({
			type: typeof value,
			value: value.toString()
		}));

		if(typeof watchers[key] === 'function')
			watchers[key](value);
	},

	getValue: (key: setting_name): boolean | string | number | undefined => {
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

	remove(key: setting_name) {
		delete settings_store['key'];
		storage.removeItem(key);
	},

	//Set all settings to default values
	reset() {
		for(let [key, value] of Object.entries(DEFAULTS))
			this.setValue(key as setting_name, value);
	},

	watch(key: setting_name, callback?: (value: boolean | string | number) => void) {
		if(callback === undefined)
			delete watchers[key];
		else
			watchers[key] = callback;
	}
};

export default Settings;
