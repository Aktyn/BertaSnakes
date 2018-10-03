var Stage = (function() {//should be one instance at the time
	var current = null;

	const PopupClass = class {
		constructor() {
			this.close_callback = undefined;
		}

		onClose(func) {
			this.close_callback = func;
		}

		close() {
			try {
				$$('.description').forEach(d => d.remove());
			} catch(e) {}

			if(typeof this.close_callback === 'function')
				this.close_callback();
		}
	};

	const self = class {
		constructor() {
			current = this;
			this.change_callback = null;
			this.current_popup = null;

			document.title = 'Berta Snakes';
			$$(document.body).html('');//removing previous page content
		}

		destroy() {
			current = null;
			this.current_popup = null;
		}

		onchange(callback) {
			this.change_callback = callback;
		}

		change(target) {
			DustBackground.remove();//disabling background effect
			if(typeof this.change_callback === 'function')
				this.change_callback(target);
		}

		popup(TargetClass) {
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
			if(SETTINGS.menu_background_effect === true || SETTINGS.menu_click_effect === true)
				DustBackground.init();
		}

		onServerConnected() {}//virtual
		onServerDisconnect() {}//virtual

		onServerMessage(code) {}//virtual

		static getCurrent() {
			return current;
		}
	};

	self.Popup = PopupClass;

	return self;
})();