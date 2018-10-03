/*
	@Author: Aktyn
	TYPESCRIPT CODE FOR LIGHTWEIGHT DOM MANAGEMENTS LIBRARY
*/
interface resolution {
	width: number;
	height: number;
}

interface $_static_methods {
	assert: (condition : boolean, message : string) => void;
	expand: (parent: any, child: any, override?: boolean) => any;
	load: (callback: any) => void;
	loadFile: (source: string, callback?: (input?: string) => any) => void;
	postRequest: (php_file: string, params: any, callback?: (res?: string) => any) => void;
	loadScript: (source: string, async: boolean, onload?: any) => void;
	try: (func: Function, catch_label : string) => void;
	runAsync: (func: Function, delay: number) => void;
	create: (value: string) => $_face;
	getScreenSize: () => {width: number, height: number};
	base64encode: (str: string) => string;
	base64decode: (str: string) => string;
}

interface $_extend_methods {
	[index: string]: any;
	html: (content: string) => this;
	setText: (content: string | number) => this;
	addText: (content: string | number) => this;
	addClass: (class_name: string) => this;
	removeClass: (class_name: string) => this;
	setClass: (class_name: string) => this;
	getChildren: (query: string) => $_face;
	addChild: (element : HTMLElement | HTMLElement[]) => this;
	appendAtBeginning: (element : HTMLElement | HTMLElement[]) => this;
	delete: () => void;
	setStyle: (css : object) => this;
	//attribute: (name: string, value?: string | number) => any;
	setAttrib: (name: string, value: string | number) => this;
	getAttrib: (name: string) => any;
	//set: (name: string, value: string | number) => this;
	//isHover: () => boolean;
	getPos: () => {x: number, y: number};
	getWidth: () => number;
	getHeight: () => number;

	on: (event: string, func: (e: Event) => any) => $_face;
	off: (event: string, func: (e: Event) => any) => $_face;
}

interface $_static_func extends $_static_methods {
	(value: HTMLElement | string): $_face;
}

interface $_face extends HTMLElement, $_extend_methods, $_static_methods {
	[index: number]: $_face;
	[index: string]: any;
	length: number;

	assert: (condition : boolean, message : string) => void;
}

//@ts-ignore
const $$ : $_static_func = (function() {
	if (typeof Array.isArray === 'undefined') {
		Array.isArray = function(arg : any) : arg is any[] {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	}

	function assert(condition : boolean, message : string) {
	    if(!condition) {
	        message = message || "Assertion failed";
	        if(typeof Error !== "undefined")
	            throw new Error(message);
	        throw message;//fallback in case of poor browser support
	    }
	}

	//REQUEST ANIMATION FRAME CROS BROWSER SUPPORT
	//@ts-ignore
    window.requestAnimFrame = (function() {
		return  window.requestAnimationFrame       || 
		      	window.webkitRequestAnimationFrame || 
		      	//@ts-ignore
		      	window.mozRequestAnimationFrame    || 
		      	//@ts-ignore
		      	window.oRequestAnimationFrame      || 
		      	//@ts-ignore
		      	window.msRequestAnimationFrame     || 
		      	function(callback) {
		        	window.setTimeout(callback, 1000 / 60);
		      	};
    })();

	//removes every char except letters and digit from strng
	function justLettersAndDigits(str : string) {
		return str.replace(/[^(a-zA-Z0-9)]*/gi, '');
	}

	const static_methods: $_static_methods = {//static methods
		assert: assert,
		expand: function(parent, child, override = false) {
			if(!override)
				return Object.assign(parent, child);
			//override
			Object.getOwnPropertyNames(child).forEach(function(prop) {
				parent[prop] = child[prop];
			});
			return parent;
		},
		
		load: function(callback) {
			if(!document.body)
				document.onload = window.onload = callback;
			else if (typeof callback === 'function')
				callback();
		},
		loadFile: function(source, callback) {
			try {
		        let xmlhttp = new XMLHttpRequest();
		        xmlhttp.open("GET", source, true);

		        xmlhttp.onreadystatechange = function() {
		        	if(typeof callback !== 'function') return;
		        	if(xmlhttp.readyState == 4)//complete
		        		callback(xmlhttp.status == 200 ? xmlhttp.responseText : undefined);
		        };
		        
		        xmlhttp.send();
		    }
		    catch(e) {
		    	console.error('Cannot load file:', e);
		    	if(typeof callback === 'function')
		    		callback();
		    }
		},
		postRequest: function(php_file, params, callback) {
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
		loadScript: function(source, async, onload) {
			assert(!!document.head, 'Document head not found');
			let script = static_methods.create('SCRIPT');
			script.setAttribute('type', 'text/javascript');
			script.setAttribute('src', source);
			script.setAttribute('async', String(!!async));
			//script.async = !!async;

			//searching for arleady loaded script

			if( (fromQuery('SCRIPT')).some((s: any) => s.src.indexOf(source) != -1)) {
				if(typeof onload === 'function')
					onload();
				return;
			}

			if(typeof onload === 'function')
				script.onload = onload;

			//@ts-ignore
			document.head.appendChild( script );
		},
		try: function(func : Function, catch_label : string) {
			try {
				func.apply(func, Array.from(arguments).slice(2, arguments.length));
			}
			catch(e) {
				console.error(catch_label || "error: ", e);
			}
		},
		runAsync: function(func: Function, delay = 1) {
			setTimeout(func, delay);
		},
		create: function(value : string) {//creates DOM HTMLElement
			var new_element = document.createElement( justLettersAndDigits(value) );
			return <$_face>static_methods.expand(new_element, extender);
		},
		getScreenSize: function() {
			return {
				//@ts-ignore
				width: window.innerWidth || document.documentElement.clientWidth || 
					document.body.clientWidth,
				//@ts-ignore
				height: window.innerHeight || document.documentElement.clientHeight || 
					document.body.clientHeight
			};
		},
		base64encode: function(str : string) {
			return window.btoa(str);
		},
		base64decode: function(str : string) {
			return window.atob(str);
		}
	}

	const extender: $_extend_methods = {//extended methods of DOM HTMLElements
		html: function(content) {
			/*if(typeof content === 'string') {
				this.innerHTML = content;
				return <$_face>this;
			}
			return <string>this.innerHTML;*/

			this.innerHTML = String(content);
			return this;
		},
		setText: function(content) {
			//if(content === undefined)
			//	return this.innerText;
			//else {
			this.innerText = String(content);
			return this;
			//}
		},
		addText: function(content) {//this method does not cause losing marker issues
			this.appendChild( document.createTextNode(String(content)) );
			return this;
		},
		addClass: function(class_name) {
			this.classList.add(class_name);
			return this;
		},
		removeClass: function(class_name) {
			this.classList.remove(class_name);
			return this;
		},
		setClass: function(class_name) {
			this.className = class_name;//overrides existing classes
			return this;
		},
		getChildren: function(query) {
			return fromQuery(query, <$_face>this);
		},
		addChild: function(element) {
			if(Array.isArray(element)) {
				for(var i=0; i<element.length; i++)
					this.append(element[i]);
				return this;
			}
			
			this.appendChild(element);
			return this;
		},
		appendAtBeginning: function(element) {
			if(Array.isArray(element)) {
				for(var i=0; i<element.length; i++)
					this.appendAtBeginning(element[i]);
				return this;
			}
			
			this.insertBefore(element, this.firstChild);
			return this;
		},
		delete: function() {
			this.remove();
		},
		setStyle: function(css) {//@css - object
			static_methods.expand(this.style, css, true);
			return this;
		},
		/*attribute: function(name, value) {
			if(typeof value === 'string' || typeof value === 'number')
				return this.setAttrib(name, value);
			else
				return this.getAttrib(name);
		},*/
		setAttrib: function(name, value) {
			this.setAttribute(name, String(value));
			return this;
		},
		//NOTE - using this method => property names does not change after minify/closure compiling etc
		//along with other code changes
		/*set: function(name, value) {
			this[name] = value;
			return this;
		},*/
		getAttrib: function(name) {
			return this.getAttribute(name);
		},
		// isHover: function() {
			// return (this.parentHTMLElement.querySelector(':hover') === this);
		// },
		getPos: function() {
			var rect = this.getBoundingClientRect();
			return {x: rect.left, y: rect.top};
		},
		width: function() {
			var rect = this.getBoundingClientRect();
			return rect.right - rect.left;
		},
		height: function() {
			var rect = this.getBoundingClientRect();
			return rect.bottom - rect.top;
		},

		//NEW - less troublesome events support
		on: function(event, func) {
			if(this.addEventListener)// most non-IE browsers and IE9
			   this.addEventListener(event, func, false);
			else
				throw new Error('no addEventListener support');
			//else if(this.attachEvent)//Internet Explorer 5 or above
			//   this.attachEvent('on' + event, func);
			return <$_face>this;
		},
		off: function(event, func) {//removeEventListener
			if(this.removeEventListener)// most non-IE browsers and IE9
			   this.removeEventListener(event, func, false);
			else
				throw new Error('no removeEventListener support');
			//else if(this.detachEvent)//Internet Explorer 5 or above
			//   this.detachEvent('on' + event, func);
			return <$_face>this;
		}
	};

	function fromQuery(query: string, parent?: HTMLElement) : $_face {
		var value : HTMLElement[] = Array.from((parent || document).querySelectorAll(query))
			.map(HTMLElement => static_methods.expand(HTMLElement, extender, true) );

		if(value.length === 1)//returning single found HTMLElement
			return <$_face>value[0];
		
		return smartArrayExtend(value);
	}

	//smart extending array object of extender methods
	function smartArrayExtend(arr: HTMLElement[] | $_face) : $_face {
		Object.getOwnPropertyNames(extender).forEach(function(method: string) {
			if(typeof extender[method] !== 'function' || arr.hasOwnProperty(method))
				return;
			var array_extender: any = {};//temporary object
			array_extender[method] = function() {
				var args = Array.from(arguments);
				var result: any[] = [];
				arr.forEach(function(extended_HTMLElement: $_face | {[index: string]: any}) {
					result.push( extended_HTMLElement[method].apply(extended_HTMLElement, args) );
				});
				return smartArrayExtend( Array.prototype.concat.apply([], result) );//unrap and extend
			};
			static_methods.expand(arr, array_extender);
		});
		return <$_face>arr;
	}

	function __self(value: HTMLElement | string) : $_face {
		if(value instanceof HTMLElement) {//DOM HTMLElement
			static_methods.expand(value, extender, true);
			return <$_face>value;
		}
		else if(typeof value === 'string')
			return fromQuery(value);
		else
			throw new Error("Given argument type is incopatible (" + typeof value + ")");
	}
	static_methods.expand(__self, static_methods);

	return __self;
})();