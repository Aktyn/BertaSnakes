"use strict";
//@ts-ignore
var $$ = (function () {
    if (typeof Array.isArray === 'undefined') {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }
    function assert(condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (typeof Error !== "undefined")
                throw new Error(message);
            throw message; //fallback in case of poor browser support
        }
    }
    //REQUEST ANIMATION FRAME CROS BROWSER SUPPORT
    //@ts-ignore
    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            //@ts-ignore
            window.mozRequestAnimationFrame ||
            //@ts-ignore
            window.oRequestAnimationFrame ||
            //@ts-ignore
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
    //removes every char except letters and digit from strng
    function justLettersAndDigits(str) {
        return str.replace(/[^(a-zA-Z0-9)]*/gi, '');
    }
    var static_methods = {
        assert: assert,
        expand: function (parent, child, override) {
            if (override === void 0) { override = false; }
            if (!override)
                return Object.assign(parent, child);
            //override
            Object.getOwnPropertyNames(child).forEach(function (prop) {
                parent[prop] = child[prop];
            });
            return parent;
        },
        load: function (callback) {
            if (!document.body)
                document.onload = window.onload = callback;
            else if (typeof callback === 'function')
                callback();
        },
        loadFile: function (source, callback) {
            try {
                var xmlhttp_1 = new XMLHttpRequest();
                xmlhttp_1.open("GET", source, true);
                xmlhttp_1.onreadystatechange = function () {
                    if (typeof callback !== 'function')
                        return;
                    if (xmlhttp_1.readyState == 4) //complete
                        callback(xmlhttp_1.status == 200 ? xmlhttp_1.responseText : undefined);
                };
                xmlhttp_1.send();
            }
            catch (e) {
                console.error('Cannot load file:', e);
                if (typeof callback === 'function')
                    callback();
            }
        },
        postRequest: function (php_file, params, callback) {
            try {
                if (typeof params !== 'string') //format params object to string
                    params = Object.keys(params).map(function (pname) { return pname + '=' + params[pname]; }).join('&');
                //params = Object.entries(params).map((entry) => entry.join("=")).join("&");
                var xmlhttp_2 = new XMLHttpRequest();
                xmlhttp_2.open('POST', php_file, true);
                xmlhttp_2.onreadystatechange = function () {
                    if (typeof callback !== 'function')
                        return;
                    if (xmlhttp_2.readyState == 4) //complete
                        callback(xmlhttp_2.status == 200 ? xmlhttp_2.responseText : undefined); //success
                };
                xmlhttp_2.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                xmlhttp_2.send(params);
            }
            catch (e) {
                console.error('Post request error:', e);
                if (typeof callback === 'function')
                    callback(undefined);
            }
        },
        loadScript: function (source, async, onload) {
            assert(!!document.head, 'Document head not found');
            var script = static_methods.create('SCRIPT');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', source);
            script.setAttribute('async', String(!!async));
            //script.async = !!async;
            //searching for arleady loaded script
            if ((fromQuery('SCRIPT')).some(function (s) { return s.src.indexOf(source) != -1; })) {
                if (typeof onload === 'function')
                    onload();
                return;
            }
            if (typeof onload === 'function')
                script.onload = onload;
            //@ts-ignore
            document.head.appendChild(script);
        },
        try: function (func, catch_label) {
            try {
                func.apply(func, Array.from(arguments).slice(2, arguments.length));
            }
            catch (e) {
                console.error(catch_label || "error: ", e);
            }
        },
        runAsync: function (func, delay) {
            if (delay === void 0) { delay = 1; }
            setTimeout(func, delay);
        },
        create: function (value) {
            var new_element = document.createElement(justLettersAndDigits(value));
            return static_methods.expand(new_element, extender);
        },
        getScreenSize: function () {
            return {
                //@ts-ignore
                width: window.innerWidth || document.documentElement.clientWidth ||
                    document.body.clientWidth,
                //@ts-ignore
                height: window.innerHeight || document.documentElement.clientHeight ||
                    document.body.clientHeight
            };
        },
        base64encode: function (str) {
            return window.btoa(str);
        },
        base64decode: function (str) {
            return window.atob(str);
        }
    };
    var extender = {
        html: function (content) {
            this.innerHTML = String(content);
            return this;
        },
        setText: function (content) {
            //if(content === undefined)
            //	return this.innerText;
            //else {
            this.innerText = String(content);
            return this;
            //}
        },
        addText: function (content) {
            this.appendChild(document.createTextNode(String(content)));
            return this;
        },
        addClass: function (class_name) {
            this.classList.add(class_name);
            return this;
        },
        removeClass: function (class_name) {
            this.classList.remove(class_name);
            return this;
        },
        setClass: function (class_name) {
            this.className = class_name; //overrides existing classes
            return this;
        },
        getChildren: function (query) {
            return fromQuery(query, this);
        },
        addChild: function (element) {
            if (Array.isArray(element)) {
                for (var i = 0; i < element.length; i++)
                    this.append(element[i]);
                return this;
            }
            this.appendChild(element);
            return this;
        },
        appendAtBeginning: function (element) {
            if (Array.isArray(element)) {
                for (var i = 0; i < element.length; i++)
                    this.appendAtBeginning(element[i]);
                return this;
            }
            this.insertBefore(element, this.firstChild);
            return this;
        },
        delete: function () {
            this.remove();
        },
        setStyle: function (css) {
            static_methods.expand(this.style, css, true);
            return this;
        },
        // attribute: function(name, value) {
        // 	if(typeof value === 'string' || typeof value === 'number')
        // 		return this.setAttrib(name, value);
        // 	else
        // 		return this.getAttrib(name);
        // },
        setAttrib: function (name, value) {
            this.setAttribute(name, String(value));
            return this;
        },
        //NOTE - using this method => property names does not change after minify/closure compiling etc
        //along with other code changes
        // set: function(name, value) {
        // 	this[name] = value;
        // 	return this;
        // },
        getAttrib: function (name) {
            return this.getAttribute(name);
        },
        // isHover: function() {
        // return (this.parentHTMLElement.querySelector(':hover') === this);
        // },
        getPos: function () {
            var rect = this.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        },
        getWidth: function () {
            var rect = this.getBoundingClientRect();
            return rect.right - rect.left;
        },
        getHeight: function () {
            var rect = this.getBoundingClientRect();
            return rect.bottom - rect.top;
        },
        //NEW - less troublesome events support
        on: function (event, func) {
            if (this.addEventListener) // most non-IE browsers and IE9
                this.addEventListener(event, func, false);
            else
                throw new Error('no addEventListener support');
            //else if(this.attachEvent)//Internet Explorer 5 or above
            //   this.attachEvent('on' + event, func);
            return this;
        },
        off: function (event, func) {
            if (this.removeEventListener) // most non-IE browsers and IE9
                this.removeEventListener(event, func, false);
            else
                throw new Error('no removeEventListener support');
            //else if(this.detachEvent)//Internet Explorer 5 or above
            //   this.detachEvent('on' + event, func);
            return this;
        }
    };
    function fromQuery(query, parent) {
        var value = Array.from((parent || document).querySelectorAll(query))
            .map(function (HTMLElement) { return static_methods.expand(HTMLElement, extender, true); });
        if (value.length === 1) //returning single found HTMLElement
            return value[0];
        return smartArrayExtend(value);
    }
    //smart extending array object of extender methods
    function smartArrayExtend(arr) {
        Object.getOwnPropertyNames(extender).forEach(function (method) {
            if (typeof extender[method] !== 'function' || arr.hasOwnProperty(method))
                return;
            var array_extender = {}; //temporary object
            array_extender[method] = function () {
                var args = Array.from(arguments);
                var result = [];
                arr.forEach(function (extended_HTMLElement) {
                    result.push(extended_HTMLElement[method].apply(extended_HTMLElement, args));
                });
                return smartArrayExtend(Array.prototype.concat.apply([], result)); //unrap and extend
            };
            static_methods.expand(arr, array_extender);
        });
        return arr;
    }
    function __self(value) {
        if (value instanceof HTMLElement) { //DOM HTMLElement
            static_methods.expand(value, extender, true);
            return value;
        }
        else if (typeof value === 'string')
            return fromQuery(value);
        else
            throw new Error("Given argument type is incopatible (" + typeof value + ")");
    }
    static_methods.expand(__self, static_methods);
    return __self;
})();
