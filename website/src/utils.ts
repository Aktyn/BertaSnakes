interface Resolution {
	width: number;
	height: number;
}

const $$ = {
	assert: function(condition: boolean, message: string) {
	    if(!condition) {
	        message = message || "Assertion failed";
	        if(typeof Error !== "undefined")
	            throw new Error(message);
	        throw message;//fallback in case of poor browser support
	    }
	},
	onPageLoaded: function(callback: (...args: any[]) => void) {
		if(!document.body)
			document.onload = window.onload = callback;
		else if (typeof callback === 'function')
			callback();
	},
	loadScript: function(source: string, async: boolean, onload?: (...args: any[]) => void) {
		this.assert(!!document.head, 'Document head not found');
		let script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', source);
		script.setAttribute('async', String(!!async));

		//searching for arleady loaded script
		if(document.querySelectorAll(`img[src='${source}']`).length > 0) {
			if(typeof onload === 'function')
				onload();
			return;
		}

		if(typeof onload === 'function')
			script.onload = onload;

		//@ts-ignore
		document.head.appendChild( script );
	},
	postRequest: function(php_file: string, params: any, callback?: (arg?: string) => void) {
		try {
			if(typeof params !== 'string')//format params object to string
				params = Object.keys(params).map(pname => pname + '=' + params[pname]).join('&');
				//params = Object.entries(params).map((entry) => entry.join("=")).join("&");

			let xmlhttp = new XMLHttpRequest();
			xmlhttp.open('POST', php_file, true);

			xmlhttp.onreadystatechange = function() {//Call a function when the state changes.
				if(typeof callback !== 'function') return;
			    if(xmlhttp.readyState == 4)//complete
			        callback(xmlhttp.status == 200 ? xmlhttp.responseText : undefined);//success
			};

			xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			xmlhttp.send(params);
		}
		catch(e) {
			console.error('Post request error:', e);
			if(typeof callback === 'function')
				callback(undefined);
		}
	},
	runAsync: function(callback: (...args: any[]) => void, delay = 0) {
		setTimeout(callback, delay);
	},
	expand: function(parent: {[index: string]: any}, child: {[index: string]: any}, override = false) {
		if(!override)
			return Object.assign(parent, child);
		//override
		Object.getOwnPropertyNames(child).forEach(function(prop) {
			parent[prop] = child[prop];
		});
		return parent;
	},
	getScreenSize: function(): Resolution {
		return {
			//@ts-ignore
			width: window.innerWidth || document.documentElement.clientWidth || 
				document.body.clientWidth,
			//@ts-ignore
			height: window.innerHeight || document.documentElement.clientHeight || 
				document.body.clientHeight
		};
	},
	appendAtBeginning: function(element: HTMLElement, parent: HTMLElement) {
		if(Array.isArray(element)) {
			for(var i=0; i<element.length; i++)
				this.appendAtBeginning(element[i], parent);
		}
		
		parent.insertBefore(element, parent.firstChild);
	}
}, UTILS = $$;