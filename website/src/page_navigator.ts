namespace PageNavigator {
	interface RedirectListener {
		name?: string;
		callback: () => void;
	}

	var redirect_listeners: RedirectListener[] = [];

	function invokeListeners() {
		redirect_listeners.forEach(listener => listener.callback());
	}

	window.addEventListener('popstate', () => {//back and forward buttons
		invokeListeners();
	}, false);

	export function redirect(url: string) {
		if (typeof (history.pushState) !== "undefined") {
            var obj = {Page: 'page', Url: url};
            history.pushState(obj, 'page', url);
            //window.location.hash = url.replace(/[^a-z]*/gi, '');
            invokeListeners();
            return true;
        } else {
            window.location.href = url;//poor support fallback
            return false;
        }
	}

	export function onUrlChange(_callback: () => void, _name?: string) {
		if(_name !== undefined) {
			for(var i=0; i<redirect_listeners.length; i++) {
				if(redirect_listeners[i].name === _name)
					throw Error("redirect_listener with given name already exists: " + _name);
			}
		}
		redirect_listeners.push({callback: _callback, name: _name});
	}

	export function removeUrlChangeListener(name: string) {
		for(var i=0; i<redirect_listeners.length; i++) {
			if(redirect_listeners[i].name === name)
				redirect_listeners.splice(i, 1);
		}
	}

	export function getCurrentPageName() {
		try {
			//@ts-ignore
			return '/' + window.location.pathname.match(/\/([a-z]*)/i)[1];
		}
		catch(e) {
			return window.location.pathname;
		}
	}
}