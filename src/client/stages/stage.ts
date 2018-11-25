///<reference path="../common/utils.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="../bg_dust.ts"/>
///<reference path="../../include/network_codes.ts"/>

namespace Stages {

	/*interface PopupDerived extends PopupBase {
	    new(): PopupBase;
	}*/

	/*interface StageDerived extends StageBase {
		new(): StageBase;
	}*/

	export class PopupBase {
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

	interface PopupClassI {
	    new (...args: any[]): PopupBase;
	}

	export interface StageClassI {
	    new (...args: any[]): StageBase;
	}

	var current_stage: StageBase | null = null;

	export function getCurrent() {
		return current_stage;
	}

	export abstract class StageBase {
		static Popup = PopupBase;

		private change_callback: ((arg: StageClassI) => void) | null;
		protected current_popup: PopupBase | null;

		constructor() {
			current_stage = this;
			this.change_callback = null;
			this.current_popup = null;

			//document.title = 'Berta Snakes';
			$$(document.body).html('');//removing previous page content
		}

		destroy() {
			current_stage = null;
			this.current_popup = null;
		}

		onchange(callback: (arg: StageClassI) => void) {
			this.change_callback = callback;
		}

		change(target: StageClassI) {
			DustBackground.remove();//disabling background effect
			if(typeof this.change_callback === 'function')
				this.change_callback(target);
		}

		popup(TargetClass: PopupClassI) {
			//$$.assert(typeof TargetClass === 'function', 'Argument is not a function');
			
			if(this.current_popup !== null)
				return false;

			this.current_popup = new TargetClass();
			this.current_popup.onClose(() => this.current_popup = null);

			//$$.assert(this.current_popup instanceof PopupBase, 
			//	'Popup is not a parent of PopupBase class');

			return true;
		}

		enableBackgroundEffect() {
			if(SETTINGS.menu_background_effect === true || SETTINGS.menu_click_effect === true) {
				
				if(current_stage instanceof LOBBY_STAGE === false) {
					console.log('Background effect allowed only in LOBBY_STAGE');
					return;
				}
				DustBackground.init();
			}
		}

		abstract onServerConnected(): void;
		abstract onServerDisconnect(): void;
		abstract onServerMessage(data: NetworkPackage): void;
	}
}