interface SettingsI {
	game_panel_auto_hide: boolean;
	weather_particles: boolean;
	painter_resolution: string;
	shadows_type: string;
	menu_background_effect: boolean;
	menu_click_effect: boolean;
	chat_auto_hide_show: boolean;

	save(): void;

	[index: string]: any;
}

const SETTINGS = (function() {
	var self: SettingsI = {//DEFAULT SETTINGS VALUES
		//GAME
		game_panel_auto_hide: true,
		weather_particles: true,
		//TODO - make MEDIUM default for mobile devices and default false for menu effects and more...
		painter_resolution: 'HIGH',//'LOW', 'MEDIUM', 'HIGH', 
		shadows_type: 'LONG',
		
		//MENU
		menu_background_effect: false,
		menu_click_effect: true,

		//CHAT
		chat_auto_hide_show: true,//DEFAULT DISABLE FOR MOBILE

		save: function() {
			Object.getOwnPropertyNames(self).forEach(prop => {
				if(typeof self[prop] !== 'function') 
					setCookie(PREFIX + prop, self[prop]);
			});
		}
	};

	const PREFIX = 'BS_';//Berta Snakes
	const COOKIE_LIFETIME = 1000 * 60 * 60 * 24 * 7;//7 days (in miliseconds)

	function setCookie(name: string, value: string | number/*, exdays*/) {
	    document.cookie = name + '=' + value + ';' + 'expires=' +
	    	(new Date(Date.now() + COOKIE_LIFETIME)).toUTCString() + ';path=/';
	}

	function getCookie(name: string) {
	    try {
	    	//@ts-ignore
		   	return decodeURIComponent(document.cookie).match(new RegExp('.*'+name+'=([^;]*)', 'i'))[1];
		}
		catch(e) {
			return undefined;//cookie not found
		}
	}

	function cast(value: any, type: string) {
		$$.assert(value !== undefined && value !== null, 'Given value must be defined');
		switch(type) {
			default:
			case 'string':
				return String(value);
			case 'boolean':
				return value === 'true' || value === true;
			case 'number':
				return Number(value);
		}
		throw new Error('undefined data type');
	}

	//loads settings from cookies
	Object.getOwnPropertyNames(self).forEach(prop => {
		if(typeof self[prop] !== 'function')
			self[prop] = cast(getCookie( PREFIX + prop ) || self[prop], typeof self[prop]);
	});

	return self;
})();