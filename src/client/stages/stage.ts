///<reference path="../common/utils.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="../bg_dust.ts"/>
///<reference path="../../include/network_codes.ts"/>

// interface Stage {}

//var Stage = (function() {//should be one instance at the time
//var current: Stage | null = null;

interface PopupDerived extends PopupClass {
    new(): PopupClass;
}

interface StageDerived extends Stage {
	new(): Stage;
}

class PopupClass {
	private close_callback?: () => void = undefined;

	constructor() {
		// this.close_callback = undefined;
	}

	onClose(func: () => void) {
		this.close_callback = func;
	}

	close() {
		try {
			$$('.description').forEach((d: $_face) => d.remove());
		} catch(e) {}

		if(typeof this.close_callback === 'function')
			this.close_callback();
	}
}

abstract class Stage {
	static Popup = PopupClass;

	private static current: Stage | null = null;

	private change_callback: ((arg: Stage) => void) | null;
	protected current_popup: PopupClass | null;

	constructor() {
		Stage.current = this;
		this.change_callback = null;
		this.current_popup = null;

		document.title = 'Berta Snakes';
		$$(document.body).html('');//removing previous page content
	}

	destroy() {
		Stage.current = null;
		this.current_popup = null;
	}

	onchange(callback: (arg: Stage) => void) {
		this.change_callback = callback;
	}

	change(target: Stage) {
		DustBackground.remove();//disabling background effect
		if(typeof this.change_callback === 'function')
			this.change_callback(target);
	}

	popup(TargetClass: PopupDerived) {
		$$.assert(typeof TargetClass === 'function', 'Argument is not a function');
		
		if(this.current_popup !== null)
			return false;

		this.current_popup = new TargetClass();
		this.current_popup.onClose(() => this.current_popup = null);

		$$.assert(this.current_popup instanceof PopupClass, 
			'Popup is not a parent of PopupClass class');

		return true;
	}

	enableBackgroundEffect() {
		if(SETTINGS.menu_background_effect === true || SETTINGS.menu_click_effect === true) {
			//@ts-ignore
			if(Stage.current instanceof LOBBY_STAGE === false) {
				console.log('Background effect allowed only in LOBBY_STAGE');
				return;
			}
			DustBackground.init();
		}
	}

	abstract onServerConnected(): void;
	abstract onServerDisconnect(): void;
	abstract onServerMessage(data: NetworkPackage): void;

	static getCurrent() {
		return Stage.current;
	}
}

	// Stage.Popup = PopupClass;

	//return Stage;
//})();