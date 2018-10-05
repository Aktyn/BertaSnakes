var $$ = $$ || (function() {
	'use strict';

	//some support fixers
	if (!Array.isArray) {
		Array.isArray = function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	}

	//REQUEST ANIMATION FRAME CROS BROWSER SUPPORT
    window.requestAnimFrame = (function() {
		return  window.requestAnimationFrame       || 
		      	window.webkitRequestAnimationFrame || 
		      	window.mozRequestAnimationFrame    || 
		      	window.oRequestAnimationFrame      || 
		      	window.msRequestAnimationFrame     || 
		      	function(callback) {
		        	window.setTimeout(callback, 1000 / 60);
		      	};
    })();

    ///////////////////////////////////////////////////////////////////////

	var assert = function(condition, message) {
	    if(!condition) {
	        message = message || "Assertion failed";
	        if(typeof Error !== "undefined")
	            throw new Error(message);
	        throw message;//fallback in case of poor browser support
	    }
	};

	var assertString = arg => assert(typeof arg === 'string', 'Argument must be type of string');
	var assertFunction = arg => assert(typeof arg === 'function', 'Argument must be type of function');

	var justLettersAndDigits = function(str) {//removes every char except letters and digit from strng
		return str.replace(/[^(a-zA-Z0-9)]*/gi, '');
	};

	var global = {//static methods
		assert: assert,
		expand: function(parent, child, override) {
			if(!override)
				return Object.assign(parent, child);
			//override
			Object.getOwnPropertyNames(child).forEach(function(prop) {
				parent[prop] = child[prop];
			});
			return parent;
		},
		load: function(callback) {
			assertFunction(callback);
			if(!document.body)
				document.onload = window.onload = callback;
			else
				callback();
		},
		loadFile: function(source, callback) {
			assertString(source);

			try {
		        var xmlhttp;
		        if(window.XMLHttpRequest)
		            xmlhttp = new XMLHttpRequest();
		        else//for IE
		            xmlhttp = new window.ActiveXObject("Microsoft.XMLHTTP");
		        xmlhttp.onreadystatechange = function() {
		        	if(typeof callback !== 'function') return;
		        	if(xmlhttp.readyState == 4)//complete
		        		callback(xmlhttp.status == 200 ? xmlhttp.responseText : undefined);
		        };
		        xmlhttp.open("GET", source, true);
		        xmlhttp.send();
		    }
		    catch(e) {
		    	console.error('Cannot load file:', e);
		    	callback(undefined);
		    }
		},
		postRequest: function(php_file, params, callback) {
			assertString(php_file);
			try {
				if(typeof params !== 'string')//format params object to string
					params = Object.entries(params).map((entry) => entry.join("=")).join("&");
				var xmlhttp;
				if(window.XMLHttpRequest)//
		            xmlhttp = new XMLHttpRequest();
		        else//for exploler
		            xmlhttp = new window.ActiveXObject("Microsoft.XMLHTTP");
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
			assertString(source);

			assert(document.head, 'Document head not found');
			let script = $$.create('SCRIPT');
			script.setAttribute('type', 'text/javascript');
			script.setAttribute('src', source);
			script.async = !!async;

			//searching for arleady loaded script
			if($$(document.head).getChildren("SCRIPT").some(s => s.src.indexOf(source) != -1)) {
				if(typeof onload === 'function')
					onload();
				return;
			}

			if(typeof onload === 'function')
				script.onload = onload;

			$$(document.head).append( script );
		},
		try: function(func, catch_label) {
			try {
				assertFunction(func);
				func.apply(func, Array.from(arguments).slice(2, arguments.length));
			}
			catch(e) {
				console.error(catch_label || "error: ", e);
			}
		},
		runAsync: function(func, delay) {
			setTimeout(func, delay || 0);
		},
		create: function(value) {//creates DOM element
			assertString(value);
			var new_element = document.createElement( justLettersAndDigits(value) );
			return global.expand(new_element, extender);
		},
		getScreenSize: function() {
			return {
				width: window.innerWidth || document.documentElement.clientWidth || 
					document.body.clientWidth,
				height: window.innerHeight || document.documentElement.clientHeight || 
					document.body.clientHeight
			};
		},
		base64encode: function(str) {
			assertString(str);
			return window.btoa(str);
		},
		base64decode: function(str) {
			assertString(str);
			return window.atob(str);
		}
	};

	var extender = {//extended methods of DOM elements
		//is$$: true,
		html: function(content) {
			if(typeof content === 'string') {
				this.innerHTML = content;
				return this;
			}
			return this.innerHTML;
		},
		setText: function(content) {
			if(typeof content === 'undefined')
				return this.innerText;
			else {
				this.innerText = String(content);
				return this;
			}
		},
		addText: function(content) {//this method does not cause losing marker issues
			assertString(content);
			this.appendChild( document.createTextNode(content) );
			return this;
		},
		addClass: function(class_name) {
			assertString(class_name);
			this.classList.add(class_name);
			return this;
		},
		removeClass: function(class_name) {
			assertString(class_name);
			this.classList.remove(class_name);
			return this;
		},
		setClass: function(class_name) {
			assertString(class_name);
			this.className = class_name;//overrides existing classes
			return this;
		},
		getChildren: function(query) {
			assertString(query);
			return fromQuery(query, this);
		},
		append: function(element) {
			if(Array.isArray(element)) {
				for(var i=0; i<element.length; i++)
					this.append(element[i]);
				return this;
			}
			assert(element instanceof Element, "Argument must be instance of DOM Element");
			this.appendChild(element);
			return this;
		},
		appendAtBeginning: function(element) {
			if(Array.isArray(element)) {
				for(var i=0; i<element.length; i++)
					this.appendAtBeginning(element[i]);
				return this;
			}
			assert(element instanceof Element, "Argument must be instance of DOM Element");
			this.insertBefore(element, this.firstChild);
			return this;
		},
		delete: function() {
			this.remove();
		},
		setStyle: function(css) {//@css - object
			global.expand(this.style, css, true);
			return this;
		},
		attribute: function(name, value) {
			assertString(name);
			if(typeof value === 'string' || typeof value === 'number') {
				this.setAttribute(name, value);
				return this;
			}
			else
				return this.getAttribute(name);
		},
		isHover: function(e) {
			return (this.parentElement.querySelector(':hover') === this);
		},
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
			assertString(event);
			assertFunction(func);

			if(this.addEventListener)// most non-IE browsers and IE9
			   this.addEventListener(event, func, false);
			else if(this.attachEvent)//Internet Explorer 5 or above
			   this.attachEvent('on' + event, func);
			return this;
		},
		off: function(event, func) {//removeEventListener
			assertString(event);
			assertFunction(func);

			if(this.removeEventListener)// most non-IE browsers and IE9
			   this.removeEventListener(event, func, false);
			else if(this.detachEvent)//Internet Explorer 5 or above
			   this.detachEvent('on' + event, func);
			return this;
		}
	};

	var fromQuery = function(query, parent) {
		var value = Array.from((parent || document).querySelectorAll(query)).map(function(element) {
			return global.expand(element, extender, true);
		});

		if(value.length === 1)//returning single found element
			return value[0];
		
		return smartArrayExtend(value);
	};

	var smartArrayExtend = function(arr) {//smart extending array object of extender methods
		Object.getOwnPropertyNames(extender).forEach(function(method) {
			if(typeof extender[method] !== 'function' || arr.hasOwnProperty(method))
				return;
			var array_extender = {};//temporary object
			array_extender[method] = function() {
				var args = Array.from(arguments);
				var result = [];
				arr.forEach(function(extended_element) {
					result.push( extended_element[method].apply(extended_element, args) );
				});
				return smartArrayExtend( Array.prototype.concat.apply([], result) );//unrap and extend
			};
			global.expand(arr, array_extender);
		});
		return arr;
	};

	var self = function(value) {
		assert(value !== undefined, "No value specified");

		if(value instanceof Element || value === window) {//DOM element
			global.expand(value, extender, true);
			return value;
		}
		else if(typeof value === 'string')
			return fromQuery(value);
		else {
			console.warn("Given argument type is incopatible (", typeof value, ")");
			return null;
		}
	};

	global.expand(self, global);

	return self;
})();