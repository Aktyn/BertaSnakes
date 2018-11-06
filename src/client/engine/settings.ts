///<reference path="device.ts"/>

// const SETTINGS = (function() {
namespace SETTINGS {
	/*interface SettingsI {
		game_panel_auto_hide: boolean;
		weather_particles: boolean;
		painter_resolution: string;
		shadows_type: string;
		menu_background_effect: boolean;
		menu_click_effect: boolean;
		chat_auto_hide_show: boolean;

		save(): void;

		[index: string]: any;
	}*/
	const PREFIX = 'BS_';//Berta Snakes
	const COOKIE_LIFETIME = 1000 * 60 * 60 * 24 * 7;//7 days (in miliseconds)

	function setCookie(name: string, value: string | number | boolean) {
	    document.cookie = name + '=' + value + ';' + 'expires=' +
	    	(new Date(Date.now() + COOKIE_LIFETIME)).toUTCString() + ';path=/';
	}

	//var self: SettingsI = {//DEFAULT SETTINGS VALUES
	//GAME
	export var game_panel_auto_hide = true;
	export var weather_particles = true;
	
	export var painter_resolution = Device.info.is_mobile ? 'MEDIUM' : 'HIGH';//'LOW', 'MEDIUM', 'HIGH'
	export var shadows_type = 'LONG';//'LONG', 'FLAT;
	
	//MENU
	export var menu_background_effect = false;
	export var menu_click_effect = !Device.info.is_mobile;//DISABLE FOR MOBIL

	//CHAT
	export var chat_auto_hide_show = !Device.info.is_mobile;//DISABLE FOR MOBIL

	export function saveAsCookies() {
		/*Object.getOwnPropertyNames(self).forEach(prop => {
			if(typeof self[prop] !== 'function') 
				setCookie(PREFIX + prop, self[prop]);
		});*/
		setCookie(PREFIX + 'game_panel_auto_hide', game_panel_auto_hide);
		setCookie(PREFIX + 'weather_particles', weather_particles);
		setCookie(PREFIX + 'painter_resolution', painter_resolution);
		setCookie(PREFIX + 'shadows_type', shadows_type);
		setCookie(PREFIX + 'menu_background_effect', menu_background_effect);
		setCookie(PREFIX + 'menu_click_effect', menu_click_effect);
		setCookie(PREFIX + 'chat_auto_hide_show', chat_auto_hide_show);
	}
	//};
	

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
	game_panel_auto_hide = <boolean>cast(getCookie(
		PREFIX + 'game_panel_auto_hide' ) || game_panel_auto_hide, typeof game_panel_auto_hide);
	weather_particles = <boolean>cast(getCookie(
		PREFIX + 'weather_particles' ) || weather_particles, typeof weather_particles);
	painter_resolution = <string>cast(getCookie(
		PREFIX + 'painter_resolution' ) || painter_resolution, typeof painter_resolution);
	shadows_type = <string>cast(getCookie(
		PREFIX + 'shadows_type' ) || shadows_type, typeof shadows_type);
	menu_background_effect = <boolean>cast(getCookie(
		PREFIX + 'menu_background_effect' ) || menu_background_effect, typeof menu_background_effect);
	menu_click_effect = <boolean>cast(getCookie(
		PREFIX + 'menu_click_effect' ) || menu_click_effect, typeof menu_click_effect);
	chat_auto_hide_show = <boolean>cast(getCookie(
		PREFIX + 'chat_auto_hide_show' ) || chat_auto_hide_show, typeof chat_auto_hide_show);
	/*Object.getOwnPropertyNames(self).forEach(prop => {
		if(typeof self[prop] !== 'function')
			self[prop] = cast(getCookie( PREFIX + prop ) || self[prop], typeof self[prop]);
	});*/

	//return self;
}//)();