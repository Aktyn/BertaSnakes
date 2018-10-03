const SETTINGS = (function() {
	var self = {//DEFAULT SETTINGS VALUES
		//GAME
		game_panel_auto_hide: false,
		painter_resolution: 'MEDIUM',
		shadows_type: 'LONG',
		
		//MENU
		menu_background_effect: false,
		menu_click_effect: true,

		//CHAT
		chat_auto_hide_show: true
	};

	const PREFIX = 'BS_';//Berta Snakes
	const COOKIE_LIFETIME = 2 * 1000 * 60 * 60 * 24;//2 days (in miliseconds)

	function setCookie(name, value, exdays) {
	    document.cookie = name + '=' + value + ';' + 'expires=' +
	    	(new Date(Date.now() + COOKIE_LIFETIME)).toUTCString() + ';path=/';
	}

	function getCookie(name) {
	    try {
		   	return decodeURIComponent(document.cookie)
		   		.match(new RegExp('.*'+name+'=([^;]*)', 'i'))[1];
		}
		catch(e) {
			return undefined;//cookie not found
		}
	}

	function cast(value, type) {
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

	self.save = function() {
		Object.getOwnPropertyNames(self).forEach(prop => {
			if(typeof self[prop] === 'function')
				return;
			setCookie(PREFIX + prop, self[prop]);
		});
	};

	//loads settings from cookies
	Object.getOwnPropertyNames(self).forEach(prop => {
		if(typeof self[prop] === 'function')
			return;
		
		self[prop] = cast(getCookie( PREFIX + prop ) || self[prop], typeof self[prop]);
	});

	return self;
})();