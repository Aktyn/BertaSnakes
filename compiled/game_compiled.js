"use strict";
//@ts-ignore
const $$ = (function () {
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
    const static_methods = {
        assert: assert,
        expand: function (parent, child, override = false) {
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
                let xmlhttp = new XMLHttpRequest();
                xmlhttp.open("GET", source, true);
                xmlhttp.onreadystatechange = function () {
                    if (typeof callback !== 'function')
                        return;
                    if (xmlhttp.readyState == 4) //complete
                        callback(xmlhttp.status == 200 ? xmlhttp.responseText : undefined);
                };
                xmlhttp.send();
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
                    params = Object.keys(params).map(pname => pname + '=' + params[pname]).join('&');
                //params = Object.entries(params).map((entry) => entry.join("=")).join("&");
                let xmlhttp = new XMLHttpRequest();
                xmlhttp.open('POST', php_file, true);
                xmlhttp.onreadystatechange = function () {
                    if (typeof callback !== 'function')
                        return;
                    if (xmlhttp.readyState == 4) //complete
                        callback(xmlhttp.status == 200 ? xmlhttp.responseText : undefined); //success
                };
                xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                xmlhttp.send(params);
            }
            catch (e) {
                console.error('Post request error:', e);
                if (typeof callback === 'function')
                    callback(undefined);
            }
        },
        loadScript: function (source, async, onload) {
            assert(!!document.head, 'Document head not found');
            let script = static_methods.create('SCRIPT');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', source);
            script.setAttribute('async', String(!!async));
            //script.async = !!async;
            //searching for arleady loaded script
            if ((fromQuery('SCRIPT')).some((s) => s.src.indexOf(source) != -1)) {
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
        runAsync: function (func, delay = 1) {
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
    const extender = {
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
        setAttrib: function (name, value) {
            this.setAttribute(name, String(value));
            return this;
        },
        getAttrib: function (name) {
            return this.getAttribute(name);
        },
        isHover: function () {
            return (this.parentNode.querySelector(':hover') === this);
        },
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
            //@ts-ignore
            else if (this.attachEvent) //Internet Explorer 5 or above
                //@ts-ignore
                this.attachEvent('on' + event, func);
            else
                throw new Error('no addEventListener support');
            return this;
        },
        off: function (event, func) {
            if (this.removeEventListener) // most non-IE browsers and IE9
                this.removeEventListener(event, func, false);
            //@ts-ignore
            else if (this.detachEvent) //Internet Explorer 5 or above
                //@ts-ignore
                this.detachEvent('on' + event, func);
            else
                throw new Error('no removeEventListener support');
            return this;
        }
    };
    function fromQuery(query, parent) {
        var value = Array.from((parent || document).querySelectorAll(query))
            .map(_HTMLElement_ => static_methods.expand(_HTMLElement_, extender, true));
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
        if (value instanceof HTMLElement || value === window) { //DOM HTMLElement
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
// export default $$;
//@ts-ignore //for closure compiler
// window['$$'] = $$;//disabled for compilation to single file
const SETTINGS = (function () {
    var self = {
        //GAME
        game_panel_auto_hide: false,
        painter_resolution: 'MEDIUM',
        shadows_type: 'LONG',
        //MENU
        menu_background_effect: false,
        menu_click_effect: true,
        //CHAT
        chat_auto_hide_show: true,
        save: function () {
            Object.getOwnPropertyNames(self).forEach(prop => {
                if (typeof self[prop] !== 'function')
                    setCookie(PREFIX + prop, self[prop]);
            });
        }
    };
    const PREFIX = 'BS_'; //Berta Snakes
    const COOKIE_LIFETIME = 2 * 1000 * 60 * 60 * 24; //2 days (in miliseconds)
    function setCookie(name, value /*, exdays*/) {
        document.cookie = name + '=' + value + ';' + 'expires=' +
            (new Date(Date.now() + COOKIE_LIFETIME)).toUTCString() + ';path=/';
    }
    function getCookie(name) {
        try {
            //@ts-ignore
            return decodeURIComponent(document.cookie).match(new RegExp('.*' + name + '=([^;]*)', 'i'))[1];
        }
        catch (e) {
            return undefined; //cookie not found
        }
    }
    function cast(value, type) {
        $$.assert(value !== undefined && value !== null, 'Given value must be defined');
        switch (type) {
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
    Object.getOwnPropertyNames(self).forEach(prop => {
        if (typeof self[prop] !== 'function')
            self[prop] = cast(getCookie(PREFIX + prop) || self[prop], typeof self[prop]);
    });
    return self;
})();
///<reference path="common/utils.ts"/>
const DustBackground = (function () {
    var EffectID = null; //COMMON.generateRandomString(10);
    //pos_x, pos_y, scale, angle, speed (for each particle)
    const PARTICLES_COUNT = 256, VALUES_PER_PARTICLE = 5;
    const PERFORMANCE_SAMPLES = 60;
    var Gaussian = (it) => {
        return it === 1 ? Math.random() : (Math.random() * Gaussian(it - 1));
    };
    class Enviroment {
        constructor(id) {
            this.max_particles = 0;
            this.id = id || COMMON.generateRandomString(10);
            this.img1 = $$.create('IMG').setAttrib('src', 'img/dust.png');
            this.img2 = $$.create('IMG').setAttrib('src', 'img/fussion.png');
            if (SETTINGS.menu_background_effect === true) {
                let res = $$.getScreenSize();
                this.particles = new Float32Array(PARTICLES_COUNT * VALUES_PER_PARTICLE);
                for (var i = 0; i < this.particles.length; i += VALUES_PER_PARTICLE) {
                    this.particles[i + 0] = (Math.random() * 1.2 - 0.1) * res.width; //x
                    this.particles[i + 1] = (Math.random() * 1.2 - 0.1) * res.height; //y
                    this.particles[i + 2] = Gaussian(3) * 512 + 4; //scale
                    this.particles[i + 3] = Math.random() * Math.PI * 2; //angle
                    this.particles[i + 4] = Gaussian(4) * 0.06 + 0.01; //speed
                }
                this.max_particles = this.particles.length; // /4;
            }
            this.time_samples = 0;
            this.time_sum = 0;
            ///////////////////////////////////////////////////////////////
            this.click_particles = [];
        }
        update(canv, ctx, delta) {
            delta = Math.min(delta, 1000);
            // ctx.fillStyle = "#fff";
            ctx.clearRect(0, 0, canv.width, canv.height);
            var perf_start = performance.now();
            if (this.particles && this.max_particles) {
                for (var i = 0; i < this.particles.length && i < this.max_particles; i += VALUES_PER_PARTICLE) {
                    // ctx.globalAlpha = 0.1;
                    ctx.globalAlpha = Math.pow(1 - this.particles[i + 2] / (256 + 4), 1) * 0.05;
                    ctx.drawImage(i < this.particles.length / 2 ? this.img1 : this.img2, ~~this.particles[i + 0], ~~this.particles[i + 1], ~~this.particles[i + 2], ~~this.particles[i + 2]);
                    this.particles[i + 0] += Math.cos(this.particles[i + 3]) * delta * this.particles[i + 4];
                    this.particles[i + 1] += Math.sin(this.particles[i + 3]) * delta * this.particles[i + 4];
                    if (this.particles[i + 0] + this.particles[i + 2] < 0)
                        this.particles[i + 0] = canv.width;
                    if (this.particles[i + 0] > canv.width)
                        this.particles[i + 0] = -this.particles[i + 2];
                    if (this.particles[i + 1] + this.particles[i + 2] < 0)
                        this.particles[i + 1] = canv.height;
                    if (this.particles[i + 1] > canv.height)
                        this.particles[i + 1] = -this.particles[i + 2];
                }
            }
            this.click_particles = this.click_particles.filter(part => {
                part.x += Math.cos(part.angle) * part.speed * delta;
                part.y += Math.sin(part.angle) * part.speed * delta;
                var vanishing_alpha = part.lifetime < 0.4 ? part.lifetime / 0.4 : 1;
                ctx.globalAlpha = part.alpha * vanishing_alpha;
                ctx.drawImage(part.type === 1 ? this.img1 : this.img2, part.x, part.y, part.scale, part.scale);
                return (part.lifetime -= delta / 1000) > 0;
            });
            this.time_sum += performance.now() - perf_start;
            if (++this.time_samples >= PERFORMANCE_SAMPLES && this.particles) { //performance check
                this.time_samples = 0;
                //console.log(this.time_sum / PERFORMANCE_SAMPLES);
                if (this.time_sum / PERFORMANCE_SAMPLES > 1.5) //more than x miliseconds - lag
                    this.max_particles = ~~Math.min(this.max_particles - 128, this.max_particles * 0.8);
                else if (this.time_sum / PERFORMANCE_SAMPLES < 1)
                    this.max_particles = Math.min(this.max_particles + 128, this.particles.length);
                this.time_sum = 0;
            }
        }
        onClick(e) {
            if (e.button !== 0 || SETTINGS.menu_click_effect === false)
                return;
            //let res = $$.getScreenSize();
            for (var i = 0; i < 50; i++) {
                var s = Gaussian(2) * 32 + 4;
                this.click_particles.push({
                    type: Math.random() > 0.5 ? 1 : 0,
                    x: e.clientX - s / 2,
                    y: e.clientY - s / 2,
                    speed: Gaussian(4) * 0.1 + 0.06,
                    scale: s,
                    alpha: (1 - s / 36) * 0.5,
                    angle: Math.random() * Math.PI * 2,
                    lifetime: Math.random() * 0.5 + 0.5
                });
            }
        }
    }
    return {
        init: function () {
            console.log('Initializing dust background effect');
            EffectID = COMMON.generateRandomString(10);
            if (document.getElementById('#dust_background_' + EffectID) != null) //already initialized
                return;
            let enviroment = new Enviroment(EffectID);
            var canv = $$.create('CANVAS')
                .setAttrib('id', 'dust_background_' + EffectID)
                .setStyle({
                // "z-index": "-1",
                'display': "inline-block",
                // background: "#000",
                'position': "fixed",
                'margin': "0px",
                'padding': "0px",
                'left': "0px",
                'top': "0px",
                'pointerEvents': "none",
                'mixBlendMode': "overlay"
            });
            var ctx = null;
            $$(document.body).appendAtBeginning(canv); //.setStyle({background: 'none'});
            var onResize = (res) => {
                $$.expand(canv, res);
                ctx = canv.getContext("2d", { antialias: true });
            };
            window.addEventListener('resize', e => onResize($$.getScreenSize()), false);
            onResize($$.getScreenSize());
            window.addEventListener('mousedown', e => enviroment.onClick(e), false);
            var last = 0, dt = 0;
            var tick = function (timer) {
                dt = timer - last;
                last = timer;
                enviroment.update(canv, ctx, dt);
                if (enviroment.id === EffectID) {
                    //@ts-ignore
                    window.requestAnimFrame(tick);
                }
                else
                    console.log('Dust background effect removed');
            };
            tick(0);
        },
        remove: function () {
            try {
                $$('#dust_background_' + EffectID).remove();
                EffectID = null;
            }
            catch (e) {
                console.log('cannot remove background effect');
            }
        },
        reload: function () {
            this.remove();
            if (SETTINGS.menu_background_effect === true || SETTINGS.menu_click_effect === true)
                this.init();
        }
    };
})();
var NetworkCodes;
(function (NetworkCodes) {
    //TO SERVER
    NetworkCodes[NetworkCodes["SUBSCRIBE_LOBBY_REQUEST"] = 0] = "SUBSCRIBE_LOBBY_REQUEST";
    NetworkCodes[NetworkCodes["JOIN_ROOM_REQUEST"] = 1] = "JOIN_ROOM_REQUEST";
    NetworkCodes[NetworkCodes["LEAVE_ROOM_REQUEST"] = 2] = "LEAVE_ROOM_REQUEST";
    NetworkCodes[NetworkCodes["CREATE_ROOM_REQUEST"] = 3] = "CREATE_ROOM_REQUEST";
    NetworkCodes[NetworkCodes["SEND_ROOM_MESSAGE"] = 4] = "SEND_ROOM_MESSAGE";
    NetworkCodes[NetworkCodes["SEND_PRIVATE_MESSAGE"] = 5] = "SEND_PRIVATE_MESSAGE";
    NetworkCodes[NetworkCodes["ADD_FRIEND_REQUEST"] = 6] = "ADD_FRIEND_REQUEST";
    NetworkCodes[NetworkCodes["REMOVE_FRIEND_REQUEST"] = 7] = "REMOVE_FRIEND_REQUEST";
    NetworkCodes[NetworkCodes["SIT_REQUEST"] = 8] = "SIT_REQUEST";
    NetworkCodes[NetworkCodes["STAND_REQUEST"] = 9] = "STAND_REQUEST";
    NetworkCodes[NetworkCodes["READY_REQUEST"] = 10] = "READY_REQUEST";
    NetworkCodes[NetworkCodes["ACCOUNT_DATA_REQUEST"] = 11] = "ACCOUNT_DATA_REQUEST";
    NetworkCodes[NetworkCodes["SHIP_USE_REQUEST"] = 12] = "SHIP_USE_REQUEST";
    NetworkCodes[NetworkCodes["SHIP_BUY_REQUEST"] = 13] = "SHIP_BUY_REQUEST";
    NetworkCodes[NetworkCodes["SKILL_BUY_REQUEST"] = 14] = "SKILL_BUY_REQUEST";
    NetworkCodes[NetworkCodes["SKILL_USE_REQUEST"] = 15] = "SKILL_USE_REQUEST";
    NetworkCodes[NetworkCodes["SKILL_PUT_OFF_REQUEST"] = 16] = "SKILL_PUT_OFF_REQUEST";
    NetworkCodes[NetworkCodes["SKILLS_ORDER_REQUEST"] = 17] = "SKILLS_ORDER_REQUEST";
    NetworkCodes[NetworkCodes["USER_KICK_REQUEST"] = 18] = "USER_KICK_REQUEST";
    //@name - room name, @map - map name, @sits_number - number, @duration - number in seconds
    NetworkCodes[NetworkCodes["ROOM_UPDATE_REQUEST"] = 19] = "ROOM_UPDATE_REQUEST";
    NetworkCodes[NetworkCodes["START_GAME_CONFIRM"] = 20] = "START_GAME_CONFIRM";
    //FROM SERVER
    NetworkCodes[NetworkCodes["PLAYER_ACCOUNT"] = 21] = "PLAYER_ACCOUNT";
    NetworkCodes[NetworkCodes["ACCOUNT_DATA"] = 22] = "ACCOUNT_DATA";
    NetworkCodes[NetworkCodes["TRANSACTION_ERROR"] = 23] = "TRANSACTION_ERROR";
    NetworkCodes[NetworkCodes["ADD_FRIEND_CONFIRM"] = 24] = "ADD_FRIEND_CONFIRM";
    NetworkCodes[NetworkCodes["REMOVE_FRIEND_CONFIRM"] = 25] = "REMOVE_FRIEND_CONFIRM";
    NetworkCodes[NetworkCodes["SUBSCRIBE_LOBBY_CONFIRM"] = 26] = "SUBSCRIBE_LOBBY_CONFIRM";
    NetworkCodes[NetworkCodes["JOIN_ROOM_CONFIRM"] = 27] = "JOIN_ROOM_CONFIRM";
    NetworkCodes[NetworkCodes["CHANGE_ROOM_CONFIRM"] = 28] = "CHANGE_ROOM_CONFIRM";
    NetworkCodes[NetworkCodes["LEAVE_ROOM_CONFIRM"] = 29] = "LEAVE_ROOM_CONFIRM";
    NetworkCodes[NetworkCodes["CREATE_ROOM_CONFIRM"] = 30] = "CREATE_ROOM_CONFIRM";
    NetworkCodes[NetworkCodes["ON_KICKED"] = 31] = "ON_KICKED";
    NetworkCodes[NetworkCodes["USER_JOINED_ROOM"] = 32] = "USER_JOINED_ROOM";
    NetworkCodes[NetworkCodes["USER_LEFT_ROOM"] = 33] = "USER_LEFT_ROOM";
    NetworkCodes[NetworkCodes["ON_ROOM_REMOVED"] = 34] = "ON_ROOM_REMOVED";
    NetworkCodes[NetworkCodes["ON_ROOM_CREATED"] = 35] = "ON_ROOM_CREATED";
    NetworkCodes[NetworkCodes["ON_ROOM_UPDATE"] = 36] = "ON_ROOM_UPDATE";
    NetworkCodes[NetworkCodes["RECEIVE_CHAT_MESSAGE"] = 37] = "RECEIVE_CHAT_MESSAGE";
    //RECEIVE_PRIVATE_MESSAGE,// ----------------- // -----------------
    NetworkCodes[NetworkCodes["START_GAME_COUNTDOWN"] = 38] = "START_GAME_COUNTDOWN";
    NetworkCodes[NetworkCodes["START_GAME"] = 39] = "START_GAME";
    NetworkCodes[NetworkCodes["START_GAME_FAIL"] = 40] = "START_GAME_FAIL";
    NetworkCodes[NetworkCodes["START_ROUND_COUNTDOWN"] = 41] = "START_ROUND_COUNTDOWN";
    NetworkCodes[NetworkCodes["END_GAME"] = 42] = "END_GAME";
    // GAME CODES (vallue cannot be bigger then 255) //
    //SPECIAL
    NetworkCodes[NetworkCodes["START_ROUND_ACTION"] = 43] = "START_ROUND_ACTION";
    NetworkCodes[NetworkCodes["START_GAME_FAIL_ACTION"] = 44] = "START_GAME_FAIL_ACTION";
    NetworkCodes[NetworkCodes["END_GAME_ACTION"] = 45] = "END_GAME_ACTION";
    NetworkCodes[NetworkCodes["SEND_DATA_TO_CLIENT_ACTION_FLOAT32"] = 46] = "SEND_DATA_TO_CLIENT_ACTION_FLOAT32";
    //TO SERVER
    NetworkCodes[NetworkCodes["PLAYER_MOVEMENT"] = 47] = "PLAYER_MOVEMENT";
    NetworkCodes[NetworkCodes["PLAYER_EMOTICON"] = 48] = "PLAYER_EMOTICON";
    NetworkCodes[NetworkCodes["PLAYER_SKILL_USE_REQUEST"] = 49] = "PLAYER_SKILL_USE_REQUEST";
    NetworkCodes[NetworkCodes["PLAYER_SKILL_STOP_REQUEST"] = 50] = "PLAYER_SKILL_STOP_REQUEST";
    //FROM SERVER
    NetworkCodes[NetworkCodes["OBJECT_SYNCHRONIZE"] = 51] = "OBJECT_SYNCHRONIZE";
    NetworkCodes[NetworkCodes["DRAW_PLAYER_LINE"] = 52] = "DRAW_PLAYER_LINE";
    NetworkCodes[NetworkCodes["ON_PLAYER_BOUNCE"] = 53] = "ON_PLAYER_BOUNCE";
    NetworkCodes[NetworkCodes["ON_ENEMY_BOUNCE"] = 54] = "ON_ENEMY_BOUNCE";
    NetworkCodes[NetworkCodes["ON_BULLET_BOUNCE"] = 55] = "ON_BULLET_BOUNCE";
    NetworkCodes[NetworkCodes["ON_BULLET_HIT"] = 56] = "ON_BULLET_HIT";
    //PLAYER_UPDATE,//player_id, pos_x, pos_y, rot, movement_state
    NetworkCodes[NetworkCodes["PLAYER_MOVEMENT_UPDATE"] = 57] = "PLAYER_MOVEMENT_UPDATE";
    NetworkCodes[NetworkCodes["ON_PLAYER_EMOTICON"] = 58] = "ON_PLAYER_EMOTICON";
    NetworkCodes[NetworkCodes["WAVE_INFO"] = 59] = "WAVE_INFO";
    NetworkCodes[NetworkCodes["SPAWN_ENEMY"] = 60] = "SPAWN_ENEMY";
    NetworkCodes[NetworkCodes["SPAWN_ITEM"] = 61] = "SPAWN_ITEM";
    //enemy_id, player_index, pos_x, pos_y, player_rot, player_hp, player_points, bounce_x and y
    NetworkCodes[NetworkCodes["ON_PLAYER_ENEMY_COLLISION"] = 62] = "ON_PLAYER_ENEMY_COLLISION";
    //ON_ENEMY_BULLET_COLLISION,//enemy_id, enemy_hp, bullet_id, player_index, hit_x, hit_y
    NetworkCodes[NetworkCodes["ON_ENEMY_ATTACKED"] = 63] = "ON_ENEMY_ATTACKED";
    NetworkCodes[NetworkCodes["ON_PLAYER_ATTACKED"] = 64] = "ON_PLAYER_ATTACKED";
    NetworkCodes[NetworkCodes["ON_BULLET_EXPLODE"] = 65] = "ON_BULLET_EXPLODE";
    //ON_SMALL_EXPLOSION,//pos_x, pos_y
    NetworkCodes[NetworkCodes["ON_POISON_STAIN"] = 66] = "ON_POISON_STAIN";
    NetworkCodes[NetworkCodes["ON_PLAYER_COLLECT_ITEM"] = 67] = "ON_PLAYER_COLLECT_ITEM";
    NetworkCodes[NetworkCodes["ON_PLAYER_SPAWNING_FINISH"] = 68] = "ON_PLAYER_SPAWNING_FINISH";
    //player_index, spawning_duration, death_pos_x, death_pos_y, explosion_radius
    NetworkCodes[NetworkCodes["ON_PLAYER_DEATH"] = 69] = "ON_PLAYER_DEATH";
    //player_index, player_x, player_y, player_hp, player_points
    NetworkCodes[NetworkCodes["ON_PLAYER_ENEMY_PAINTER_COLLISION"] = 70] = "ON_PLAYER_ENEMY_PAINTER_COLLISION";
    NetworkCodes[NetworkCodes["ON_PLAYER_SKILL_USE"] = 71] = "ON_PLAYER_SKILL_USE";
    NetworkCodes[NetworkCodes["ON_PLAYER_SKILL_CANCEL"] = 72] = "ON_PLAYER_SKILL_CANCEL";
    NetworkCodes[NetworkCodes["ON_BULLET_SHOT"] = 73] = "ON_BULLET_SHOT";
    NetworkCodes[NetworkCodes["ON_BOUNCE_BULLET_SHOT"] = 74] = "ON_BOUNCE_BULLET_SHOT";
    NetworkCodes[NetworkCodes["ON_BOMB_PLACED"] = 75] = "ON_BOMB_PLACED";
    NetworkCodes[NetworkCodes["ON_BOMB_EXPLODED"] = 76] = "ON_BOMB_EXPLODED";
    NetworkCodes[NetworkCodes["ON_PLAYER_POISONED"] = 77] = "ON_PLAYER_POISONED";
    NetworkCodes[NetworkCodes["ON_SHIELD_EFFECT"] = 78] = "ON_SHIELD_EFFECT";
    NetworkCodes[NetworkCodes["ON_IMMUNITY_EFFECT"] = 79] = "ON_IMMUNITY_EFFECT";
    NetworkCodes[NetworkCodes["ON_SPEED_EFFECT"] = 80] = "ON_SPEED_EFFECT";
    NetworkCodes[NetworkCodes["ON_INSTANT_HEAL"] = 81] = "ON_INSTANT_HEAL";
    NetworkCodes[NetworkCodes["ON_ENERGY_BLAST"] = 82] = "ON_ENERGY_BLAST";
    NetworkCodes[NetworkCodes["COUNT_DEBUGGER"] = 83] = "COUNT_DEBUGGER";
})(NetworkCodes || (NetworkCodes = {}));
//auto numering
// 	var j = 0;
// 	for(var i in self)
// 		self[i] = j++;
// 	if(j > 256)
// 		console.error('More than 256 unique network codes exists!!!');
// 	return self;
// })();
if (NetworkCodes.COUNT_DEBUGGER > 255)
    console.error('More than 256 unique network codes exists!!!');
try { //export for NodeJS
    module.exports = NetworkCodes;
}
catch (e) { }
///<reference path="../common/utils.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="../bg_dust.ts"/>
///<reference path="../../include/network_codes.ts"/>
class PopupClass {
    constructor() {
        this.close_callback = undefined;
        // this.close_callback = undefined;
    }
    onClose(func) {
        this.close_callback = func;
    }
    close() {
        try {
            $$('.description').forEach((d) => d.remove());
        }
        catch (e) { }
        if (typeof this.close_callback === 'function')
            this.close_callback();
    }
}
class Stage {
    constructor() {
        Stage.current = this;
        this.change_callback = null;
        this.current_popup = null;
        document.title = 'Berta Snakes';
        $$(document.body).html(''); //removing previous page content
    }
    destroy() {
        Stage.current = null;
        this.current_popup = null;
    }
    onchange(callback) {
        this.change_callback = callback;
    }
    change(target) {
        DustBackground.remove(); //disabling background effect
        if (typeof this.change_callback === 'function')
            this.change_callback(target);
    }
    popup(TargetClass) {
        $$.assert(typeof TargetClass === 'function', 'Argument is not a function');
        if (this.current_popup !== null)
            return false;
        this.current_popup = new TargetClass();
        this.current_popup.onClose(() => this.current_popup = null);
        $$.assert(this.current_popup instanceof PopupClass, 'Popup is not a parent of PopupClass class');
        return true;
    }
    enableBackgroundEffect() {
        if (SETTINGS.menu_background_effect === true || SETTINGS.menu_click_effect === true) {
            //@ts-ignore
            if (Stage.current instanceof LOBBY_STAGE === false) {
                console.log('Background effect allowed only in LOBBY_STAGE');
                return;
            }
            DustBackground.init();
        }
    }
    static getCurrent() {
        return Stage.current;
    }
}
Stage.Popup = PopupClass;
Stage.current = null;
// Stage.Popup = PopupClass;
//return Stage;
//})();
///<reference path="common/utils.ts"/>
const Chat = (function () {
    var _a;
    var validate = function (msg) {
        return typeof msg === 'string' && msg.length > 0;
    };
    const COLORS_PALETTE = ['#1a8ead', '#1aad83', '#ad431a', '#ad941a', '#3a1aad', '#831aad'];
    var color_iterator = 0;
    var getNextPaletteColor = () => {
        color_iterator %= COLORS_PALETTE.length;
        return COLORS_PALETTE[color_iterator++];
    };
    class BookMark {
        constructor(id, name, is_room) {
            this.id = id || 0;
            this.name = name;
            this.is_room = is_room;
            this.selector_btn = $$.create('SPAN').setText(name).on('click', () => {
                if (typeof this.onAnyActionCallback === 'function')
                    this.onAnyActionCallback();
                if (typeof this.onSelectCallback === 'function')
                    this.onSelectCallback();
            });
            this.messages = $$.create('DIV').addClass('chat_body'); //.setText('test: ' + name);
            this.messages.on('click', e => {
                if (typeof this.onAnyActionCallback === 'function')
                    this.onAnyActionCallback();
            }).on('wheel', e => {
                if (typeof this.onAnyActionCallback === 'function')
                    this.onAnyActionCallback();
                e.stopImmediatePropagation();
            });
        }
        isSameBK(bk) {
            return this.isSame(bk.id, bk.name, bk.is_room);
        }
        isSame(id, name, is_room) {
            //if(id instanceof BookMark)
            //	return this.isSame(id.id, id.name, id.is_room);
            if (this.is_room !== is_room)
                return false;
            return this.id === id; // && this.name === name;
        }
        restore(bookmark) {
            this.messages.html(bookmark.messages.innerHTML);
        }
        onSelect(callback) {
            this.onSelectCallback = callback;
        }
        onAnyAction(callback) {
            this.onAnyActionCallback = callback;
        }
        addMessage(message, sender) {
            let new_message_label = $$.create('DIV').addChild($$.create('SPAN').setText(sender + ':'));
            new_message_label.addText(message);
            this.messages.addChild(new_message_label);
        }
    }
    ;
    // var ChatClass.instance_handler = null;
    return _a = class ChatClass {
            constructor() {
                this.chat_widget = null;
                this.createWidget();
                //this.msg_buffer = [];//buffer every message
                this.hidden = true;
                this.bookmarks = []; //list of bookmarks
                this.current_bookmark = null;
                if (ChatClass.instance_handler !== null) { //restoring data from previous instance
                    ChatClass.instance_handler.bookmarks.forEach((book) => {
                        if (book.is_room === false) {
                            console.log('hmm', book.name);
                            let added_bookmark = this.addBookmark(book.id, book.name, false);
                            if (added_bookmark)
                                added_bookmark.restore(book);
                        }
                    });
                }
                ChatClass.instance_handler = this;
            }
            static get currentInstance() {
                return ChatClass.instance_handler;
            }
            onRoomJoined() {
                var current_room = Network.getCurrentRoom();
                if (current_room === null)
                    throw new Error('There isn\'t current room');
                //this.addBookmark(current_room.name, true);
                this.addBookmark(current_room.id, 'room', true);
            }
            onRoomLeft() {
                //removing room bookmark
                if (this.bookmarks.length === 0)
                    return;
                for (let book of this.bookmarks) {
                    if (book.is_room === true) {
                        this.current_bookmark = book;
                        this.removeCurrentBookmark(true);
                        break;
                    }
                }
                this.setHeaderText('');
            }
            addBookmark(id, name, is_room) {
                //if chat already contains same bookmark
                if (this.bookmarks.some(book => book.isSame(id, name, is_room))) //do not add duplicate
                    return this.bookmarks.find(book => book.isSame(id, name, is_room)); //return existing
                let bookmark = new BookMark(id, name, is_room);
                this.bookmarks.push(bookmark);
                if (is_room) //sorting
                    this.bookmarks.sort((a, b) => b.is_room ? 1 : -1);
                //console.log(this.bookmarks);
                //adding to html widget
                //let new_id = $$.base64encode('chat_[' + this.id + ']_bookmark_' + name);
                /*let bookmark_btn = $$.create('SPAN').setText(name)
                    .on('click', () => this.selectBookmark(bookmark) );*/
                bookmark.onSelect(() => {
                    this.selectBookmark(bookmark);
                    this.setHidden(false);
                });
                bookmark.onAnyAction(() => this.setHeaderText(''));
                //try {
                if (this.input === undefined)
                    throw new Error('\'input\' member variable is undefined');
                if (this.chat_body === undefined)
                    throw new Error('\'chat_body\' member variable is undefined');
                this.input.value = '';
                this.input.disabled = false;
                this.chat_body.addChild(bookmark.messages.setStyle({ 'display': 'none' }));
                if (is_room) {
                    if (this.chat_widget)
                        this.chat_widget.getChildren('NAV').appendAtBeginning(bookmark.selector_btn.addClass('room_bookmark'));
                }
                else {
                    bookmark.selector_btn.setStyle({
                        'backgroundColor': getNextPaletteColor()
                    });
                    if (this.chat_widget)
                        this.chat_widget.getChildren('NAV').addChild(bookmark.selector_btn);
                }
                //} catch(e) {}
                if (this.bookmarks.length === 1) { //first bookmark - showing chat and focusing on it
                    if (SETTINGS.chat_auto_hide_show === true)
                        this.setHidden(false);
                    this.selectBookmark(bookmark);
                }
                return bookmark;
            }
            removeCurrentBookmark(force = false) {
                //there is no current bookmark or it is a room chat bookmark or this is only bookmark
                if (this.current_bookmark === null || (this.current_bookmark.is_room === true && !force))
                    return;
                for (var i = 0; i < this.bookmarks.length; i++) {
                    if (this.bookmarks[i] === this.current_bookmark) { //current bookmark
                        /*let curr_id =
                            '#' + $$.base64encode('chat_['+this.id+']_bookmark_' + this.bookmarks[i].name);
                        try {
                            this.chat_widget.getChildren( curr_id.replace(/=/g, '') ).remove();
                        }
                        catch(e) {
                            console.log('Cannot remove bookmark element from chat html widget');
                        }*/
                        let book = this.bookmarks[i];
                        book.selector_btn.remove();
                        book.messages.remove();
                        //removing from array
                        this.bookmarks.splice(i, 1);
                        this.current_bookmark = null;
                        //selecting next or previous
                        //console.log(this.bookmarks);
                        if (i < this.bookmarks.length) //selecting next one
                            this.selectBookmark(this.bookmarks[i]);
                        else if (i - 1 >= 0 && this.bookmarks.length > 0) //selecting previous one
                            this.selectBookmark(this.bookmarks[i - 1]);
                        else {
                            //console.log('last bookmark removed');
                            if (this.chat_body)
                                this.chat_body.html('');
                            //(inp => {
                            if (this.input) {
                                this.input.value = '';
                                this.input.disabled = true;
                            }
                            //})(this.chat_widget.getChildren('INPUT'));
                            if (SETTINGS.chat_auto_hide_show && this.chat_widget)
                                this.chat_widget.addClass('hidden');
                        }
                        break;
                    }
                }
            }
            selectBookmark(book) {
                //bookmark already selected
                if (this.current_bookmark && this.current_bookmark.isSameBK(book))
                    return;
                //this.chat_widget.getChildren('NAV').getChildren('SPAN').removeClass('current');
                this.bookmarks.forEach(book => book.selector_btn.removeClass('current'));
                this.bookmarks.forEach(book_it => {
                    if (book_it.isSameBK(book)) {
                        this.current_bookmark = book;
                        book_it.selector_btn.addClass('current');
                        book_it.messages.setStyle({ 'display': 'block' });
                        book_it.messages.scrollTop =
                            book_it.messages.scrollHeight + book_it.messages.getHeight();
                    }
                    else {
                        book_it.selector_btn.removeClass('current');
                        book_it.messages.setStyle({ 'display': 'none' });
                    }
                });
                if (this.input)
                    this.input.focus();
            }
            pushMessage(book, msg, sender, _private = false) {
                var sticks = book.messages.getHeight() + book.messages.scrollTop + 14 >=
                    book.messages.scrollHeight;
                book.addMessage(msg, sender);
                if (sticks) {
                    book.messages.scrollTop = book.messages.scrollHeight + book.messages.getHeight();
                    this.setHeaderText('');
                }
                if (!sticks || this.hidden || book !== this.current_bookmark)
                    this.setHeaderText((_private ? '(priv) ' : '') + sender + ': ' + msg);
            }
            onMessage(message) {
                try {
                    $$.assert(typeof message === 'object', 'Message is not type of object');
                    //console.log(message);
                    $$.assert(typeof message['from'] === 'string' &&
                        typeof message['public'] === 'boolean' &&
                        typeof message['id'] === 'number' &&
                        typeof message['msg'] === 'string', 'Incorrect message format');
                    if (message['public'] === true) { //room message
                        this.bookmarks.forEach(book_it => {
                            //looking for same room's bookmark
                            if (book_it.isSame(message['id'], 'room', true))
                                this.pushMessage(book_it, message['msg'], message['from'], false);
                        });
                    }
                    else { //private message
                        let book = this.addBookmark(message['id'], message['from'], false);
                        if (book)
                            this.pushMessage(book, message['msg'], message['from'], true);
                    }
                }
                catch (e) {
                    console.error('Chat message receiving error: ', e);
                }
            }
            sendMessage(msg) {
                msg = msg.trim();
                if (validate(msg) === false)
                    return false;
                if (this.current_bookmark === null)
                    return false;
                try {
                    if (this.current_bookmark.is_room) { //room message
                        //this.current_bookmark.name - room name (only for server verification)
                        Network.sendRoomMessage(msg);
                    }
                    else {
                        //2nd argument - target user's id
                        Network.sendPrivateMessage(msg, this.current_bookmark.id);
                        //temporary - pretent that user received message
                        /*this.onMessage({
                            from: 'offline',
                            public: true,
                            msg: msg
                        });*/
                    }
                    return true;
                }
                catch (e) {
                    console.error(e);
                    return false;
                }
            }
            setHeaderText(text) {
                if (this.header === undefined)
                    throw new Error('Header is undefined!!!');
                var header_spanner = this.header.getChildren('SPAN');
                //if(typeof text === 'string')
                header_spanner.setText(text);
                //else
                //	header_spanner.setText( text.html() );
                if (text.length === 0)
                    document.title = 'Berta Snakes';
                else if (document.hasFocus() === false) //if page is out of focus
                    document.title = '*' + text + ' - Berta Snakes';
            }
            setHidden(hide) {
                this.slide(hide);
            }
            slide(_hidden) {
                if (typeof _hidden !== 'boolean')
                    this.hidden = !this.hidden;
                else
                    this.hidden = _hidden;
                if (!this.chat_widget)
                    throw new Error('no chat_widget');
                if (this.hidden)
                    this.chat_widget.addClass('hidden');
                else {
                    this.chat_widget.removeClass('hidden');
                    this.setHeaderText('');
                    setTimeout(() => {
                        //var chat_body = this.chat_widget.getChildren('.chat_body');
                        if (this.current_bookmark)
                            this.current_bookmark.messages.scrollTop =
                                this.current_bookmark.messages.scrollHeight +
                                    this.current_bookmark.messages.getHeight();
                    }, 600); //animation duration
                }
            }
            createWidget() {
                if (this.chat_widget !== null)
                    return this.chat_widget;
                this.chat_body = $$.create('DIV');
                this.header = $$.create('H6').on('click', () => {
                    if (this.hidden && this.chat_widget !== null &&
                        !this.chat_widget.getChildren('.chat_slider').isHover() &&
                        !this.chat_widget.getChildren('.bookmark_close_btn').isHover()) {
                        this.slide();
                    }
                }).addChild($$.create('SPAN')).addChild(//slide btn
                $$.create('DIV').addClass('opacity_and_rot_transition').addClass('chat_slider')
                    .setStyle({ 'float': 'left' }).on('click', () => {
                    this.slide();
                })).addChild(//bookmark close btn
                $$.create('DIV').addClass('opacity_and_rot_transition')
                    .addClass('bookmark_close_btn').setStyle({ 'float': 'right' })
                    .on('click', () => {
                    this.removeCurrentBookmark();
                }));
                this.input = $$.create('INPUT').setAttrib('placeholder', 'type here')
                    .on('keydown', (e) => {
                    if (e.keyCode === 13) {
                        if (this.sendMessage(this.input.value) === true)
                            this.input.value = '';
                    }
                    e.stopImmediatePropagation();
                }).setAttrib('type', 'text').setAttrib('maxlength', '256').setAttrib('disabled', '');
                /////////////////////////////////////////////////////////////////////////
                this.chat_widget = this.chat_widget || $$.create('DIV').addClass('chat').addClass('hidden')
                    .setStyle({ width: '250px' })
                    //.setAttrib('id', 'chat_widget' + this.session_string + this.id)
                    .addChild(this.header).addChild($$.create('NAV'))
                    .addChild(this.chat_body)
                    .addChild(this.input);
                return this.chat_widget;
            }
        },
        _a.instance_handler = null,
        _a;
})();
//const UserInfo = (function() {
// var guest_id = -1000;//NOTE that guests ids are negative
class UserInfo {
    //@id - database id for registered accounts
    constructor(id, nick, custom_data) {
        this.connection = null;
        this.room = null;
        this.lobby_subscriber = false;
        this._id = id || 0;
        if (this._id === 0) { //is guest
            this._id = UserInfo.guest_id--;
            this.nick = "Guest#" + Math.abs(this._id);
        }
        else if (nick)
            this.nick = nick;
        else
            this.nick = 'Error#69';
        try {
            if (typeof custom_data === 'string')
                custom_data = JSON.parse(custom_data);
            else if (typeof custom_data !== 'object') {
                //console.error('custom_data must be a JSON format');
                custom_data = {};
            }
        }
        catch (e) {
            console.error(e);
            custom_data = {};
        }
        this.custom_data = custom_data;
        this.friends = [];
        //filling data gaps with default values
        this.custom_data['level'] = this.custom_data['level'] || 1; //NOTE - level is never 0
        this.custom_data['rank'] = this.custom_data['rank'] || UserInfo.INITIAL_RANK;
        this.custom_data['exp'] = this.custom_data['exp'] || 0;
        this.custom_data['coins'] = this.custom_data['coins'] || 0;
        this.custom_data['ship_type'] = this.custom_data['ship_type'] || 0;
        this.custom_data['skills'] =
            this.custom_data['skills'] || [null, null, null, null, null, null];
        this.custom_data['avaible_ships'] = this.custom_data['avaible_ships'] || [0];
        this.custom_data['avaible_skills'] = this.custom_data['avaible_skills'] || [];
        //this.level = custom_data['level'] || 1;
        //this.lobby_subscriber = false;
        //use only serverside
        // this.connection = null;
        // this.room = null;
    }
    //STORES ONLY PUBLIC DATA
    toJSON() {
        return JSON.stringify({
            id: this.id,
            nick: this.nick,
            level: this.level,
            rank: this.rank
        });
    }
    //GETS ONLY PUBLIC DATA
    static fromJSON(json_data) {
        if (typeof json_data === 'string')
            json_data = JSON.parse(json_data);
        return new UserInfo(json_data['id'], json_data['nick'], {
            level: json_data['level'],
            rank: json_data['rank']
        });
    }
    //PRIVATE AND PUBLIC DATA (for server-side threads comunications)
    toFullJSON() {
        return JSON.stringify({
            id: this.id,
            nick: this.nick,
            custom_data: this.custom_data,
            friends: this.friends,
            lobby_subscriber: this.lobby_subscriber
        });
    }
    //PRIVATE AND PUBLIC ...
    static fromFullJSON(full_json_data) {
        if (typeof full_json_data === 'string')
            full_json_data = JSON.parse(full_json_data);
        let user = new UserInfo(full_json_data['id'], full_json_data['nick'], full_json_data['custom_data']);
        user.friends = full_json_data['friends'];
        user.lobby_subscriber = full_json_data['lobby_subscriber'];
        return user;
    }
    /*get lobby_subscriber() {
        return this._lobby_subscriber;
    }

    set lobby_subscriber(value) {
        this._lobby_subscriber = value;
    }*/
    isGuest() {
        return this._id < 0;
    }
    get id() {
        return this._id;
    }
    set id(val) {
        throw new Error('User id cannot be changed');
    }
    /*get nick() {
        return this._nick;
    }

    set nick(_nick) {
        this._nick = _nick || '';
    }*/
    get level() {
        return this.custom_data['level'] || 1; //this._level;
    }
    set level(_level) {
        //this.custom_data['level'] = _level;
        throw new Error('Level can be changed only through custom_data');
    }
    get rank() {
        return this.custom_data['rank'] || UserInfo.INITIAL_RANK;
    }
    set rank(value) {
        throw new Error('User\'s rank can be changed only through custom_data');
    }
}
UserInfo.guest_id = -1000;
UserInfo.INITIAL_RANK = 1000;
// })();
// module.exports = UserInfo;
// export default UserInfo;
//------------------------------------------------------//
try { //export for NodeJS
    module.exports = UserInfo;
}
catch (e) { }
///<reference path="user_info.ts"/>
// const RoomInfo = (function() {
// var id = 0;
// const DEFAULT_SITS = 1;//
// const DEFAULT_MAP = 'Open Maze';//'Empty';
// const DEFAULT_DURATION = 180;//seconds
/*const GAME_MODES = {//@enum
    COOPERATION: 0,
    COMPETITION: 1
};*/
var GAME_MODES;
///<reference path="user_info.ts"/>
// const RoomInfo = (function() {
// var id = 0;
// const DEFAULT_SITS = 1;//
// const DEFAULT_MAP = 'Open Maze';//'Empty';
// const DEFAULT_DURATION = 180;//seconds
/*const GAME_MODES = {//@enum
    COOPERATION: 0,
    COMPETITION: 1
};*/
(function (GAME_MODES) {
    GAME_MODES[GAME_MODES["COOPERATION"] = 0] = "COOPERATION";
    GAME_MODES[GAME_MODES["COMPETITION"] = 1] = "COMPETITION";
})(GAME_MODES || (GAME_MODES = {}));
class RoomInfo {
    constructor(_id, _name) {
        this.onUserConfirm = null;
        this.game_process = null; //TODO - set type of ChildProcess
        this._id = _id || ++RoomInfo.id;
        this.name = _name || ("#" + this.id);
        this.map = RoomInfo.DEFAULT_MAP; //name of chosen map
        this.duration = RoomInfo.DEFAULT_DURATION; //game duration in seconds
        // + Array(~~(Math.random()*15)).fill().map(x => 'x').join('');
        this.sits = []; //NOTE - stores only users ids and zeros (in case of empty sit)
        for (let i = 0; i < RoomInfo.DEFAULT_SITS; i++)
            this.sits.push(0);
        //stores booleans - true corresponds to ready user (same order as sits)
        this.readys = this.sits.map(sit => false);
        this.users = []; //contains UserInfo instances
        this.gamemode = GAME_MODES.COOPERATION; //default
        //use only serverside
        //this.confirmations = null;//if not null => waiting for confirmations before start
        //this.onUserConfirm = null;//handle to callback
        //this.game_process = null;//if not null => game is running
    }
    static get MODES() {
        return GAME_MODES;
    }
    toJSON() {
        return JSON.stringify({
            id: this.id,
            name: this.name,
            map: this.map,
            gamemode: this.gamemode,
            duration: this.duration,
            sits: this.sits,
            readys: this.readys
        });
    }
    static fromJSON(json_data) {
        if (typeof json_data === 'string')
            json_data = JSON.parse(json_data);
        let room = new RoomInfo(json_data['id'], json_data['name']);
        if (typeof json_data['sits'] === 'string') {
            json_data['sits'] = JSON.parse(json_data['sits']);
        }
        room.sits = json_data['sits'];
        room.readys = json_data['readys'];
        room.map = json_data['map'];
        room.gamemode = json_data['gamemode'];
        room.duration = json_data['duration'];
        return room;
    }
    updateData(json_data) {
        if (json_data instanceof RoomInfo) { //update from RoomInfo instance
            if (this.id !== json_data.id)
                throw Error('id mismatch');
            this.name = json_data.name;
            this.sits = json_data.sits;
            this.readys = json_data.readys;
            this.map = json_data.map;
            this.gamemode = json_data.gamemode;
            this.duration = json_data.duration;
        }
        else { //update from JSON
            if (typeof json_data === 'string') //json
                json_data = JSON.parse(json_data);
            if (this.id !== json_data['id'])
                throw Error('id mismatch');
            this.name = json_data['name'];
            this.sits = json_data['sits'];
            this.readys = json_data['readys'];
            this.map = json_data['map'];
            this.gamemode = json_data['gamemode'];
            this.duration = json_data['duration'];
        }
    }
    get id() {
        return this._id;
    }
    set id(val) {
        throw new Error('RoomInfo id cannot be changed');
    }
    get taken_sits() {
        return this.sits.filter(sit => sit !== 0).length;
    }
    getUserByID(user_id) {
        for (let user of this.users) {
            if (user.id === user_id)
                return user;
        }
        return null;
    }
    getOwner() {
        if (this.users.length > 0)
            return this.users[0];
        return undefined; //empty room has no owner
    }
    /*getSitsWithUserInfo() {//return array of nulls or UserInfo instances
        return this.sits.map(sit => {
            return sit === 0 ? null : this.getUserByID(sit);
        });
    }*/
    changeSitsNumber(sits_number) {
        while (this.sits.length > sits_number) //removing last sits
            this.sits.pop();
        while (this.sits.length < sits_number)
            this.sits.push(0);
        this.readys = this.sits.map(sit => false); //unready all sitter and keeps array same size
    }
    isUserSitting(user) {
        //if(typeof user === 'undefined')
        //	throw new Error('User not specified');
        // if(user.id !== undefined)
        // 	user = user.id;
        //if(typeof user !== 'number')
        //	user = user.id || 0;
        return this.sits.some(u => (u !== 0) ? (u === user) : false);
    }
    sitUser(user) {
        //if(typeof user === 'undefined')
        //	throw new Error('User not specified');
        //if(user.id !== undefined)
        //	user = user.id;
        //if(typeof user !== 'number')
        //	user = user.id || 0;
        if (this.sits.some(sit => sit === user) === true) {
            console.log('User already sitting (' + user + ')');
            return;
        }
        for (let i in this.sits) {
            if (this.sits[i] === 0) { //first empty sit
                this.sits[i] = user; //sitting user on it
                break;
            }
        }
    }
    standUpUser(user) {
        //if(typeof user === 'undefined')
        //	throw new Error('User not specified');
        //if(user.id !== undefined)
        //	user = user.id;
        //if(typeof user !== 'number')
        //	user = user.id || 0;
        this.sits = this.sits.map(sit => (sit === user) ? 0 : sit)
            .sort((a, b) => a === 0 ? 1 : -1);
        this.unreadyAll();
    }
    setUserReady(user) {
        //if(typeof user === 'undefined')
        //	throw new Error('User not specified');
        //if(user.id !== undefined)
        //	user = user.id;
        //if(typeof user !== 'number')
        //	user = user.id || 0;
        if (this.sits.every(sit => sit !== 0) === false) //not every sit taken
            return false;
        for (let i in this.sits) {
            if (this.sits[i] === user && this.readys[i] === false) {
                this.readys[i] = true;
                return true;
            }
        }
        return false;
    }
    unreadyAll() {
        for (var i in this.readys)
            this.readys[i] = false;
    }
    everyoneReady() {
        return this.readys.every(r => r === true);
    }
    addUser(user) {
        for (let u of this.users) {
            if (u.id === user.id) { //user already in room - do not duplticate entry
                user.room = this;
                return;
            }
        }
        this.users.push(user);
        user.room = this;
    }
    removeUser(user) {
        if (typeof user === 'number') { //user id
            for (let u of this.users) {
                if (u.id === user)
                    return this.removeUser(u);
            }
            return false;
        }
        let i = this.users.indexOf(user);
        if (i > -1) {
            if (this.sits.indexOf(user.id) !== -1) //user is sitting
                this.standUpUser(user.id); //releasing this sit
            user.room = null;
            this.users.splice(i, 1);
            return true;
        }
        return false;
    }
}
RoomInfo.id = 0;
RoomInfo.DEFAULT_SITS = 1;
RoomInfo.DEFAULT_MAP = 'Open Maze'; //'Empty'
RoomInfo.DEFAULT_DURATION = 180; //seconds
// })();
//------------------------------------------------------//
try { //export for NodeJS
    module.exports = RoomInfo;
}
catch (e) { }
/* Client network handling */
///<reference path="../stages/stage.ts"/>
///<reference path="../../include/room_info.ts"/>
///<reference path="../../include/user_info.ts"/>
////<reference path="../game/client_game.js"/>
const Network = (function () {
    //@ts-ignore
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    $$.assert(typeof WebSocket !== 'undefined', 'No websocket support');
    //const SERVER_IP = '192.168.0.2';
    const PORT = 2674;
    var CurrentUser = null;
    var CurrentRoom = null;
    var CurrentGameHandle = null; //handle to ClientGame instance
    var socket = null;
    var connection_attempts = 0;
    var restoreConnection = function () {
        if (++connection_attempts < 5) //max attempts
            setTimeout(connectToServer, 5000);
        else
            console.error('Server unreachable');
    };
    var connectToServer = function () {
        // socket = new WebSocket('ws://' + SERVER_IP + ':' + PORT);
        socket = new WebSocket('ws://' + window.location.hostname + ':' + PORT);
        socket.onopen = function () {
            connection_attempts = 0;
            //console.log('Connected to server');
            let curr = Stage.getCurrent();
            if (curr != null)
                curr.onServerConnected();
        };
        socket.onmessage = function (message) {
            if (message.isTrusted !== true)
                return;
            try {
                if (typeof message.data === 'string') //JSON object
                    handleJSON(JSON.parse(message.data));
                else if (typeof message.data === 'object') { //object - propably array buffer
                    handleByteBuffer(message.data);
                }
                else
                    throw new Error('Incorrect message type');
            }
            catch (e) {
                console.log(e);
            }
        };
        socket.onclose = function (e) {
            //console.log('Server connection close', e.reason);
            restoreConnection();
            CurrentUser = null;
            CurrentRoom = null;
            socket = null;
            let curr = Stage.getCurrent();
            if (curr != null)
                curr.onServerDisconnect();
        };
        socket.onerror = function (error) {
            console.log('Socket error:', error);
        };
    };
    var handleJSON = function (json_data) {
        switch (json_data['type']) {
            //default: 
            //	throw new Error('Incorrect type value in JSON message');
            case NetworkCodes.PLAYER_ACCOUNT:
                //console.log(json_data, json_data['user_info']);
                try {
                    CurrentUser = UserInfo.fromFullJSON(json_data['user_info']);
                }
                catch (e) {
                    console.error('Cannot create user from JSON', e);
                }
                break;
            case NetworkCodes.ACCOUNT_DATA:
                try {
                    if (CurrentUser !== null) {
                        CurrentUser.custom_data = json_data['data'];
                        if (typeof json_data['friends'] === 'string')
                            CurrentUser.friends = JSON.parse(json_data['friends']);
                        else if (json_data['friends'] !== undefined)
                            CurrentUser.friends = json_data['friends'];
                    }
                }
                catch (e) {
                    console.error(e);
                }
                break;
            case NetworkCodes.JOIN_ROOM_CONFIRM:
            case NetworkCodes.CHANGE_ROOM_CONFIRM:
                try {
                    if (CurrentUser === null)
                        throw new Error('CurrentUser is null');
                    CurrentRoom = RoomInfo.fromJSON(json_data['room_info']);
                    json_data['users'].forEach((user) => CurrentRoom.addUser(UserInfo.fromJSON(user)));
                    CurrentUser.room = CurrentRoom;
                }
                catch (e) {
                    console.error('Cannot create user from JSON', e);
                }
                break;
            case NetworkCodes.ON_ROOM_UPDATE:
                if (CurrentRoom != null) {
                    let updated_room = RoomInfo.fromJSON(json_data['room_info']);
                    if (updated_room.id === CurrentRoom.id)
                        CurrentRoom.updateData(updated_room);
                }
                break;
            case NetworkCodes.LEAVE_ROOM_CONFIRM:
                CurrentRoom = null;
                if (CurrentUser)
                    CurrentUser.room = null;
                break;
            case NetworkCodes.USER_JOINED_ROOM:
                if (CurrentRoom == null)
                    throw new Error('CurrentRoom is empty');
                CurrentRoom.addUser(UserInfo.fromJSON(json_data['user_info']));
                break;
            case NetworkCodes.USER_LEFT_ROOM:
                if (CurrentRoom == null)
                    throw new Error('CurrentRoom is empty');
                CurrentRoom.removeUser(json_data['user_id']);
                CurrentRoom.updateData(json_data['room_info']);
                break;
            case NetworkCodes.ON_KICKED:
                CurrentRoom = null;
                if (CurrentUser)
                    CurrentUser.room = null;
                break;
            case NetworkCodes.START_GAME_FAIL:
                if (CurrentRoom == null)
                    throw new Error('CurrentRoom is empty');
                CurrentRoom.updateData(json_data['room_info']);
                break;
        }
        let curr = Stage.getCurrent();
        if (curr !== null) //passing message forward
            curr.onServerMessage(json_data);
    };
    var handleByteBuffer = (function () {
        //var reader = new FileReader(), second_reader = new FileReader();
        var readers = new Array(8).fill(0).map(() => {
            let reader = new FileReader();
            reader.onload = function () {
                try {
                    if (CurrentGameHandle !== null)
                        CurrentGameHandle.onServerData(new Float32Array(reader.result));
                }
                catch (e) {
                    console.error(e);
                }
            };
            return reader;
        });
        var reader_i;
        return function (data) {
            for (reader_i = 0; reader_i < readers.length; reader_i++) {
                if (readers[reader_i].readyState !== 1) { //found not busy receiver
                    readers[reader_i].readAsArrayBuffer(data);
                    return;
                }
            }
            //none of readers are free
            console.log('all package receivers are overloaded');
            setTimeout(handleByteBuffer, 1, data); //
        };
    })();
    var sendJSON = function (data) {
        try {
            //if(typeof data === 'string')
            //	data = JSON.parse(data);
            //socket.send( JSON.stringify(data) );
            if (typeof data !== 'string')
                data = JSON.stringify(data);
            if (socket === null)
                throw new Error('socket is null');
            socket.send(data);
        }
        catch (e) {
            console.error('Cannot send message (' + data + '), reason:', e);
        }
    };
    connectToServer(); //automatically after page load
    return {
        getCurrentUser: function () {
            return CurrentUser;
        },
        getCurrentRoom: function () {
            return CurrentRoom;
        },
        amISitting: function () {
            if (CurrentRoom === null || CurrentUser === null)
                return false;
            return CurrentRoom.isUserSitting(CurrentUser.id);
        },
        subscribeLobby: function () {
            sendJSON({ 'type': NetworkCodes.SUBSCRIBE_LOBBY_REQUEST });
        },
        joinRoom: function (id) {
            sendJSON({ 'type': NetworkCodes.JOIN_ROOM_REQUEST, 'id': id });
        },
        leaveRoom: function () {
            if (CurrentRoom === null)
                throw new Error('CurrentRoom is null');
            sendJSON({ 'type': NetworkCodes.LEAVE_ROOM_REQUEST, 'id': CurrentRoom.id });
        },
        createRoom: function () {
            sendJSON({ 'type': NetworkCodes.CREATE_ROOM_REQUEST });
        },
        sendRoomMessage: function (msg) {
            sendJSON({ 'type': NetworkCodes.SEND_ROOM_MESSAGE, 'msg': msg });
        },
        sendPrivateMessage: function (msg, target_user_id) {
            sendJSON({ 'type': NetworkCodes.SEND_PRIVATE_MESSAGE,
                'msg': msg, 'user_id': target_user_id });
        },
        sendAddFriendRequest: function (user_id) {
            sendJSON({ 'type': NetworkCodes.ADD_FRIEND_REQUEST, 'user_id': user_id });
        },
        sendRemoveFriendRequest: function (user_id) {
            sendJSON({ 'type': NetworkCodes.REMOVE_FRIEND_REQUEST, 'user_id': user_id });
        },
        sendSitRequest: function () {
            sendJSON({ 'type': NetworkCodes.SIT_REQUEST });
        },
        sendStandUpRequest: function () {
            sendJSON({ 'type': NetworkCodes.STAND_REQUEST });
        },
        sendReadyRequest: function () {
            sendJSON({ 'type': NetworkCodes.READY_REQUEST });
        },
        requestAccountData: function () {
            sendJSON({ 'type': NetworkCodes.ACCOUNT_DATA_REQUEST });
        },
        requestShipUse: function (type) {
            sendJSON({ 'type': NetworkCodes.SHIP_USE_REQUEST, 'ship_type': type });
        },
        requestShipBuy: function (type) {
            sendJSON({ 'type': NetworkCodes.SHIP_BUY_REQUEST, 'ship_type': type });
        },
        requestSkillBuy: function (skill_id) {
            sendJSON({ 'type': NetworkCodes.SKILL_BUY_REQUEST, 'skill_id': skill_id });
        },
        requestSkillUse: function (skill_id) {
            sendJSON({ 'type': NetworkCodes.SKILL_USE_REQUEST, 'skill_id': skill_id });
        },
        requestSkillPutOff: function (skill_id) {
            sendJSON({ 'type': NetworkCodes.SKILL_PUT_OFF_REQUEST, 'skill_id': skill_id });
        },
        //@skills - array of skill indexes and nulls
        requestSkillsOrder: function (skills) {
            sendJSON({ 'type': NetworkCodes.SKILLS_ORDER_REQUEST, 'skills': skills });
        },
        requestUserKick: function (user_id) {
            sendJSON({ 'type': NetworkCodes.USER_KICK_REQUEST, 'user_id': user_id });
        },
        sendRoomUpdateRequest: function (name, sits_number, duration, map, gamemode) {
            sendJSON({
                'type': NetworkCodes.ROOM_UPDATE_REQUEST,
                'name': name,
                'map': map,
                'gamemode': gamemode,
                'sits_number': sits_number,
                'duration': duration
            });
        },
        confirmGameStart: function () {
            sendJSON({ 'type': NetworkCodes.START_GAME_CONFIRM });
        },
        assignCurrentGameHandle: function (game /*: ClientGame*/) {
            CurrentGameHandle = game;
        },
        removeCurrentGameHandle: function () {
            CurrentGameHandle = null;
        },
        sendByteBuffer: function (buffer) {
            try {
                if (socket !== null)
                    socket.send(buffer);
            }
            catch (e) {
                console.error('Cannot send byte buffer:', e);
            }
        }
    };
})();
///<reference path="utils.ts"/>
///<reference path="../engine/network.ts"/>
///<reference path="../chat.ts"/>
///<reference path="../../include/user_info.ts"/>
const COMMON = (function () {
    const CHARS = 'abcdefghijklmnopqrstuvwxyz1234567890';
    const extractInt = (str) => parseInt(str.replace(/[^\d]/gi, ''));
    return {
        // createLoader: function(element, color) {
        createLoader: function (color = '#f44336') {
            const spin_style = { 'backgroundColor': color };
            return $$.create('DIV').addClass('spinner').addChild($$.create('DIV').addClass('double-bounce1').setStyle(spin_style)).addChild($$.create('DIV').addClass('double-bounce2').setStyle(spin_style));
        },
        createSwitcher: function (onSwitch) {
            let switcher = $$.create('BUTTON').addClass('switcher');
            switcher.on('click', () => {
                var on = switcher.className.match(/on/gi) != null;
                if (on)
                    switcher.removeClass('on');
                else
                    switcher.addClass('on');
                if (typeof onSwitch === 'function')
                    onSwitch(!on);
            });
            return switcher;
        },
        createOptionsList: function (options, on_select) {
            let options_list = $$.create('DIV').addClass('options_list');
            options.forEach(opt => {
                options_list.addChild($$.create('BUTTON').setText(opt).on('click', function () {
                    //prevent from selecting already selected option
                    if (this.className.indexOf('selected') !== -1)
                        return;
                    options_list.getChildren('BUTTON.selected').removeClass('selected');
                    this.addClass('selected');
                    if (typeof on_select === 'function')
                        on_select(opt);
                }));
            });
            $$.assert(options_list.selectOption === undefined, 'object already has "selectOption" property assigned');
            options_list.selectOption = function (opt) {
                options_list.getChildren('BUTTON').forEach((btn) => {
                    if (btn.innerText === opt)
                        btn.addClass('selected');
                    else
                        btn.removeClass('selected');
                });
                return this;
            };
            options_list.getSelectedOption = function () {
                try {
                    return options_list.getChildren('BUTTON.selected').innerHTML;
                }
                catch (e) {
                    return options.length > 0 ? options[0] : '';
                }
            };
            options_list.getSelectedOptionIndex = function () {
                try {
                    return options_list.getChildren('BUTTON').indexOf(options_list.getChildren('BUTTON.selected'));
                }
                catch (e) {
                    return 0;
                }
            };
            return options_list;
        },
        createNumberInput: function (min, max, prefix = '', postfix = '') {
            //$$.assert(typeof min === 'number' && typeof max === 'number', 
            //	'Arguments are to be numbers');
            // prefix = prefix || '';
            // postfix = postfix || '';
            const fixMinMaxOrder = function () {
                if (max < min) { //swap values to make arguments in order
                    let temp = min;
                    min = max;
                    max = temp;
                }
            };
            fixMinMaxOrder();
            let value_displ = $$.create('SPAN').addClass('value_displayer').setText(min);
            var changeVal = (dir) => {
                value_displ.setText(prefix +
                    Math.min(max, Math.max(min, extractInt(value_displ.innerText) + dir)) + postfix);
            };
            let interval;
            let hold = (e, dir) => {
                changeVal(dir);
                if (e.button !== 0)
                    return;
                interval = setInterval(() => {
                    if (input.isHover() === false) {
                        clearInterval(interval);
                        return;
                    }
                    changeVal(dir * 5);
                }, 500);
            };
            var input = $$.create('DIV').addClass('number_input')
                .addChild($$.create('SPAN').addClass('decrementer').html('-')
                .on('mousedown', (e) => hold(e, -1))
                .on('mouseup', () => clearInterval(interval)))
                .addChild(value_displ)
                .addChild($$.create('SPAN').addClass('incrementer').html('+')
                .on('mousedown', (e) => hold(e, 1))
                .on('mouseup', () => clearInterval(interval)));
            input.getValue = function () {
                return extractInt(value_displ.innerText);
            };
            input.setValue = function (val) {
                $$.assert(typeof val === 'number', 'Given value must be a number');
                if (val < min)
                    val = min;
                if (val > max)
                    val = max;
                value_displ.setText(prefix + val + postfix);
                return input;
            };
            input.setMinimumValue = function (val) {
                $$.assert(typeof val === 'number', 'Given value must be a number');
                min = val;
                fixMinMaxOrder();
                if (input.getValue() < min)
                    input.setValue(min);
            };
            return input;
        },
        createUserEntry: function (user) {
            //$$.assert(user instanceof UserInfo, 'Argument must be instance of UserInfo');
            let nick = $$.create('SPAN').addClass('nickname')
                .setText(COMMON.trimString(user.nick, 12));
            let rank = $$.create('SPAN').addClass('rank')
                .setText(Math.round(user.rank) + ' |  ' + user.level);
            let more_btn;
            let option_add_friend = $$.create('BUTTON').addClass('iconic_button')
                .addClass('iconic_empty').setText('Add friend').on('click', () => {
                Network.sendAddFriendRequest(user.id);
                options_bar.addClass('hidden');
                option_add_friend.setStyle({ 'display': 'none' });
            });
            let option_kick = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                .setText('KICK').on('click', () => {
                Network.requestUserKick(user.id);
            });
            let option_private_msg = $$.create('BUTTON').addClass('iconic_button')
                .addClass('iconic_chat').setAttrib('src', 'img/icons/chat_icon.svg')
                .setText('Chat').on('click', () => {
                if (Chat.currentInstance === null)
                    return;
                var new_bookmark = Chat.currentInstance.addBookmark(user.id, user.nick, false);
                if (!new_bookmark)
                    return;
                Chat.currentInstance.selectBookmark(new_bookmark);
                Chat.currentInstance.setHidden(false);
                options_bar.addClass('hidden');
            });
            let option_close = $$.create('IMG').addClass('icon_btn').addClass('option_close')
                .setAttrib('src', 'img/icons/close.png').on('click', () => {
                options_bar.addClass('hidden');
            }).setStyle({ 'float': 'right' });
            var curr_user = Network.getCurrentUser();
            if (curr_user === null)
                throw new Error('CurrentUser is null');
            let curr_id = curr_user.id;
            //not current user and current user is not guest
            if (user.id !== curr_id && curr_id > 0) {
                more_btn = $$.create('IMG').addClass('icon_btn').addClass('more')
                    .setAttrib('src', 'img/icons/more_vert.png').on('click', () => {
                    options_bar.removeClass('hidden');
                }).setStyle({ 'justifySelf': 'right' });
            }
            else
                more_btn = $$.create('SPAN');
            var options_bar = $$.create('DIV').addClass('options').addClass('hidden');
            if (curr_user.friends.find(f => f.id === user.id) === undefined && user.id > 0)
                options_bar.addChild(option_add_friend);
            options_bar.addChild(option_close);
            var curr_room = Network.getCurrentRoom();
            if (curr_room === null)
                throw new Error('CurrentUser is null');
            var curr_owner = curr_room.getOwner();
            //current user is room owner and target user is not himself
            if (curr_owner && curr_id === curr_owner.id && user.id !== curr_id)
                options_bar.addChild(option_kick);
            options_bar.addChild(option_private_msg);
            return [nick, rank, more_btn, options_bar];
        },
        generateRandomString: function (len) {
            return Array.from({ length: len }, () => {
                return CHARS[~~(Math.random() * CHARS.length)];
            }).join('');
        },
        trimString: function (str, max_len = 10, trimmer = '...') {
            $$.assert(typeof str === 'string', 'First argument must be a string (func@trimString)');
            //max_len = max_len || 10;
            if (str.length <= max_len)
                return str;
            else
                return str.substring(0, max_len) + trimmer;
        }
    };
})();
///<reference path="common/common.ts"/>
//const SessionWidget = (function() {//TODO - make rid of this class
//const session_random_string = COMMON.generateRandomString(10);
//var id = 0;
class SessionWidget {
    constructor() {
        this.id = SessionWidget.instances_count++; //count every created instance
    }
    get session_string() {
        return SessionWidget.session_random_string;
    }
    set session_string(val) {
        throw new Error('Cannot change session string after page load');
    }
}
SessionWidget.session_random_string = COMMON.generateRandomString(10);
SessionWidget.instances_count = 0;
//})();
///<reference path="session_widget.ts"/>
///<reference path="engine/network.ts"/>
///<reference path="common/common.ts"/>
class RoomsList extends SessionWidget {
    constructor() {
        super();
        //this.rooms = [];//used for updating existing rooms infos
    }
    get listWidget() {
        return $$('#rooms_list' + this.session_string + this.id) || $$(document.body);
    }
    clear() {
        //this.rooms = [];
        this.listWidget.getChildren('.html_list').html('');
    }
    onRoomJoined() {
        try {
            var curr_room = Network.getCurrentRoom();
            if (!curr_room)
                throw new Error('CurrentRoom is null');
            this.listWidget.getChildren("#room_list_entry_" + curr_room.id)
                .addClass('current_room');
        }
        catch (e) {
            console.error(e);
        }
    }
    onRoomLeft() {
        this.listWidget.getChildren('.html_list').getChildren('*').removeClass('current_room');
    }
    onRoomUpdate(room) {
        //$$.assert(room instanceof RoomInfo, 'Argument must be instance of RoomInfo class');
        try {
            let room_row = this.listWidget.getChildren("#room_list_entry_" + room.id);
            room_row.getChildren('.room_sits_info')
                .setText(room.taken_sits + '/' + room.sits.length);
            room_row.getChildren('.room_name_info').setText(COMMON.trimString(room.name, 10))
                .setAttrib('name', room.name); //atribute contains full name
            room_row.getChildren('.room_map_info').setText(room.map);
            room_row.getChildren('.room_mode_info').setText(room.gamemode === GAME_MODES.COOPERATION ? 'Coop' : 'Comp');
            room_row.getChildren('.room_duration_info')
                .setText(((room.duration / 60) | 0) + ' min');
        }
        catch (e) {
            console.error(e);
        }
    }
    pushRoomInfo(room) {
        //$$.assert(room instanceof RoomInfo, 'Argument must be instance of RoomInfo class');
        var entry = $$.create('DIV').setAttrib('id', 'room_list_entry_' + room.id)
            .addChild($$.create('SPAN').setText(COMMON.trimString(room.name, 10))
            .addClass('room_name_info').setAttrib('name', room.name)
            .setStyle({ 'gridColumn': '1', textAlign: 'left' }))
            .addChild($$.create('SPAN').addClass('room_sits_info')
            .setText(room.taken_sits + '/' + room.sits.length)
            .setStyle({ 'gridColumn': '2' }))
            .addChild($$.create('SPAN').addClass('room_duration_info')
            .setText(((room.duration / 60) | 0) + ' min'))
            .addChild($$.create('SPAN').addClass('room_map_info')
            .setText(room.map))
            .addChild($$.create('SPAN').addClass('room_mode_info')
            .setText(room.gamemode === GAME_MODES.COOPERATION ? 'Coop' : 'Comp'))
            .on('click', (e) => {
            Network.joinRoom(room.id);
        });
        //.addChild( $$.create('SPAN').html('USERS - todo').setStyle({gridColumn: '3'}) );
        this.listWidget.getChildren('.html_list').addChild(entry);
        this.listWidget.getChildren('H1').html('Avaible rooms');
    }
    removeRoomByID(room_id) {
        //$$.assert(typeof room_id === 'number', 'room_id must be a number');
        var entry = this.listWidget.getChildren('.html_list').getChildren('#room_list_entry_' + room_id);
        if (entry && typeof entry.remove === 'function') {
            const duration = 1000;
            entry.html('').setStyle({
                'transition': 'height ' + duration + 'ms ease-in-out',
                'height': '0px'
            });
            setTimeout(() => entry.remove(), duration);
        }
    }
    createWidget() {
        var container = $$.create('DIV').addClass('rooms_list')
            .setAttrib('id', 'rooms_list' + this.session_string + this.id)
            .addChild($$.create('H1').html('No rooms avaible')) //header
            .addChild(//rooms list control panel
        $$.create('DIV').addClass('rooms_list_control_panel')
            /*.addChild(
                $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                    .setText('SEARCH')
            )*/
            .addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
            .setText('CREATE').on('click', () => Network.createRoom())))
            .addChild($$.create('DIV').addClass('list_container')
            .addChild($$.create('DIV').addClass('html_list')) //list of avaible rooms
        );
        return container;
    }
}
const Maps = (function () {
    const MAP_FOLDER = typeof module === 'undefined' ? 'maps/' : 'assets/maps/';
    var fs, Canvas, Image;
    if (typeof module !== 'undefined') {
        fs = require('fs');
        Canvas = require('canvas');
        Image = Canvas.Image;
    }
    var pending = 1; //currently loading resources (0 means loaded)
    var onLoadCallbacks = [];
    var self = {
        loaded: () => pending === 0,
        onLoad: function (callback) {
            if (typeof callback !== 'function')
                throw new Error('callback must be a function');
            if (this.loaded())
                callback();
            else
                onLoadCallbacks.push(callback);
        },
        getByName: function (map_name) {
            for (let map_i in this) {
                if (typeof this[map_i] !== 'object')
                    continue;
                if (this[map_i].name === map_name) {
                    return this[map_i];
                }
            }
            return null;
        }
    };
    const printErr = (e) => console.error(e);
    function fixJSON(str) {
        str = str.replace(/(\/\/.*)|\n|\s/gi, '');
        str = '{' + str + '}';
        return str
            .replace(/(,|\{)([^,:\{\}]+):/gi, '$1"$2":')
            .replace(/,\}/g, '}');
    }
    function onMapDataLoadedClient(map) {
        //loading .png map texture
        let map_png = document.createElement('img');
        map_png.onload = () => {
            map.image = map_png;
            self[map.name] = map;
            pending--;
            //console.log(self);
            /*if(index === maps_names.length-1) {
                console.log('Maps data loaded');
                console.log(self);
            }*/
        };
        map_png.onerror = printErr;
        // map_png.src = MAP_FOLDER + map.name + '.png';
        map_png.setAttribute('src', MAP_FOLDER + map.name + '.png'); //07.10.2018
    }
    function onMapDataLoadedServer(map) {
        fs.readFile(MAP_FOLDER + map.name + '.png', function (err, squid) {
            if (err)
                throw err;
            var map_png = new Image();
            map_png.src = squid;
            //ctx.drawImage(img, 0, 0, img.width / 4, img.height / 4);
            map.image = map_png;
            self[map.name] = map;
            pending--;
        });
    }
    function loadMaps(maps_names) {
        //console.log(maps_names);
        maps_names.forEach((map_name, index) => {
            pending++;
            //self[map_name] = {};
            //console.log(map_name);
            let map = {
                name: map_name,
                data: null,
                image: null //IMG DOM element
            };
            //loading map data
            if (typeof module === 'undefined') { //client side
                fetch(MAP_FOLDER + map_name + '.map').then(resp => resp.text()).then(map_data => {
                    map.data = JSON.parse(fixJSON(map_data));
                    onMapDataLoadedClient(map);
                }).catch(printErr);
            }
            else { //server side
                fs.readFile(MAP_FOLDER + map_name + '.map', 'utf8', (err, map_data) => {
                    if (err)
                        throw err;
                    map.data = JSON.parse(fixJSON(map_data));
                    onMapDataLoadedServer(map);
                });
            }
            //loading map texture
        });
        pending--;
    }
    //loading list of files in MAP_FOLDER
    if (typeof module === 'undefined') {
        //client side
        fetch('/get_list_of_maps').then(resp => resp.json())
            .then(loadMaps).catch(printErr);
    }
    else {
        //server side
        fs.readdir(MAP_FOLDER, (err, files) => {
            if (err)
                throw err;
            //console.log( files.filter(f => f.endsWith('.map')).map(f => f.split('.')[0]) );
            loadMaps(files.filter(f => f.endsWith('.map')).map(f => f.split('.')[0]));
        });
    }
    let checkLoaded = () => {
        if (self.loaded())
            onLoadCallbacks.forEach(cb => cb());
        else
            setTimeout(checkLoaded, 100);
    };
    checkLoaded();
    return self;
})();
try { //export for NodeJS
    module.exports = Maps;
}
catch (e) { }
// if(global._CLIENT_)
// module.exports = Maps;
// export default Maps;
///<reference path="engine/network.ts"/>
///<reference path="../include/game/maps.ts"/>
///<reference path="session_widget.ts"/>
const RoomView = (function () {
    var amIsitting = () => {
        try {
            //@ts-ignore
            return Network.getCurrentRoom().isUserSitting(Network.getCurrentUser().id);
        }
        catch (e) {
            return false;
        }
    };
    const MINIMUM_MINUTES = 0;
    const MAXIMUM_MINUTES = 30;
    const gamemode_names = ['Cooperation', 'Competition'];
    function createMapPreviewWidget(map_name) {
        let map = Maps.getByName(map_name);
        if (map === null || map.image === null || map.data === null)
            throw `Map or it's image or it's data not found (${map_name})`;
        //Object.values(Maps).find(map => typeof map === 'object' && map.name === map_name);
        return $$.create('SPAN').setClass('map_preview').addChild($$.create('LABEL').setText(map.name)).addChild((() => {
            let canv = $$.create('CANVAS');
            canv.width = map.image.naturalWidth;
            canv.height = map.image.naturalHeight;
            let ctx = canv.getContext('2d', { antialias: true });
            //console.log(map.data);
            ctx.fillStyle = 'rgb(' + map.data['background_color'].join(',') + ')';
            ctx.fillRect(0, 0, canv.width, canv.height);
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(map.image, 0, 0, canv.width, canv.height);
            return canv;
        })());
    }
    function createClockWidget(minutes) {
        // jshint multistr:true
        let clock_widget = $$.create('SPAN')
            .addChild($$.create('SPAN').addClass('clock_chart').html('<svg width="100" height="100">\
						<circle r="25" cx="50" cy="50" class="stroker"></circle>\
						<circle r="35" cx="50" cy="50" class="centered"></circle>\
						<text x="50" y="50" text-anchor="middle" alignment-baseline="central">' +
            minutes + ' min' + '</text>\
					</svg>'));
        let angle = (minutes / MAXIMUM_MINUTES) * 158;
        //setTimeout(() => {
        clock_widget.getChildren('circle.stroker').setStyle({
            'strokeDasharray': angle + ' 158'
        });
        //}, 10);
        return clock_widget;
    }
    return class RoomView extends SessionWidget {
        constructor() {
            super();
            this.added_users_entries = [];
        }
        get roomWidget() {
            return $$('#room_view' + this.session_string + this.id) || $$(document.body);
        }
        checkOwnership() {
            try {
                //@ts-ignore
                var amIowner = Network.getCurrentRoom().getOwner().id === Network.getCurrentUser().id;
                this.roomWidget.getChildren('.room_settings_btn').disabled = !amIowner;
            }
            catch (e) {
                console.error(e);
            }
        }
        onCountdown(time) {
            var countdown_label = this.roomWidget.getChildren('.game_start_countdown_info');
            if (typeof time === 'number')
                countdown_label.addClass('active').setText('Game starting in ' + time + ' sec');
            else
                countdown_label.removeClass('active').setText('Waiting for everyone to be ready');
        }
        onRoomJoined() {
            var current_room = Network.getCurrentRoom();
            if (current_room === null)
                throw new Error('There isn\'t current room');
            this.roomWidget.getChildren('.no_room_info').setStyle({ display: 'none' });
            this.roomWidget.getChildren('.room_info').setStyle({ display: 'block' });
            // this.roomWidget.getChildren('.room_name').setText( current_room.name );
            // this.updateSits(current_room.sits, current_room.readys);
            this.updateRoomInfo(current_room);
            current_room.users.forEach(u => this.addUser(u));
            this.checkOwnership();
        }
        onRoomLeft() {
            try {
                this.roomWidget.getChildren('.no_room_info').setStyle({ display: 'inline-block' });
                this.roomWidget.getChildren('.room_info').setStyle({ display: 'none' });
                this.roomWidget.getChildren('.game_start_countdown_info')
                    .removeClass('active').setText('Waiting for everyone to be ready');
                this.roomWidget.getChildren('.room_settings').remove();
                this.added_users_entries.forEach(entry => entry.nodes.forEach(n => n.remove()));
                this.added_users_entries = [];
            }
            catch (e) { }
            //cleaning previous users list
            let users_list = this.roomWidget.getChildren('.users_list');
            if (!users_list)
                return;
            users_list.html('');
        }
        sitOrStand() {
            try {
                if (amIsitting())
                    Network.sendStandUpRequest();
                else
                    Network.sendSitRequest();
            }
            catch (e) {
                console.error('Cannot send sit/stand request:', e);
            }
        }
        updateRoomInfo(room) {
            if (room === null)
                throw new Error('null argument');
            //$$.assert(room instanceof RoomInfo, 'argument must be instance of RoomInfo');
            try {
                this.roomWidget.getChildren('.room_name').setText(room.name);
                this.roomWidget.getChildren('.settings_info .map_preview_info').html('')
                    .addChild(createMapPreviewWidget(room.map).addClass('static_preview'));
                //console.log( this.roomWidget.getChildren('.settings_info .map_preview') );
                this.roomWidget.getChildren('.settings_info .game_mode_info').setText(gamemode_names[room.gamemode]);
                this.roomWidget.getChildren('.settings_info .game_duration_info').html('')
                    .addChild(createClockWidget((room.duration / 60) | 0));
            }
            catch (e) {
                console.log('Not important error: ', e);
            }
            this.updateSits(room.sits, room.readys);
        }
        updateSits(sits, readys) {
            var current_room = Network.getCurrentRoom();
            if (current_room === null)
                throw new Error('There isn\'t current room');
            sits = sits || current_room.sits;
            readys = readys || current_room.readys;
            //console.log(sits);
            let sits_list = this.roomWidget.getChildren('.sits_list');
            if (!sits_list)
                return;
            sits_list.html(''); //removing previous content
            sits.forEach((sit, index) => {
                if (typeof sit !== 'number')
                    throw new Error('Incorrect array data (must contain only null or UserInfo');
                var entry = $$.create('DIV');
                if (sit === 0)
                    entry.addClass('empty').setText('EMPTY');
                else {
                    var sitting_user = current_room.getUserByID(sit);
                    if (sitting_user)
                        entry.setText(COMMON.trimString(sitting_user.nick, 12));
                    if (readys[index] === true)
                        entry.addClass('ready');
                }
                sits_list.addChild(entry);
            });
            try {
                let sit_or_stand_button = this.roomWidget.getChildren('.sit_or_stand_button');
                sit_or_stand_button.setText(amIsitting() ? 'STAND' : 'SIT');
                //disable sit button when every sit is taken but current user doesn't sit
                sit_or_stand_button.disabled = amIsitting() === false && sits.every(sit => sit !== 0);
                //enabling ready button when every sit is taken
                var ready_btn = this.roomWidget.getChildren('.sit_ready_button');
                //@ts-ignore //if every sit is taken and current user is sitting
                if (sits.every(sit => sit !== 0) && sits.indexOf(Network.getCurrentUser().id) !== -1)
                    ready_btn.disabled = false;
                else
                    ready_btn.disabled = true;
            }
            catch (e) {
                console.error(e);
            }
        }
        addUser(user) {
            let users_list = this.roomWidget.getChildren('.users_list');
            if (!users_list)
                return;
            //store array of DOM nodes associated with user
            let user_nodes = COMMON.createUserEntry(user);
            this.added_users_entries.push({
                id: user.id,
                nodes: user_nodes
            });
            users_list.addChild(user_nodes);
            this.checkOwnership();
        }
        removeUserByID(user_id) {
            // $$.assert(typeof user_id === 'number', 'user_id must be a number');
            for (let i = 0; i < this.added_users_entries.length; i++) {
                let entry = this.added_users_entries[i];
                if (entry.id === user_id) {
                    entry.nodes.forEach(node => node.remove());
                    this.added_users_entries.splice(i, 1);
                    i--;
                }
            }
            this.updateSits();
            this.checkOwnership();
        }
        openRoomSettings() {
            var current_room = Network.getCurrentRoom();
            if (current_room === null)
                throw new Error('There isn\'t current room');
            //makes room html elements
            var room_info = this.roomWidget.getChildren('.room_info');
            room_info.setStyle({ display: 'none' });
            var name_input = $$.create('INPUT').addClass('text_input')
                .setAttrib('type', 'text').setAttrib('name', 'room_name_input')
                .setAttrib('value', current_room.name).setAttrib('maxlength', '32');
            var sits_input = COMMON.createNumberInput(1, 6)
                .setValue(current_room.sits.length) //.setAttrib('name', 'room_sits_input')
                .setStyle({ display: 'inline-block', textAlign: 'center' });
            var mode_option = COMMON.createOptionsList(gamemode_names, (opt) => {
                //if competition
                if (opt === gamemode_names[GAME_MODES.COMPETITION])
                    sits_input.setMinimumValue(2); //minimum 2 sits in competition mode
                else
                    sits_input.setMinimumValue(1);
            }).selectOption(gamemode_names[current_room['gamemode']]) //default option
                .setStyle({
                'display': 'inline-block',
                'margin': '10px',
                'box-shadow': '0px 3px 5px #0003',
                'filter': 'hue-rotate(15deg)'
            });
            var duration_input = COMMON.createNumberInput(MINIMUM_MINUTES, MAXIMUM_MINUTES, undefined, ' min')
                .setValue((current_room.duration / 60) | 0)
                .setStyle({ display: 'inline-block', textAlign: 'center' });
            var maps_horizontal_list = $$.create('DIV').setClass('maps_list');
            Maps.onLoad(() => {
                Object.keys(Maps).map(key => Maps[key])
                    .sort((a, b) => b.name === 'Empty' ? 1 : (a.name > b.name ? -1 : 0))
                    .forEach(map => {
                    if (typeof map !== 'object') //discard functions
                        return;
                    let map_preview = createMapPreviewWidget(map.name).on('click', () => {
                        //uncheck all map previews
                        this.roomWidget.getChildren('.map_preview')
                            .forEach((prev) => prev.removeClass('selected'));
                        //check chosen one
                        map_preview.addClass('selected');
                    });
                    if (current_room.map === map.name)
                        map_preview.addClass('selected');
                    maps_horizontal_list.addChild(map_preview);
                });
            });
            var applySettings = () => {
                //console.log('apply', name_input.value, sits_input.getValue());
                //TODO - sending update request only when any setting has changed
                Network.sendRoomUpdateRequest(name_input.value, sits_input.getValue(), duration_input.getValue() * 60, this.roomWidget.getChildren('.map_preview.selected > label').innerHTML, mode_option.getSelectedOptionIndex());
            };
            var roomSettings = $$.create('DIV').addClass('room_settings').addChild($$.create('H1').setStyle({ display: 'table', borderBottom: '1px solid #90A4AE' }).addChild($$.create('DIV').setStyle({ 'display': 'table-cell' }).html('Room settings')).addChild($$.create('DIV').addClass('close_btn').addClass('opacity_and_rot_transition')
                .setStyle({ 'display': 'table-cell' }).on('click', () => {
                //applying settings before closing
                applySettings();
                //closing room settings
                room_info.setStyle({ display: 'block' });
                roomSettings.remove();
            }))).addChild(//settings one below each other
            $$.create('DIV').addClass('settings_container').addChild(//room name
            $$.create('DIV').addChild($$.create('LABEL').html('Name:'))
                .addChild(name_input)).addChild($$.create('DIV').addChild($$.create('LABEL').html('Mode:'))
                .addChild(mode_option)).addChild(//sits number
            $$.create('DIV').addChild($$.create('LABEL').html('Sits:'))
                .addChild(sits_input)).addChild(//duration
            $$.create('DIV').addChild($$.create('LABEL').html('Duration:'))
                .addChild(duration_input))).addChild(//list of avaible maps
            maps_horizontal_list).addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                .html('APPLY').setStyle({ margin: '15px' }).on('click', applySettings));
            this.roomWidget.addChild(roomSettings);
        }
        createWidget() {
            return $$.create('DIV').setClass('room_view')
                .setAttrib('id', 'room_view' + this.session_string + this.id)
                .addChild(//not in room info
            $$.create('DIV').html('Join a room to play with other players')
                .addClass('no_room_info')).addChild($$.create('DIV').setStyle({ display: 'none' }).addClass('room_info').addChild($$.create('H1') //header
                .addChild($$.create('BUTTON')
                .addClass('iconic_button').addClass('iconic_settings')
                .addClass('room_settings_btn').setAttrib('disabled', '')
                .html('EDIT').setStyle({ 'float': 'left' }).on('click', () => {
                this.openRoomSettings();
            })).addChild($$.create('SPAN').setClass('room_name')
                .html('name'))).addChild(
            //middle horizontal panel with game settings info
            $$.create('H2').addClass('settings_info')
                .addChild($$.create('SPAN').addClass('map_preview_info'))
                .addChild($$.create('DIV').addClass('game_mode_info'))
                .addChild($$.create('SPAN').addClass('game_duration_info'))).addChild($$.create('DIV').setClass('game_start_countdown_info')
                .html('Waiting for everyone to be ready')).addChild($$.create('SECTION').addChild(//main content
            $$.create('DIV').setStyle({ width: '100%' })
                .addChild(//sit / stand button
            $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                .addClass('sit_or_stand_button')
                .setStyle({ gridColumn: '1', gridRow: '1',
                marginBottom: '10px', marginRight: '10px' })
                .html('SIT').on('click', () => this.sitOrStand()))
                .addChild(//ready button
            $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                .addClass('sit_ready_button')
                .setStyle({ gridColumn: '1', gridRow: '1', marginBottom: '10px' })
                .setAttrib('disabled', '')
                .html('READY').on('click', () => Network.sendReadyRequest()))).addChild(//leave room button
            $$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
                .setStyle({ gridColumn: '2', gridRow: '1', marginBottom: '10px' })
                .html('LEAVE ROOM').on('click', event => {
                //leaving room request
                try {
                    Network.leaveRoom();
                }
                catch (e) {
                    console.error('cannot send leave room request: ', e);
                }
            })).addChild(//sits list
            $$.create('DIV').addClass('sits_list')
                .setStyle({ gridColumn: '1', gridRow: '2' })).addChild(//users list container for table
            $$.create('DIV').addClass('users_list_container').addChild($$.create('DIV').addClass('users_list') //list of users
                .setStyle({ gridColumn: '2', gridRow: '2' })))));
        }
    };
})();
// var awaiting_notificatinons = [];
class HeaderNotifications {
    constructor() {
        this.notification_active = false;
        this.widget = $$.create('DIV').setClass('header_notifications');
        this.quene = [];
        // this.notification_active = false;
        while (HeaderNotifications.awaiting_notificatinons.length > 0)
            this.addNotification(HeaderNotifications.awaiting_notificatinons.shift(), false);
    }
    addNotification(text, from_quene = false) {
        if (this.notification_active === false || from_quene === true) {
            this.notification_active = true;
            let notif_node = $$.create('SPAN').setText(text);
            this.widget.append(notif_node);
            setTimeout(() => {
                notif_node.remove();
                if (this.quene.length === 0)
                    this.notification_active = false;
                else
                    this.addNotification(this.quene.shift(), true);
            }, 5900); //little less than animation duration
        }
        else
            this.quene.push(text);
    }
    static addNotification(text) {
        HeaderNotifications.awaiting_notificatinons.push(text);
    }
}
HeaderNotifications.awaiting_notificatinons = [];
//const Colors = (function() {/*GAME COLORS PALETTE*/
var ColorsScope;
//const Colors = (function() {/*GAME COLORS PALETTE*/
(function (ColorsScope) {
    const toHexString = (number) => '#' + ('000000' + number.toString(16)).substr(-6);
    var i;
    function gen(r, g, b) {
        return {
            byte_buffer: new Uint8Array([r, g, b /*, 1*/]),
            buffer: new Float32Array([r / 255, g / 255, b / 255, 1]),
            hex: toHexString(r << 16 | g << 8 | b << 0)
        };
    }
    const PALETTE = {
        PLAYERS_COLORS: [
            gen(225, 53, 61),
            gen(139, 195, 74),
            gen(14, 177, 190),
            gen(207, 218, 34),
            gen(251, 140, 44),
            gen(158, 94, 140),
            gen(233, 30, 99),
            gen(121, 85, 72) //BROWN
        ],
        WHITE: gen(255, 255, 255),
        BLACK: gen(0, 0, 0),
        WALLS: gen(156, 185, 237),
        SAFE_AREA: gen(96, 255, 96),
        ENEMY_SPAWN: gen(245, 68, 55),
        POISON: gen(178, 204, 101),
        HEALTH_BAR: gen(229, 115, 104),
        IMMUNITY_AUREOLE: gen(255, 255, 59)
    };
    ColorsScope.Colors = Object.assign({ 
        //NOTE - alpha value does not matter
        compareByteBuffers: function (buff1, buff2) {
            for (i = 0; i < 3; i++) {
                if (buff1[i] != buff2[i])
                    return false;
            }
            return true;
        }, isPlayerColor: function (buff) {
            for (var player_col_i = 0; player_col_i < PALETTE.PLAYERS_COLORS.length; player_col_i++) {
                if (ColorsScope.Colors.compareByteBuffers(PALETTE.PLAYERS_COLORS[player_col_i].byte_buffer, buff) === true)
                    return true;
            }
            return false;
        }, PLAYERS_COLORS: PALETTE.PLAYERS_COLORS }, PALETTE);
    //Object.assign(self, PALETTE);
    //return self;
})(ColorsScope || (ColorsScope = {}));
var Colors = ColorsScope.Colors;
try { //export for NodeJS
    module.exports = Colors;
}
catch (e) { }
var VectorScope;
(function (VectorScope) {
    let AVAIBLE_TYPES;
    (function (AVAIBLE_TYPES) {
        AVAIBLE_TYPES[AVAIBLE_TYPES["INT32"] = 0] = "INT32";
        AVAIBLE_TYPES[AVAIBLE_TYPES["FLOAT"] = 1] = "FLOAT";
    })(AVAIBLE_TYPES || (AVAIBLE_TYPES = {}));
    /* once declared variables for performance matter */
    var values_sum, length_buff, it;
    const pow2 = (a) => a * a; //fast square power function
    class Vector {
        constructor(type, size) {
            this._vec_size = size;
            switch (type) {
                case AVAIBLE_TYPES.INT32:
                    this._buffer = new Int32Array(size);
                    break;
                case AVAIBLE_TYPES.FLOAT:
                    this._buffer = new Float32Array(size);
                    break;
                default:
                    throw new Error('Incorrect vector type');
            }
        }
        get size() {
            return this._vec_size;
        }
        set size(s) {
            throw new Error('Vector size cannot be changed after it is created');
        }
        /*static get TYPE() {
            return AVAIBLE_TYPES;
        }*/
        // set() {
        // 	for(let i in arguments) {
        // 		if(i >= this._buffer.length)//safety for too many arguments
        // 			break;
        // 		this._buffer[i] = arguments[i];
        // 	}
        // 	return this;
        // }
        set(...args) {
            for (var i = 0; i < args.length; i++) {
                if (i >= this._buffer.length) //safety for too many arguments
                    break;
                this._buffer[i] = args[i];
            }
            return this;
        }
        get buffer() {
            return this._buffer;
        }
        /*XYZW short access functions*/
        get x() { return this._buffer[0]; }
        set x(x) { this._buffer[0] = x; }
        get y() { return this._buffer[1]; }
        set y(y) { this._buffer[1] = y; }
        get z() { return this._buffer[2]; }
        set z(z) { this._buffer[2] = z; }
        get w() { return this._buffer[3]; }
        set w(w) { this._buffer[3] = w; }
        ///////////////////////////////////////////////
        lengthSqrt() {
            values_sum = 0;
            //for(value_it of this._buffer)
            for (var value_i = 0; value_i < this._buffer.length; value_i++)
                values_sum += pow2(this._buffer[value_i]);
            return values_sum;
        }
        length() {
            return Math.sqrt(this.lengthSqrt());
        }
        normalize() {
            length_buff = this.length();
            if (length_buff > 0)
                this.scaleBy(1.0 / length_buff);
            return this;
        }
        dot(in_vec) {
            values_sum = 0;
            for (it = 0; it < this._vec_size; it++)
                values_sum += this._buffer[it] * in_vec._buffer[it];
            return values_sum;
        }
        scaleBy(factor) {
            for (it = 0; it < this._vec_size; it++)
                this._buffer[it] *= factor;
        }
        //STATIC METHOD FOR CALCULATIONS
        //returns squared distance between two 2D points
        static distanceSqrt(p1, p2) {
            return pow2(p2.x - p1.x) + pow2(p2.y - p1.y);
        }
    }
    Vector.TYPE = AVAIBLE_TYPES;
    Vector.Vec2f = class Vec2f extends Vector {
        constructor(...args) {
            super(AVAIBLE_TYPES.FLOAT, 2);
            super.set(...args);
        }
    };
    Vector.Vec3f = class Vec3f extends Vector {
        constructor(...args) {
            super(AVAIBLE_TYPES.FLOAT, 3);
            super.set(...args);
        }
    };
    Vector.Vec4f = class Vec4f extends Vector {
        constructor(...args) {
            super(AVAIBLE_TYPES.FLOAT, 4);
            super.set(...args);
        }
    };
    VectorScope.Vector = Vector;
    //return Vector;
})(VectorScope || (VectorScope = {}));
var Vector = VectorScope.Vector;
try { //export for NodeJS
    module.exports = Vector;
}
catch (e) { }
///<reference path="vector.ts"/>
try {
    //@ts-ignore
    var Vector = require('./../utils/vector');
}
catch (e) { }
var MatrixScope;
(function (MatrixScope) {
    class Matrix2D extends Vector {
        constructor() {
            super(Vector.TYPE.FLOAT, 9);
            this._rot = 0;
            this._width = 1;
            this._height = 1;
            this.setIdentity();
        }
        // SETTERS
        setIdentity() {
            super.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
            this._rot = 0;
            this._width = 1; //width
            this._height = 1; //height
            return this;
        }
        setPos(x, y) {
            this._buffer[6] = x;
            this._buffer[7] = y;
            return this;
        }
        move(x, y) {
            this._buffer[6] += x;
            this._buffer[7] += y;
            return this;
        }
        _setRotScale(rot, w, h) {
            this._rot = rot;
            this._width = w;
            this._height = h;
            let c = Math.cos(rot);
            let s = Math.sin(rot);
            this._buffer[0] = w * c;
            this._buffer[1] = w * -s;
            this._buffer[3] = h * s;
            this._buffer[4] = h * c;
            return this;
        }
        setScale(w, h) {
            return this._setRotScale(this._rot, w, h);
        }
        setRot(rot) {
            return this._setRotScale(rot, this._width, this._height);
        }
        set rot(rot) {
            this._setRotScale(rot, this._width, this._height);
        }
        //GETTERS (some overrides from vector class)
        get x() { return this._buffer[6]; }
        set x(x) { this._buffer[6] = x; }
        get y() { return this._buffer[7]; }
        set y(y) { this._buffer[7] = y; }
        get rot() { return this._rot; }
        get width() { return this._width; }
        get height() { return this._height; }
    }
    MatrixScope.Matrix2D = Matrix2D;
})(MatrixScope || (MatrixScope = {}));
var Matrix2D = MatrixScope.Matrix2D;
try { //export for NodeJS
    module.exports = Matrix2D;
}
catch (e) { }
///<reference path="common/colors.ts"/>
///<reference path="../utils/matrix2d.ts"/>
///<reference path="maps.ts"/>
// const PaintLayer = (function(/*Matrix2D, Colors,*/) {
var PaintLayer;
///<reference path="common/colors.ts"/>
///<reference path="../utils/matrix2d.ts"/>
///<reference path="maps.ts"/>
// const PaintLayer = (function(/*Matrix2D, Colors,*/) {
(function (PaintLayer) {
    try {
        var _Matrix2D_ = require('./../utils/matrix2d');
        var _Colors_ = require('./../game/common/colors');
        var Canvas = require('canvas');
    }
    catch (e) {
        var _Matrix2D_ = Matrix2D;
        var _Colors_ = Colors;
    }
    //CHUNK_RES / CHUNK_SIZE should be 1024 at highest settings
    var CHUNK_RES = 128; //resolution of single chunk (256)
    const CHUNK_SIZE = 0.25; //size of a single chunk compared to screen height
    if (typeof module === 'undefined') { //client-side only
        var applyResolution = function () {
            //@ts-ignore
            if (typeof SETTINGS === 'undefined')
                throw new Error('Client-side SETTINGS module required');
            //@ts-ignore
            switch (SETTINGS.painter_resolution) {
                case 'LOW':
                    CHUNK_RES = 64;
                    break;
                case 'MEDIUM':
                    CHUNK_RES = 128;
                    break;
                case 'HIGH':
                    CHUNK_RES = 256;
                    break;
            }
        };
        setTimeout(applyResolution, 1);
    }
    const PI_2 = Math.PI * 2.0;
    //performance mater variables
    var sxi_temp, syi_temp, sxi, syi, exi, eyi, xx, yy, temp, itY, itX, ch_i, chunk_ctx, relXs, relYs, relXe, relYe, thick_off, rad_off, pixel_i, ii;
    var clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const pow2 = (a) => a * a;
    class Layer {
        constructor() {
            // this._color = '#fff';
            // this.composite = 'source-over';
            // this.chunks = [];
            this._color = '#fff';
            this.composite = 'source-over';
            this.chunks = [];
            this.map_size = 1; //default
            this.walls_thickness = 0;
            this.size = 0;
            this.spawn_radius = 0;
            this.spawn_thickness = 0;
            // //this.size
            // this.map_size = 1;//default
            // this.walls_thickness = 0;
            //this.spawn_radius = 0.5;
            //this.spawn_thickness = 0.08;
        }
        destroy() {
            this.chunks.forEach(ch => {
                if (ch.webgl_texture != null)
                    ch.webgl_texture.destroy();
                delete ch.canvas;
                delete ch.buff;
            });
            //@ts-ignore
            this.chunks = null;
        }
        static get CHUNK_RES() {
            return CHUNK_RES;
        }
        static get CHUNK_SIZE() {
            return CHUNK_SIZE;
        }
        generateChunks() {
            if (!this.size)
                throw new Error('No size specified for number chunks');
            this.size = Math.round(this.size / CHUNK_SIZE);
            this.map_size = this.size * CHUNK_SIZE;
            console.log('map size:', this.map_size, 'number of chunks:', this.size * this.size);
            let chunks_memory = 2 * (this.size * this.size * CHUNK_RES * CHUNK_RES * 4 / (1024 * 1024));
            console.log('\tmemory:', chunks_memory + 'MB');
            this.chunks = [];
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    let mat = new _Matrix2D_();
                    mat.setScale(CHUNK_SIZE, CHUNK_SIZE);
                    xx = -(this.size - 1) * CHUNK_SIZE + x * CHUNK_SIZE * 2;
                    yy = (this.size - 1) * CHUNK_SIZE - y * CHUNK_SIZE * 2;
                    mat.setPos(xx, yy);
                    let canvas;
                    if (typeof module === 'undefined') {
                        canvas = document.createElement('canvas');
                        canvas.width = CHUNK_RES;
                        canvas.height = CHUNK_RES;
                    }
                    else {
                        canvas = new Canvas(CHUNK_RES, CHUNK_RES);
                    }
                    let ctx = canvas.getContext('2d', { antialias: true, alpha: true });
                    if (!ctx)
                        throw "Cannot get canvas context";
                    if (typeof module !== 'undefined') {
                        //@ts-ignore
                        ctx.antialias = 'none';
                        ctx.filter = 'fast';
                        //@ts-ignore
                        ctx.patternQuality = 'fast';
                    }
                    ctx.lineCap = 'round'; //butt, square
                    this.chunks.push({
                        matrix: mat,
                        canvas: canvas,
                        ctx: ctx,
                        buff: null,
                        //new Uint8Array(CHUNK_RES * CHUNK_RES * 4),
                        webgl_texture: null,
                        need_update: false
                    });
                }
            }
        }
        get color() {
            return this._color;
        }
        set color(val) {
            this._color = val;
        }
        //receives start and end point coordinates
        drawLine(sx, sy, ex, ey, thickness, prevent_chunks_update = false) {
            thick_off = (thickness / this.map_size) / 2 * this.size;
            sxi = (sx / this.map_size + 1.0) / 2.0 * this.size;
            syi = (-sy / this.map_size + 1.0) / 2.0 * this.size;
            exi = (ex / this.map_size + 1.0) / 2.0 * this.size;
            eyi = (-ey / this.map_size + 1.0) / 2.0 * this.size;
            //fixing order
            if (exi < sxi) {
                temp = exi;
                exi = sxi;
                sxi = temp;
            }
            if (eyi < syi) {
                temp = eyi;
                eyi = syi;
                syi = temp;
            }
            sxi = clamp(sxi - thick_off, 0, this.size - 1) | 0;
            syi = clamp(syi - thick_off, 0, this.size - 1) | 0;
            exi = clamp(exi + thick_off, 0, this.size - 1) | 0;
            eyi = clamp(eyi + thick_off, 0, this.size - 1) | 0;
            thickness *= CHUNK_RES / CHUNK_SIZE;
            for (itY = syi; itY <= eyi; itY++) {
                for (itX = sxi; itX <= exi; itX++) {
                    ch_i = itY * this.size + itX;
                    //calculating relative coords
                    relXs = (sx + this.size * CHUNK_SIZE - itX * CHUNK_SIZE * 2) / (CHUNK_SIZE * 2.0) *
                        CHUNK_RES;
                    relYs = (-sy + this.size * CHUNK_SIZE - itY * CHUNK_SIZE * 2) / (CHUNK_SIZE * 2.0) *
                        CHUNK_RES;
                    relXe = (ex + this.size * CHUNK_SIZE - itX * CHUNK_SIZE * 2) / (CHUNK_SIZE * 2.0) *
                        CHUNK_RES;
                    relYe = (-ey + this.size * CHUNK_SIZE - itY * CHUNK_SIZE * 2) / (CHUNK_SIZE * 2.0) *
                        CHUNK_RES;
                    chunk_ctx = this.chunks[ch_i].ctx;
                    if (!prevent_chunks_update)
                        this.chunks[ch_i].need_update = true;
                    chunk_ctx.globalCompositeOperation = this.composite;
                    chunk_ctx.strokeStyle = this._color;
                    chunk_ctx.lineWidth = thickness | 0;
                    chunk_ctx.beginPath();
                    chunk_ctx.moveTo(relXs | 0, relYs | 0);
                    chunk_ctx.lineTo(relXe | 0, relYe | 0);
                    chunk_ctx.stroke();
                }
            }
        }
        drawCircle(sx, sy, radius, prevent_chunks_update = false) {
            radius /= 2;
            rad_off = (radius / this.map_size) * this.size; //NOTE - no / 2 here
            sxi_temp = (sx / this.map_size + 1.0) / 2.0 * this.size;
            syi_temp = (-sy / this.map_size + 1.0) / 2.0 * this.size;
            sxi = clamp(sxi_temp - rad_off, 0, this.size - 1) | 0;
            syi = clamp(syi_temp - rad_off, 0, this.size - 1) | 0;
            exi = clamp(sxi_temp + rad_off, 0, this.size - 1) | 0;
            eyi = clamp(syi_temp + rad_off, 0, this.size - 1) | 0;
            radius *= CHUNK_RES / CHUNK_SIZE;
            for (itY = syi; itY <= eyi; itY++) {
                for (itX = sxi; itX <= exi; itX++) {
                    ch_i = itY * this.size + itX;
                    //calculating relative coords
                    relXs = (sx + this.size * CHUNK_SIZE - itX * CHUNK_SIZE * 2) / (CHUNK_SIZE * 2.0) *
                        CHUNK_RES;
                    relYs = (-sy + this.size * CHUNK_SIZE - itY * CHUNK_SIZE * 2) / (CHUNK_SIZE * 2.0) *
                        CHUNK_RES;
                    chunk_ctx = this.chunks[ch_i].ctx;
                    if (!prevent_chunks_update)
                        this.chunks[ch_i].need_update = true;
                    chunk_ctx.globalCompositeOperation = this.composite;
                    chunk_ctx.beginPath();
                    chunk_ctx.arc(relXs | 0, relYs | 0, radius | 0, 0, PI_2, false);
                    chunk_ctx.fillStyle = this._color;
                    chunk_ctx.fill();
                }
            }
        }
        paintMapWalls(map) {
            //this.color = Colors.WALLS.hex;
            if (map.data === null)
                throw "No map data found";
            var smooth = map.data['smooth_texture'] || false; //image smoothing during scale
            let map_canvas;
            if (typeof module === 'undefined') {
                map_canvas = document.createElement('canvas');
                map_canvas.width = CHUNK_RES * this.size; //image.naturalWidth;
                map_canvas.height = CHUNK_RES * this.size; //image.naturalHeight;
            }
            else
                map_canvas = new Canvas(CHUNK_RES * this.size, CHUNK_RES * this.size);
            let map_ctx = map_canvas.getContext('2d', { antialias: true, alpha: true });
            if (typeof module !== 'undefined') {
                //@ts-ignore
                map_ctx.antialias = 'false';
                //@ts-ignore
                map_ctx.patternQuality = 'fast';
            }
            //map_ctx.fillStyle = this.color;
            //@ts-ignore
            map_ctx['mozImageSmoothingEnabled'] = smooth;
            //@ts-ignore
            map_ctx['webkitImageSmoothingEnabled'] = smooth;
            //@ts-ignore
            map_ctx['msImageSmoothingEnabled'] = smooth;
            map_ctx['imageSmoothingEnabled'] = smooth;
            if (map.image !== null)
                map_ctx.drawImage(map.image, 0, 0, map_canvas.width, map_canvas.height);
            var canvasData = map_ctx.getImageData(0, 0, map_canvas.width, map_canvas.height), pix = canvasData.data;
            var cbuff = _Colors_.WALLS.byte_buffer;
            for (var i = 0, n = pix.length; i < n; i += 4) {
                pix[i + 3] = pix[i];
                pix[i + 0] = cbuff[0];
                pix[i + 1] = cbuff[1];
                pix[i + 2] = cbuff[2];
            }
            map_ctx.putImageData(canvasData, 0, 0);
            //TEST - saving loaded map as image (server side)
            /*(function() {
                if(typeof module === 'undefined')
                    return;
                //console.log(__dirname);
                var fs = require('fs'),
                    out = fs.createWriteStream('./preview.png'),
                    stream = map_canvas.pngStream();
                 
                stream.on('data', function(chunk){
                    out.write(chunk);
                });
                 
                stream.on('end', function(){
                    console.log('saved png');
                });
            })();*/
            //drawing image on each chunk
            for (itY = 0; itY < this.size; itY++) {
                for (itX = 0; itX < this.size; itX++) {
                    ch_i = itY * this.size + itX;
                    chunk_ctx = this.chunks[ch_i].ctx;
                    this.chunks[ch_i].need_update = true;
                    // chunk_ctx['imageSmoothingEnabled'] = true;
                    chunk_ctx.putImageData(canvasData, -CHUNK_RES * itX, -CHUNK_RES * itY, CHUNK_RES * itX, CHUNK_RES * itY, CHUNK_RES, CHUNK_RES);
                }
            }
            if (typeof map_canvas.remove === 'function')
                map_canvas.remove();
        }
        //draw walls on edges so players cannot escape map area
        drawWalls(thickness, restrict, prevent_chunks_update = false) {
            this.color = _Colors_.WALLS.hex;
            this.walls_thickness = thickness;
            if (restrict === undefined)
                restrict = 0x0F; //binary -> 00001111
            //top
            if (restrict & (1 << 0))
                this.drawLine(-this.map_size, this.map_size - thickness, this.map_size, this.map_size - thickness, thickness, prevent_chunks_update);
            //bottom
            if (restrict & (1 << 1))
                this.drawLine(-this.map_size, -this.map_size + thickness, this.map_size, -this.map_size + thickness, thickness, prevent_chunks_update);
            //left
            if (restrict & (1 << 2))
                this.drawLine(-this.map_size + thickness, -this.map_size, -this.map_size + thickness, this.map_size, thickness, prevent_chunks_update);
            //right
            if (restrict & (1 << 3))
                this.drawLine(this.map_size - thickness, -this.map_size, this.map_size - thickness, this.map_size, thickness, prevent_chunks_update);
            //TEMP
            this.color = _Colors_.POISON.hex;
            //const rad = 0.1;
            /*var stains = [];
            for(let j=0; j<20; j++) {
                //var xxx = Math.random()*5;
                //var yyy = Math.random()*5;
                let stain = [];
                for(let i=0; i<6; i++) {
                    var rx = (Math.random() - 0.5), ry = (Math.random() - 0.5),
                        rs = (Math.random()*0.5 + 0.5);
                    rx = Math.floor(rx*100)/100;
                    ry = Math.floor(ry*100)/100;
                    rs = Math.floor(rs*100)/100;
                    //this.drawCircle(xxx + rx*rad, yyy + ry*rad,
                    //	rs*rad);
                    stain.push( [rx, ry, rs] );
                }
                stains.push(stain);
            }
            console.log( JSON.stringify(stains) );*/
        }
        drawSpawn(radius, thickness, prevent_chunks_update = false) {
            this.spawn_radius = radius;
            this.spawn_thickness = thickness;
            this.color = _Colors_.WALLS.hex;
            this.drawCircle(0, 0, radius, prevent_chunks_update);
            //this.paintHole(0, 0, radius - thickness);
            this.color = _Colors_.WHITE.hex;
            this.composite = 'destination-out';
            //NOTE - cannot invoke this.paintHole due to recursion issue
            this.drawCircle(0, 0, radius - thickness, prevent_chunks_update);
            this.composite = 'source-over'; //restore default
            this.color = _Colors_.SAFE_AREA.hex + 'A0'; //semi transparent
            this.drawCircle(0, 0, radius - thickness, prevent_chunks_update);
        }
        paintHole(sx, sy, radius) {
            this.color = _Colors_.WHITE.hex; //"#ffff";
            this.composite = 'destination-out';
            this.drawCircle(sx, sy, radius, false);
            this.composite = 'source-over'; //restore default
            //repainting undestructable walls, spawn area etc
            var bytes = 0x00;
            //console.log(sx, sy, radius, this.map_size, this.walls_thickness);
            if (sy + radius > this.map_size - this.walls_thickness * 2.0)
                bytes |= 1 << 0;
            else if (sy - radius < -this.map_size + this.walls_thickness * 2.0)
                bytes |= 1 << 1;
            if (sx + radius > this.map_size - this.walls_thickness * 2.0)
                bytes |= 1 << 3;
            else if (sx - radius < -this.map_size + this.walls_thickness * 2.0)
                bytes |= 1 << 2;
            if (bytes !== 0)
                this.drawWalls(this.walls_thickness, bytes, true);
            //checking spawn
            if (pow2(sx) + pow2(sy) <= pow2(this.spawn_radius + this.spawn_thickness + radius)) {
                if (this.spawn_radius && this.spawn_thickness)
                    this.drawSpawn(this.spawn_radius, this.spawn_thickness, true);
            }
        }
        //@x, y - pixel coordinates, @out_buff - Uint8Array buffer for color data
        getPixelColor(x, y, out_buff) {
            sxi = ((x / this.map_size + 1.0) / 2.0 * this.size) | 0;
            syi = ((-y / this.map_size + 1.0) / 2.0 * this.size) | 0;
            ch_i = syi * this.size + sxi;
            //safety for incorrect coords issues
            if (this.chunks[ch_i] /* && this.chunks[ch_i].buff != null*/) {
                relXs = (x + this.size * CHUNK_SIZE - sxi * CHUNK_SIZE * 2) / (CHUNK_SIZE * 2.0) *
                    CHUNK_RES;
                relYs = (-y + this.size * CHUNK_SIZE - syi * CHUNK_SIZE * 2) / (CHUNK_SIZE * 2.0) *
                    CHUNK_RES;
                pixel_i = ((relXs | 0) + (relYs | 0) * CHUNK_RES) * 4;
                for (ii = 0; ii < 4; ii++) {
                    out_buff[ii] = this.chunks[ch_i].buff.data[pixel_i + ii];
                }
            }
        }
    }
    PaintLayer.Layer = Layer;
})(PaintLayer || (PaintLayer = {})); //)();
try { //export for NodeJS
    module.exports = PaintLayer;
}
catch (e) { }
///<reference path="../../utils/matrix2d.ts"/>
//namespace Object2DScope {
// var Object2D = (function(Matrix2D: MatrixScope.Matrix2D) {
// try {
// 	var Matrix2D: typeof MatrixScope.Matrix2D = require('./../../utils/matrix2d');
// } catch(e) {}
try {
    var _Matrix2D_ = require('./../../utils/matrix2d');
}
catch (e) {
    var _Matrix2D_ = Matrix2D;
}
class Object2D extends _Matrix2D_ {
    constructor() {
        super();
        this.expired = false;
        this.frames_since_last_update = 0;
        //NOTE - clientside only use
        this.timestamp = Date.now(); //timestamp of previous object update
        this.id = ++Object2D.instance_id;
        // this.expired = false;
        //serverside only use for some types of objects
        // this.frames_since_last_update = 0;
    }
    destroy() { }
    ;
    update(delta) { }
    ;
}
Object2D.instance_id = 0;
//return Object2D;
//}
// })(
// typeof Matrix2D !== 'undefined' ? Matrix2D : require('./../../utils/matrix2d')
// );
//var Object2D = Object2DScope.Object2D;
try { //export for NodeJS
    module.exports = Object2D;
}
catch (e) { }
///<reference path="object2d.ts"/>
//namespace Object2DScope {
var Object2DSmooth = (function (Object2D) {
    // try {
    // 	if(typeof Object2D === 'undefined') {
    // 		//@ts-ignore
    // 		var Object2D = require('./object2d');
    // 	}
    // }
    // catch(e) {}
    // var Object2DSmooth = (function() {
    // 	const SMOOTHNESS = 20, POS_SMOOTHNESS = 20, PI_2 = Math.PI * 2.0;
    //@ts-ignore
    class Object2DSmooth extends Object2D {
        constructor() {
            super();
            this.actual_x = 0;
            this.actual_y = 0;
            this.actual_rot = 0;
            //console.log('smooth object2d');
        }
        //@ts-ignore
        setPos(x, y, do_not_smooth = false) {
            this.actual_x = x;
            this.actual_y = y;
            if (do_not_smooth === true)
                super.setPos(x, y);
            return this;
        }
        move(x, y, do_not_smooth = false) {
            this.actual_x += x;
            this.actual_y += y;
            if (do_not_smooth === true)
                super.move(x, y);
            return this;
        }
        //@ts-ignore
        setRot(rot, do_not_smooth = false) {
            this.actual_rot = rot;
            if (do_not_smooth === true)
                super.setRot(rot);
            return this;
        }
        set rot(rot) {
            this.actual_rot = rot;
        }
        //GETTERS (some overrides from vector class)
        get x() { return this.actual_x; }
        set x(x) { this.actual_x = x; }
        get y() { return this.actual_y; }
        set y(y) { this.actual_y = y; }
        get rot() { return this.actual_rot; }
        update(delta) {
            var x_dt, y_dt, rot_dt;
            x_dt = this.actual_x - this._buffer[6];
            y_dt = this.actual_y - this._buffer[7];
            super.setPos(this._buffer[6] + x_dt * delta * Object2DSmooth.POS_SMOOTHNESS, this._buffer[7] + y_dt * delta * Object2DSmooth.POS_SMOOTHNESS);
            ///////////////////////////////////////////////////////
            rot_dt = this.actual_rot - this._rot;
            if (rot_dt > Math.PI)
                rot_dt -= Math.PI * 2.0;
            else if (rot_dt < -Math.PI)
                rot_dt += Math.PI * 2.0;
            super.setRot(this._rot + rot_dt * delta * Object2DSmooth.SMOOTHNESS *
                (Math.abs(rot_dt * 2.0)));
            while (this._rot < 0)
                super.setRot(this._rot + Object2DSmooth.PI_2);
            while (this._rot > Object2DSmooth.PI_2)
                super.setRot(this._rot - Object2DSmooth.PI_2);
            //super.update(delta);//Object2D
        }
    }
    Object2DSmooth.SMOOTHNESS = 20;
    Object2DSmooth.POS_SMOOTHNESS = 20;
    Object2DSmooth.PI_2 = Math.PI * 2.0;
    return Object2DSmooth;
    //}
})(typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js'));
//var Object2DSmooth = Object2DScope.Object2DSmooth;
try { //export for NodeJS
    module.exports = Object2DSmooth;
}
catch (e) { }
///<reference path="../objects/object2d_smooth.ts"/>
var MovementScope;
///<reference path="../objects/object2d_smooth.ts"/>
(function (MovementScope) {
    //try {
    //var Object2DSmooth = require('./../objects/object2d_smooth');
    //}
    //catch(e) {}
    class Movement {
        constructor() {
            // this.speed = 0;
            this.speed = 0;
            this._state = 0;
            this.smooth = true;
            this.maxSpeed = 0.4;
            this.acceleration = 0.5;
            this.turnSpeed = Math.PI;
            /*this.setOptions({//default options
                maxSpeed: 0.4,
                acceleration: 0.5,
                turnSpeed: Math.PI
            });*/
            // this._state = 0;//strores bit flags
            // this.smooth = true;
        }
        set(flag, enable = false) {
            if (enable)
                this._state |= flag;
            else
                this._state &= ~flag;
        }
        resetState() {
            this._state = 0;
        }
        setMaxSpeed() {
            this.speed = this.maxSpeed;
        }
        get state() {
            return this._state;
        }
        set state(value) {
            this._state = value;
        }
        setOptions(opt) {
            if (opt.maxSpeed)
                this.maxSpeed = opt.maxSpeed;
            if (opt.acceleration)
                this.acceleration = opt.acceleration;
            if (opt.turnSpeed)
                this.turnSpeed = opt.turnSpeed;
        }
        applyMove(object, delta) {
            if ((this._state & Movement.FLAGS.LOCKED_SPEED) === 0) {
                if (this._state & Movement.FLAGS.UP)
                    this.speed = Math.min(this.speed + this.acceleration * delta, this.maxSpeed);
                if (this._state & Movement.FLAGS.DOWN)
                    this.speed = Math.max(this.speed - this.acceleration * delta, 0);
            }
            Movement.rot = object.rot;
            if (this._state & Movement.FLAGS.LEFT)
                Movement.rot -= delta * this.turnSpeed;
            if (this._state & Movement.FLAGS.RIGHT)
                Movement.rot += delta * this.turnSpeed;
            while (Movement.rot < 0)
                Movement.rot += Movement.PI_2;
            while (Movement.rot > Movement.PI_2)
                Movement.rot -= Movement.PI_2;
            //@ts-ignore
            object.setRot(Movement.rot, !this.smooth);
            object.move(Math.cos(Movement.fixAngle(Movement.rot)) * delta * this.speed, Math.sin(Movement.fixAngle(Movement.rot)) * delta * this.speed);
        }
    }
    // private static H_PI = Math.PI/2;
    Movement.PI_2 = Math.PI * 2;
    Movement.fixAngle = (a) => -a + Math.PI / 2;
    Movement.rot = 0;
    Movement.FLAGS = {
        LEFT: 1 << 0,
        RIGHT: 1 << 1,
        UP: 1 << 2,
        DOWN: 1 << 3,
        LOCKED_SPEED: 1 << 4
    };
    MovementScope.Movement = Movement;
})(MovementScope || (MovementScope = {}));
//Object.assign(self, FLAGS);
//return self;
//})();
const Movement = MovementScope.Movement;
try { //export for NodeJS
    module.exports = Movement;
}
catch (e) { }
///<reference path="../../utils/vector.ts"/>
///<reference path="../common/colors.ts"/>
//const Painter = (function() {
try {
    var __Vector__ = require('./../../utils/vector');
}
catch (e) {
    var __Vector__ = Vector;
}
try {
    var __Vector__ = require('./../../utils/vector');
}
catch (e) { }
class Painter {
    constructor(color, thickness) {
        this.active = false;
        this.lastPos = new __Vector__.Vec2f(0, 0); //for painting purpouses
        this.color = color;
        this.thickness = thickness || Painter.DEFAULT_THICKNESS;
        // this.active = false;
    }
}
Painter.DEFAULT_THICKNESS = 0.015;
;
//})();
//	typeof Vector !== 'undefined' ? Vector : require('./../../utils/vector.js')
//);
try { //export for NodeJS
    module.exports = Painter;
}
catch (e) { }
// const Skills = (function() {
var SkillsScope;
// const Skills = (function() {
(function (SkillsScope) {
    /*interface SkillObjectDerived extends SkillObject {
        new(): SkillObject;
    }*/
    //NOTE - in case of continuous skils the energy cost is per second
    class SkillObject {
        constructor(skill_data) {
            this.cooldown = 0;
            this._in_use = false;
            this.data = skill_data; //const
            this.data.continuous = !!this.data.continuous; //make sure it is a bool
            //this.cooldown = 0;
            //this._in_use = false;//for continous skills
        }
        canBeUsed(avaible_energy) {
            return avaible_energy + 0.001 >= this.data.energy_cost &&
                this.cooldown <= 0; // && 
            //this._in_use === false;
        }
        isContinous() {
            return this.data.continuous;
        }
        use() {
            this.cooldown += this.data.cooldown || 0;
            //if(this.data.continuous === true)
            this._in_use = true;
            return this.data.energy_cost;
        }
        stopUsing() {
            this._in_use = false;
            //if(this.isContinous())
            //	this.cooldown = 0;//NOTE - experimental (hacking vulnerability)
        }
        isInUse() {
            return this._in_use;
        }
        update(delta) {
            /*if(this.cooldown !== 0) {
                if( (this.cooldown -= delta) < 0 )
                    this.cooldown = 0;
            }*/
            if (this.cooldown > 0)
                this.cooldown -= delta;
        }
    }
    SkillsScope.SkillObject = SkillObject;
    SkillsScope.Skills = {
        // SHIP SPECIFIC SKILLS:
        SHOOT1: {
            //id: 0,
            continuous: true,
            energy_cost: 0.015,
            cooldown: 0.25,
            texture_name: 'shot1_skill' //clientside only (texture asset name)
        },
        SHOOT2: {
            continuous: true,
            energy_cost: 0.0175,
            cooldown: 0.25,
            texture_name: 'shot2_skill'
        },
        SHOOT3: {
            continuous: true,
            energy_cost: 0.02,
            cooldown: 0.25,
            texture_name: 'shot3_skill'
        },
        // DEFFENSIVE SKILLS
        SHIELD: {
            energy_cost: 0.1,
            cooldown: 16,
            texture_name: 'shield_skill',
            name: 'Shield',
            description: 'Active shield that protects player from damage for some time.',
            lvl_required: 3,
            price: 500 //coins
        },
        INSTANT_HEAL: {
            energy_cost: 0.3,
            cooldown: 15,
            texture_name: 'heal_skill',
            name: 'Instant Heal',
            description: 'Instantly restores some of your health.',
            lvl_required: 9,
            price: 8000
        },
        // OFFSENSIVE SKILLS
        BOUNCE_SHOT: {
            continuous: true,
            energy_cost: 0.05,
            cooldown: 0.5,
            texture_name: 'bounce_shot_skill',
            name: 'Bounce Shot',
            description: 'Shoot a bullet that bouncing off the walls. \nCauses stronger damage than regular bullets.',
            lvl_required: 5,
            price: 1000 //coins
        },
        ENERGY_BLAST: {
            energy_cost: 0.1,
            cooldown: 2,
            texture_name: 'energy_blast_skill',
            name: 'Energy Blast',
            description: 'Release a blast of energy that strikes nearby enemies.',
            lvl_required: 7,
            price: 2000 //coins
        },
        BOMB: {
            energy_cost: 0.5,
            cooldown: 30,
            texture_name: 'bomb_skill',
            name: 'Bomb',
            description: 'Place a bomb that explodes a while later killing every nearby enemy.',
            lvl_required: 9,
            price: 8000
        },
        //PASSIVE SKILLS
        SPEED: {
            energy_cost: 0.1,
            cooldown: 4,
            texture_name: 'speed_skill',
            name: 'Speed Boost',
            description: 'Makes you fast as bullet for some period of time.',
            lvl_required: 3,
            price: 500 //coins
        },
        //NOTE - new skills must be add at the end of this object due to preserve it's id order
        //or change order in mysql database
        getById: function (id) {
            for (var s in this) {
                if (typeof this[s] === 'object' && this[s].id === id)
                    return this[s];
            }
            return undefined;
        },
        Skill: SkillObject
    };
    function skillCreator(skill) {
        return () => new SkillObject(skill);
    }
    //indexing skills
    let i = 0;
    for (let prop in SkillsScope.Skills) {
        if (typeof SkillsScope.Skills[prop] === 'object') {
            SkillsScope.Skills[prop].id = i++;
            SkillsScope.Skills[prop].create = skillCreator(SkillsScope.Skills[prop]);
        }
    }
    //console.log(Skills);
    //return Skills;
})(SkillsScope || (SkillsScope = {}));
var Skills = SkillsScope.Skills;
try { //export for NodeJS
    module.exports = Skills;
}
catch (e) { }
///<reference path="../objects/object2d.ts"/>
///<reference path="movement.ts"/>
var EffectsScope;
///<reference path="../objects/object2d.ts"/>
///<reference path="movement.ts"/>
(function (EffectsScope) {
    try {
        var _Movement_ = require('./movement');
    }
    catch (e) {
        var _Movement_ = Movement;
    }
    const SPEED_VALUE = 1.0; //should match DEFAULT_SPEED from bullet.js 
    const EFFECTS_SCHEMA = {
        SPAWN_IMMUNITY: { duration: 3 },
        SHIELD: {
            //id: 0,
            duration: 8 //seconds
        },
        SPEED: { duration: 2 },
        POISONING: { duration: 0.5 }
    };
    var e_i = 0;
    // for(var eff in EFFECTS_SCHEMA)
    // 	EFFECTS_SCHEMA[eff].id = e_i++;
    for (var eff in EFFECTS_SCHEMA) {
        //@ts-ignore
        EFFECTS_SCHEMA[eff].id = e_i++;
    }
    class Effects {
        constructor(owner) {
            this.a_effects = [];
            this.owner = owner;
            //this.a_effects = [];//active effects
        }
        clearAll() {
            this.a_effects = [];
        }
        active(effect) {
            this.onEffectStart(effect);
            //renew effect duration if one is already active
            for (e_i = 0; e_i < this.a_effects.length; e_i++) {
                if (this.a_effects[e_i].id === effect.id) {
                    this.a_effects[e_i].timer = 0;
                    return;
                }
            }
            this.a_effects.push({
                id: effect.id,
                duration: effect.duration || 0,
                timer: 0
            });
        }
        isActive(effect) {
            for (e_i = 0; e_i < this.a_effects.length; e_i++) {
                if (this.a_effects[e_i].id === effect.id)
                    return true;
            }
            return false;
        }
        onEffectStart(effect) {
            switch (effect) {
                default: break;
                case EFFECTS_SCHEMA.SPEED:
                    if (this.owner.movement !== undefined) { //affect object's movement
                        this.owner.movement.set(_Movement_.FLAGS.LOCKED_SPEED, true);
                        this.owner.movement.speed = SPEED_VALUE;
                    }
                    break;
            }
        }
        onEffectEnd(effect_id) {
            switch (effect_id) {
                default: break;
                case EFFECTS_SCHEMA.SPEED.id:
                    if (this.owner.movement !== undefined) { //affect object's movement
                        this.owner.movement.speed = this.owner.movement.maxSpeed;
                        this.owner.movement.set(_Movement_.FLAGS.LOCKED_SPEED, false);
                    }
                    break;
            }
        }
        update(delta) {
            for (e_i = 0; e_i < this.a_effects.length; e_i++) {
                if ((this.a_effects[e_i].timer += delta) >= this.a_effects[e_i].duration === true) {
                    this.onEffectEnd(this.a_effects[e_i].id);
                    this.a_effects.splice(e_i, 1);
                    e_i--;
                }
            }
            //console.log(this.a_effects.length);
        }
    }
    Effects.TYPES = EFFECTS_SCHEMA;
    EffectsScope.Effects = Effects;
    //Object.assign(Effects, EFFECTS_SCHEMA);
})(EffectsScope || (EffectsScope = {}));
const Effects = EffectsScope.Effects;
try { //export for NodeJS
    module.exports = Effects;
}
catch (e) { }
//const Sensor = (function() {
class Sensor {
    constructor(shape) {
        this.shape = shape || Sensor.SHAPES.TRIANGLE; //default shape
    }
}
Sensor.SHAPES = {
    TRIANGLE: [[0.0, 1.0], [-1.0, -1.0], [1.0, -1.0], [-0.5, 0.0], [0.5, 0.0]],
    SQUARE: [[0.0, 1.0], [-1.0, -1.0], [1.0, -1.0], [-0.5, 0.0], [0.5, 0.0]],
    PENTAGON: [
        [0.0, 1.0], [-0.5, 1.0], [0.5, 1.0], [-0.5, -1.0], [0.5, -1.0], [-1.0, -0.5], [1.0, -0.5]
    ],
    ROCKET: [[0.0, 1.0], [-1.0, -0.9], [1.0, -0.9], [-0.5, 0.5], [0.5, 0.5]],
    CIRCLE: new Array(8).fill(0).map((_, index, arr) => {
        var a = Math.PI * 2.0 * (index / arr.length) + Math.PI / 2;
        return [Math.cos(a), Math.sin(a)].map(v => Math.abs(v) < 1e-10 ? 0 : v);
    }),
    BULLET: [[0.0, 1.0], [0.0, -1.0], [-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]]
};
//})();
try { //export for NodeJS
    module.exports = Sensor;
}
catch (e) { }
//const Emoticon = (function() {//NOTE - this file assumes that Entities module exists
///<reference path="object2d.ts"/>
var Emoticon = (function () {
    try {
        var _Object2D_ = require('./object2d');
    }
    catch (e) {
        var _Object2D_ = Object2D;
    }
    const SCALE = 0.07, DURATION = 2, FADING_DURATION = 0.5; //durations in seconds
    const OFFSET_ANGLE = Math.PI / 4.0, PARENT_OFFSET = 0.15;
    var sc = 0;
    return class Emoticon extends _Object2D_ {
        constructor(name, parent) {
            super();
            this.factor = 0;
            this.timer = 0;
            super.setScale(0, 0);
            this.name = name;
            this.parent = parent;
            // this.factor = 0;
            // this.timer = 0;
            this.streak = new _Object2D_();
            this.streak.setRot(OFFSET_ANGLE);
            if (name !== 'hand.svg') //exception (TODO - hand icon in yellow circle)
                //@ts-ignore
                Entities.addObject(Entities['STREAK'].id, this.streak);
            //@ts-ignore
            Entities.addObject(Entities[Emoticon.entityName(this.name)].id, this);
        }
        destroy() {
            //@ts-ignore
            Entities.removeObject(Entities['STREAK'].id, this.streak);
            //@ts-ignore
            Entities.removeObject(Entities[Emoticon.entityName(this.name)].id, this);
        }
        endEffect() {
            this.timer = Math.max(this.timer, DURATION - FADING_DURATION);
        }
        update(delta) {
            if ((this.timer += delta) > DURATION)
                this.expired = true;
            if (this.factor < 1) { //showing up factor
                if ((this.factor += delta * 3.0) > 1)
                    this.factor = 1;
            }
            if (DURATION - this.timer < FADING_DURATION)
                sc = Math.pow((DURATION - this.timer) / FADING_DURATION, 2) * SCALE;
            else
                sc = Math.pow(this.factor, 2) * SCALE;
            super.setPos(this.parent.x + Math.cos(OFFSET_ANGLE) * Math.pow(this.factor, 2) * PARENT_OFFSET, this.parent.y + Math.sin(OFFSET_ANGLE) * Math.pow(this.factor, 2) * PARENT_OFFSET);
            this.streak.setPos((this.x + this.parent.x) / 2, (this.y + this.parent.y) / 2);
            this.streak.setScale(sc, PARENT_OFFSET * 0.5 * Math.pow(this.factor, 2));
            super.setScale(sc, sc);
        }
        static entityName(emoticon_name) {
            return 'EMOT_' + emoticon_name.replace(/\.[a-zA-Z]+/gi, ''); //NOTE - removes extention
        }
    };
})();
// var Emoticon = EmoticonScope.Emoticon;
///<reference path="../common/movement.ts"/>
///<reference path="../common/painter.ts"/>
///<reference path="../common/colors.ts"/>
///<reference path="../common/skills.ts"/>
///<reference path="../common/effects.ts"/>
///<reference path="../common/sensor.ts"/>
///<reference path="object2d_smooth.ts"/>
////<reference path="../../../client/game/entities.ts"/>
///<reference path="emoticon.ts"/>
////<reference path="../../../client/game/emitters/player_emitter.ts"/>
////<reference path="../../../client/game/emitters/poisoning_emitter.ts"/>
var Player = (function ( /*Object2D, Movement, Sensor, Painter, Colors, Skills, Effects*/) {
    // namespace PlayerScope {
    var _a;
    try {
        //var _Object2D_: typeof Object2D = require('./object2d');
        var _ExtendClass_ = require('./object2d');
        //var _Object2DSmooth_: typeof Object2DSmooth = require('./object2d_smooth');
        var _Movement_ = require('./../common/movement');
        var _Sensor_ = require('./../common/sensor');
        var _Painter_ = require('./../common/painter');
        var _Colors_ = require('./../common/colors');
        var _Skills_ = require('./../common/skills');
        var _Effects_ = require('./../common/effects');
    }
    catch (e) {
        //var _Object2D_ = Object2D;
        //@ts-ignore
        var _ExtendClass_ = Object2DSmooth;
        //var _Object2DSmooth_ = Object2DSmooth;
        var _Movement_ = Movement;
        var _Sensor_ = Sensor;
        var _Painter_ = Painter;
        var _Colors_ = Colors;
        var _Skills_ = Skills;
        var _Effects_ = Effects;
    }
    const TYPES = {
        TRIANGLE: 0,
        SQUARE: 1,
        PENTAGON: 2
    };
    const SHIP_NAMES = ['Triangle ship', 'Square ship', 'Pentagon ship'];
    const SHIP_LVL_REQUIREMENTS = [1, 3, 6]; //level required to be able to use ship
    const SHIP_COSTS = [0, 500, 3000]; //coins required to buy ship
    //array of sensor shapes with order corresponding to player TYPES
    const PLAYER_SENSOR_SHAPES = [
        _Sensor_.SHAPES.TRIANGLE, _Sensor_.SHAPES.SQUARE, _Sensor_.SHAPES.PENTAGON
    ];
    const PLAYER_BASIC_SKILLS = [
        _Skills_.SHOOT1,
        _Skills_.SHOOT2,
        _Skills_.SHOOT3
    ];
    //initial parameters
    const SCALE = 0.05, THICKNESS = 0.015, MAX_SPEED = 0.4, TURN_SPEED = Math.PI;
    const POISON_STRENGTH = 0.1;
    var s_i, em_i;
    //(typeof module !== 'undefined' ? _Object2D_ : _Object2DSmooth_)
    return _a = class Player extends _ExtendClass_ {
            constructor(type, skills, color) {
                super();
                this.emoticons = []; //NOTE - only clientside used
                super.setScale(SCALE, SCALE);
                this.user_id = 0; //server-side use
                this.nick = '';
                this.level = 0;
                this.rank = 0;
                this.movement = new _Movement_();
                this.movement.setOptions({
                    maxSpeed: MAX_SPEED,
                    turnSpeed: TURN_SPEED
                });
                this.type = type;
                this._hp = 1;
                this._energy = 1;
                //list of skills avaible by player (skills bar)
                this.skills = [PLAYER_BASIC_SKILLS[type].create()]; //basic skill (space)
                try {
                    skills.forEach((skill_id, index) => {
                        if (skill_id !== null) {
                            let skill_schema = _Skills_.getById(skill_id);
                            if (skill_schema === undefined)
                                throw `Cannot find skill by id: ${skill_id}`;
                            this.skills.push(skill_schema.create());
                        }
                        else
                            this.skills.push(null);
                    });
                }
                catch (e) {
                    console.error(e);
                }
                this.effects = new _Effects_(this);
                //this.emoticons = [];//client-side only
                this._points = 0;
                this.kills = 0;
                this.deaths = 0;
                this.sensor = new _Sensor_(PLAYER_SENSOR_SHAPES[type]);
                this.painter = new _Painter_(color, THICKNESS);
                //@ts-ignore
                if (typeof Entities !== 'undefined') {
                    this.entity_name = Player.entityName(type, color); //clientside only
                    //@ts-ignore
                    Entities.addObject(Entities[this.entity_name].id, this);
                }
                //@ts-ignore //client side
                if (typeof Renderer !== 'undefined' && typeof Emitters !== 'undefined') {
                    //@ts-ignore
                    this.emitter = Renderer.Class.addEmitter(new Emitters.Player(this));
                    this.poisoning_emitter = null;
                }
            }
            destroy() {
                //@ts-ignore
                if (typeof Entities !== 'undefined') {
                    console.log('removing player from entities');
                    //@ts-ignore
                    Entities.removeObject(Entities[this.entity_name].id, this);
                }
                if (this.emitter)
                    this.emitter.expired = true;
                if (this.poisoning_emitter)
                    this.poisoning_emitter.expired = true;
            }
            onPoisoned() {
                if (this.poisoning_emitter === null)
                    //@ts-ignore
                    this.poisoning_emitter = Renderer.Class.addEmitter(new Emitters.Poisoning(this));
                else
                    this.poisoning_emitter.resetTimer();
            }
            //clientside only function
            showEmoticon(name) {
                for (em_i = 0; em_i < this.emoticons.length; em_i++)
                    this.emoticons[em_i].endEffect();
                this.emoticons.push(new Emoticon(name, this));
            }
            update(delta) {
                this.movement.applyMove(this, delta);
                for (s_i = 0; s_i < this.skills.length; s_i++) {
                    if (this.skills[s_i] !== null)
                        //@ts-ignore
                        this.skills[s_i].update(delta);
                }
                this.effects.update(delta);
                if (this.effects.isActive(_Effects_.TYPES.POISONING))
                    this.hp -= POISON_STRENGTH * delta;
                super.update(delta);
                //update emoticons
                for (em_i = 0; em_i < this.emoticons.length; em_i++) {
                    if (this.emoticons[em_i].expired === true) {
                        this.emoticons[em_i].destroy();
                        this.emoticons.splice(em_i, 1);
                        em_i--;
                    }
                    else
                        this.emoticons[em_i].update(delta);
                }
                if (this.emitter)
                    this.emitter.update(delta);
                if (this.poisoning_emitter) {
                    this.poisoning_emitter.update(delta);
                    if (this.poisoning_emitter.expired === true)
                        this.poisoning_emitter = null;
                }
            }
            isAlive() {
                return this._hp >= 0.005;
            }
            get hp() {
                return this._hp;
            }
            set hp(value) {
                //if hp dropped but SHIELD effect is active
                if (value < this._hp &&
                    (this.effects.isActive(_Effects_.TYPES.SHIELD) ||
                        this.effects.isActive(_Effects_.TYPES.SPAWN_IMMUNITY))) {
                    return; //do not update hp
                }
                this._hp = Math.min(1, Math.max(0, value));
            }
            get energy() {
                return this._energy;
            }
            set energy(value) {
                this._energy = Math.min(1, Math.max(0, value));
            }
            get points() {
                return this._points;
            }
            set points(value) {
                this._points = Math.round(Math.max(0, value));
            }
            static get INITIAL_SCALE() {
                return SCALE;
            }
            static get SHIP_NAMES() {
                return SHIP_NAMES;
            }
            static get SHIP_COSTS() {
                return SHIP_COSTS;
            }
            static get SHIP_LVL_REQUIREMENTS() {
                return SHIP_LVL_REQUIREMENTS;
            }
            static entityName(type_i, color) {
                return 'PLAYER_' + type_i + '_' + _Colors_.PLAYERS_COLORS.indexOf(color);
            }
        },
        //static get TYPES() {
        //	return TYPES;
        //}
        _a.TYPES = TYPES,
        _a;
})(
// typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js'),
// typeof Movement !== 'undefined' ? Movement : require('./../common/movement'),
// typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor'),
// typeof Painter !== 'undefined' ? Painter : require('./../common/painter'),
// typeof Colors !== 'undefined' ? Colors : require('./../common/colors'),
// typeof Skills !== 'undefined' ? Skills : require('./../common/skills'),
// typeof Effects !== 'undefined' ? Effects : require('./../common/effects')
);
// var Player = PlayerScope.Player;
try { //export for NodeJS
    module.exports = Player;
}
catch (e) { }
///<reference path="object2d.ts"/>
const HpBar = (function () {
    try {
        var _Object2D_ = require('./object2d');
    }
    catch (e) {
        var _Object2D_ = Object2D;
    }
    const SCALE = 0.004; //HEIGHT SCALE
    //const WIDENNESS = 8;//WIDTH = SCALE * WIDENNESS * hp
    const HEIGHT_OFFSET = 1.3; //multiplier
    const ETITY_NAME = 'HEALTH_BAR';
    return class HpBar extends _Object2D_ {
        constructor(widenness, regeneration = 0) {
            super();
            super.setScale(widenness, 0); //NOTE - height = 0 initially
            this._hp = 1;
            this.widenness = widenness;
            this.visible = true;
            this.regeneration = regeneration; // || 0;//auto healing
            //@ts-ignore
            if (typeof Entities !== 'undefined') //client side
                //@ts-ignore
                Entities.addObject(Entities[ETITY_NAME].id, this);
        }
        destroy() {
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.removeObject(Entities[ETITY_NAME].id, this);
        }
        get hp() {
            return this._hp;
        }
        set hp(value) {
            this._hp = Math.min(1, Math.max(0, value));
            if (this.visible === true && this._hp !== 1)
                super.setScale(this.widenness * this._hp, SCALE);
            else
                super.setScale(0, 0);
        }
        setVisible(visible) {
            if (visible && this._hp !== 1)
                super.setScale(this.widenness * this._hp, SCALE);
            else
                super.setScale(0, 0);
            this.visible = visible;
        }
        update_hpbar(delta, x, y, height) {
            if (this._hp !== 1) {
                if (this.regeneration !== 0)
                    this.hp += this.regeneration * delta;
                if (this.visible === true)
                    super.setPos(x, y + height * HEIGHT_OFFSET);
            }
        }
    };
})();
try { //export for NodeJS
    module.exports = HpBar;
}
catch (e) { }
///<reference path="hp_bar.ts"/>
///<reference path="../common/sensor.ts"/>
///<reference path="../common/movement.ts"/>
////<reference path="object2d.ts"/>
const Enemy = (function ( /*Object2D, Movement, Sensor, HpBar*/) {
    try {
        var _Object2D_ = require('./object2d');
        var _Movement_ = require('./../common/movement');
        var _Sensor_ = require('./../common/sensor');
        var _HpBar_ = require('./hp_bar');
    }
    catch (e) {
        var _Object2D_ = Object2D;
        var _Movement_ = Movement;
        var _Sensor_ = Sensor;
        var _HpBar_ = HpBar;
    }
    const REGENERATION_SPEED = 0.025;
    //const ETITY_NAME = 'ENEMY_ROCKET';//ENEMY_ROCKET
    return class Enemy extends _Object2D_ {
        constructor(entity_name, sensor_shape, SCALE, MAX_SPEED) {
            super();
            this._spawning = false;
            super.setScale(0, 0);
            this.SCALE = SCALE;
            this.entity_name = entity_name;
            this.movement = new _Movement_();
            this.movement.setOptions({
                maxSpeed: MAX_SPEED,
            });
            // this._spawning = false;
            this.sensor = new _Sensor_(sensor_shape);
            this.hp_bar = new _HpBar_(SCALE, REGENERATION_SPEED); //needs destroying
            //@ts-ignore
            if (typeof Entities !== 'undefined') //client side
                //@ts-ignore
                Entities.addObject(Entities[entity_name].id, this);
        }
        destroy() {
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.removeObject(Entities[this.entity_name].id, this);
            this.hp_bar.destroy();
        }
        isAlive() {
            return this.hp_bar.hp >= 0.005 || super.expired === true;
        }
        get spawning() {
            return this._spawning;
        }
        set spawning(value) {
            this._spawning = value;
            this.hp_bar.setVisible(!value);
        }
        update(delta) {
            this.movement.applyMove(this, delta);
            super.update(delta);
            this.hp_bar.update(delta, this.x, this.y, this.height);
        }
    };
})();
try { //export for NodeJS
    module.exports = Enemy;
}
catch (e) { }
///<reference path="enemy.ts"/>
///<reference path="../common/sensor.ts"/>
//TODO - try reference renderer and emitter files
const RocketEnemy = (function (Enemy, Sensor) {
    const ETITY_NAME = 'ENEMY_ROCKET';
    const SCALE = 0.065, MAX_SPEED = 0.6;
    var renderer;
    return class RocketEnemy extends Enemy {
        constructor() {
            //let random_max_speed = (Math.random()*0.3 + 0.7) * MAX_SPEED;
            super(ETITY_NAME, Sensor.SHAPES.ROCKET, SCALE, MAX_SPEED);
            //@ts-ignore //client side
            if (typeof Renderer !== 'undefined' && typeof Emitters !== 'undefined') {
                //@ts-ignore
                this.emitter = Renderer.Class.addEmitter(new Emitters.Fussion());
                this.emitter.visible = false;
            }
        }
        destroy() {
            if (this.emitter)
                this.emitter.expired = true;
            super.destroy();
        }
        update(delta) {
            super.update(delta);
            //@ts-ignore
            if (this.emitter && (renderer = Renderer.Class.getCurrentInstance()) !== null) {
                if (this.spawning !== true) {
                    if (renderer.withinVisibleArea(this.x, this.y, 0.25) === true) {
                        this.emitter.visible = true;
                        this.emitter.update(delta, this.x, this.y, this.rot, this.width * 0.8);
                    }
                    else {
                        if (this.emitter.visible === true) {
                            this.emitter.setInitial(); //moves every emitter's particle away from view
                            this.emitter.visible = false;
                        }
                    }
                }
            }
        }
    };
})(typeof Enemy !== 'undefined' ? Enemy : require('./enemy'), typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor'));
try { //export for NodeJS
    module.exports = RocketEnemy;
}
catch (e) { }
///<reference path="object2d.ts"/>
///<reference path="enemy.ts"/>
///<reference path="../common/sensor.ts"/>
const PoisonousEnemy = (function (Enemy, Sensor) {
    const ETITY_NAME = 'ENEMY_POISONOUS';
    const SCALE = 0.1, MAX_SPEED = 0.3;
    const STAINS_FREQUENCY = 0.2, MAX_FAZE_DURATION = 5, MAX_GAP_DURATION = 20;
    return class PoisonousEnemy extends Enemy {
        constructor() {
            super(ETITY_NAME, Sensor.SHAPES.CIRCLE, SCALE, MAX_SPEED);
            this.on_stain_listener = null;
            this.time_to_next_stain = (Math.random() + 0.5) * STAINS_FREQUENCY;
            this.faze_duration = 0;
            this.gap_duration = MAX_FAZE_DURATION * Math.random();
        }
        destroy() {
            super.destroy();
        }
        onStain(on_stain_listener) {
            this.on_stain_listener = on_stain_listener;
        }
        update(delta) {
            super.update(delta);
            if (this.spawning !== true) {
                //if(!_CLIENT_) {//only server-side 
                if (typeof module !== 'undefined') {
                    if (this.gap_duration <= 0) {
                        if ((this.faze_duration -= delta) < 0) //end of faze
                            this.gap_duration = Math.random() * MAX_GAP_DURATION;
                        else {
                            if ((this.time_to_next_stain -= delta) <= 0) {
                                this.time_to_next_stain += STAINS_FREQUENCY;
                                if (this.on_stain_listener !== null)
                                    this.on_stain_listener(this);
                            }
                        }
                    }
                    else {
                        if ((this.gap_duration -= delta) <= 0) //end of gap
                            this.faze_duration = Math.random() * MAX_FAZE_DURATION;
                    }
                }
            }
        }
    };
})(typeof Enemy !== 'undefined' ? Enemy : require('./enemy'), typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor'));
try { //export for NodeJS
    module.exports = PoisonousEnemy;
}
catch (e) { }
///<reference path="../common/movement.ts"/>
///<reference path="enemy.ts"/>
const EnemySpawner = (function ( /*Object2D, Enemy, Movement*/) {
    try {
        var _Object2D_ = require('./object2d');
        //var _Enemy_: typeof Enemy = require('./enemy');
        var _Movement_ = require('./../common/movement');
    }
    catch (e) {
        var _Object2D_ = Object2D;
        //var _Enemy_ = Enemy;
        var _Movement_ = Movement;
    }
    const SCALE = 0.15, GROWING_TIME = 1, SHRINKING_TIME = 1, ENEMY_GROWING_TIME = 0.5, GAP_TIME = 2.0;
    const ETITY_NAME = 'ENEMY_SPAWNER', POISONOUS_ENTITY_NAME = 'POISONOUS_ENEMY_SPAWNER';
    return class EnemySpawner extends _Object2D_ {
        constructor(enemy) {
            super();
            this.timer = 0;
            this.state = 0;
            super.setScale(0, 0);
            super.setPos(enemy.x, enemy.y);
            enemy.spawning = true;
            enemy.setScale(0, 0); //invisible while spawning
            this.enemy = enemy;
            // this.state = 0;
            // this.timer = 0.0;
            //@ts-ignore
            if (typeof Entities !== 'undefined') {
                this.entity_name = enemy instanceof PoisonousEnemy ? POISONOUS_ENTITY_NAME : ETITY_NAME;
                //@ts-ignore
                Entities.addObject(Entities[this.entity_name].id, this);
            }
            //@ts-ignore
            if (typeof Renderer !== 'undefined' && typeof Emitters !== 'undefined') { //client side
                //@ts-ignore
                this.emitter = Renderer.Class.addEmitter(
                //@ts-ignore
                new Emitters.Spawner(enemy instanceof PoisonousEnemy));
            }
        }
        destroy() {
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.removeObject(Entities[this.entity_name].id, this);
            if (this.enemy) {
                this.enemy.spawning = false;
                this.enemy.movement.set(_Movement_.FLAGS.UP, true); //enemy moving forward
            }
            if (this.emitter)
                this.emitter.expired = true;
        }
        nextState(curr_state_duration) {
            this.state++;
            this.timer -= curr_state_duration;
        }
        update(delta) {
            this.timer += delta;
            switch (this.state) {
                case 0:
                    { //popping up ring bariere
                        var sc = SCALE * (this.timer / GROWING_TIME);
                        if (sc >= SCALE) {
                            sc = SCALE;
                            this.nextState(GROWING_TIME);
                        }
                        super.setScale(sc, sc);
                    }
                    break;
                case 1:
                    if (this.timer >= GAP_TIME)
                        this.nextState(GAP_TIME);
                    break;
                case 2:
                    { //popping up enemy
                        var sc2 = this.enemy.SCALE * (this.timer / ENEMY_GROWING_TIME);
                        if (sc2 >= this.enemy.SCALE) {
                            sc2 = this.enemy.SCALE;
                            this.nextState(ENEMY_GROWING_TIME);
                        }
                        this.enemy.setScale(sc2, sc2);
                    }
                    break;
                case 3:
                    { //shrinking bariere
                        var sc3 = SCALE * (1.0 - (this.timer / SHRINKING_TIME));
                        if (sc3 <= 0) {
                            sc3 = 0;
                            this.nextState(SHRINKING_TIME);
                            // this.enemy.spawning = false;
                            // this.enemy.movement.set( Movement.UP, true );//enemy moving forward
                        }
                        super.setScale(sc3, sc3);
                    }
                    break;
                case 4:
                    this.expired = true;
                    this.nextState(0);
                    break;
                default:
                    break;
            }
            super.update(delta);
            if (this.emitter)
                this.emitter.update(delta, this.x, this.y, this.state >= 3);
        }
        static get SCALE() {
            return SCALE;
        }
    };
})();
try { //export for NodeJS
    module.exports = EnemySpawner;
}
catch (e) { }
///<reference path="object2d.ts"/>
////<reference path="../../../client/game/entities.ts"/>
const Item = (function () {
    try {
        var _Object2D_ = require('./object2d');
    }
    catch (e) {
        var _Object2D_ = Object2D;
    }
    let TYPES;
    (function (TYPES) {
        TYPES[TYPES["HEALTH"] = 0] = "HEALTH";
        TYPES[TYPES["SPEED"] = 1] = "SPEED";
        TYPES[TYPES["ENERGY"] = 2] = "ENERGY";
    })(TYPES || (TYPES = {}));
    //NOTE - sum of this array must be equal to 1 and it must be sorted with ascending order
    const PROBABILITIES = [0.1, 0.2, 0.7];
    const SCALE = 0.075;
    //lifetime in seconds
    const SPAWN_DURATION = 1, LIFETIME = 15, BLINKING_TIME = 2.5, SHRINKING_SPEED = 0.2;
    var sc = 0;
    return class Item extends _Object2D_ {
        constructor(_type) {
            super();
            this.blink_percent = 0;
            this.timer = 0;
            super.setScale(0, 0);
            this.type = _type;
            // this.blink_percent = 0;
            // this.timer = 0;
            //@ts-ignore
            if (typeof Entities !== 'undefined') {
                this.entity_name = Item.entityName(_type); //clientside only
                //@ts-ignore
                Entities.addObject(Entities[this.entity_name].id, this);
            }
        }
        destroy() {
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.removeObject(Entities[this.entity_name].id, this);
        }
        update(delta) {
            this.timer += delta;
            if (this.timer < SPAWN_DURATION) {
                sc = this.timer / SPAWN_DURATION * SCALE;
                super.setScale(sc, sc);
            }
            else if (this.timer < SPAWN_DURATION + LIFETIME) {
                super.setScale(SCALE, SCALE);
            }
            else if (this.timer < SPAWN_DURATION + LIFETIME + BLINKING_TIME) {
                this.blink_percent += Math.min(0.1, delta) * 2.5; //blinking speed
                if (this.blink_percent > 1)
                    this.blink_percent -= 2.0;
                //sc = SCALE-Utils::bezier_curve(ABS(blink_percent), Utils::EASE_IN_OUT)*0.0125f;
                sc = SCALE - (Math.pow(Math.abs(this.blink_percent), 2)) * 0.0125;
                super.setScale(sc, sc);
            }
            else {
                //sc = this.width - SHRINKING_SPEED*delta;
                sc = SCALE * (1.0 -
                    ((this.timer - (SPAWN_DURATION + LIFETIME + BLINKING_TIME)) / SHRINKING_SPEED));
                if (sc <= 0) {
                    sc = 0;
                    this.expired = true;
                }
                super.setScale(sc, sc);
            }
            super.update(delta);
        }
        static randomType() {
            let random_value = Math.random(); //[0, 1]
            let prop_sum = 0;
            for (var i = 0; i < PROBABILITIES.length; i++) {
                if (random_value < PROBABILITIES[i] + prop_sum)
                    return i;
                prop_sum += PROBABILITIES[i];
            }
            throw new Error('Cannot get random index from PROBABILITIES');
            //return (Math.random() * Object.values(TYPES).length) | 0;
        }
        static get TYPES() {
            return TYPES;
        }
        static entityName(type) {
            switch (type) {
                default: throw new Error('Incorrect Item type');
                case TYPES.HEALTH: return 'HEALTH_ITEM';
                case TYPES.ENERGY: return 'ENERGY_ITEM';
                case TYPES.SPEED: return 'SPEED_ITEM';
            }
        }
        static get HEALTH_VALUE() {
            return 0.25;
        }
        static get ENERGY_VALUE() {
            return 0.2;
        }
    };
})();
try { //export for NodeJS
    module.exports = Item;
}
catch (e) { }
///<reference path="../objects/object2d.ts"/>
///<reference path="../common/colors.ts"/>
///<reference path="../common/sensor.ts"/>
////<reference path="../../../client/game/entities.ts"/>
///<reference path="../common/painter.ts"/>
///<reference path="player.ts"/>
const Bullet = (function () {
    try {
        var _Object2D_ = require('./object2d');
        var _Sensor_ = require('./../common/sensor');
        //var _Player_: typeof Player = require('./player');
    }
    catch (e) {
        var _Object2D_ = Object2D;
        var _Sensor_ = Sensor;
        //var _Player_ = Player;
    }
    const SCALE = 0.02, DEFAULT_SPEED = 1.0, MAXIMUM_LIFETIME = 20;
    const H_PI = Math.PI / 2;
    const fixAngle = (a) => -a + H_PI;
    return class Bullet extends _Object2D_ {
        //NOTE - parent must constains a Painter instance as 'painter' property name
        //@parent - instance that 'owns' this bullet
        constructor(x, y, rot, parent, is_bouncing = false) {
            super();
            super.setScale(SCALE, SCALE);
            super.setPos(x, y);
            super.setRot(rot);
            this.bouncing = is_bouncing; // || false;
            //this.color = color;//color works as a player signature
            this.parent = parent;
            this.lifetime = MAXIMUM_LIFETIME;
            this.speed = DEFAULT_SPEED;
            this.sensor = new _Sensor_(_Sensor_.SHAPES.BULLET);
            //@ts-ignore
            if (typeof Entities !== 'undefined') {
                // console.log('new bullet', Bullet.entityName(color));
                //@ts-ignore
                this.entity_name = Bullet.entityName(parent.painter.color); //clientside only
                //@ts-ignore
                Entities.addObject(Entities[this.entity_name].id, this);
            }
        }
        destroy() {
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.removeObject(Entities[this.entity_name].id, this);
        }
        get color() {
            //@ts-ignore
            return this.parent.painter.color;
        }
        update(delta) {
            if ((this.lifetime -= delta) <= 0)
                this.expired = true;
            super.move(Math.cos(fixAngle(this.rot)) * delta * this.speed, Math.sin(fixAngle(this.rot)) * delta * this.speed);
            super.update(delta);
        }
        static entityName(color) {
            return 'BULLET_' + Colors.PLAYERS_COLORS.indexOf(color);
        }
    };
})();
try { //export for NodeJS
    module.exports = Bullet;
}
catch (e) { }
///<reference path="object2d.ts"/>
///<reference path="../common/colors.ts"/>
///<reference path="player.ts"/>
////<reference path="../../../client/game/entities.ts"/>
var Shield = (function () {
    // try {
    // 	//@ts-ignore
    // 	if(typeof Object2DSmooth === 'undefined') {
    // 		var Object2DSmooth: Object2DSmooth = require('./object2d_smooth');
    // 	}
    // }
    // catch(e) {}
    try {
        var _Object2D_ = require('./object2d');
    }
    catch (e) {
        var _Object2D_ = Object2D;
    }
    const SCALE_FACTOR = 1.9;
    const GROWING_TIME = 0.4, SHRINKING_TIME = 2.0;
    var sc;
    //@ts-ignore
    return class Shield extends _Object2D_ {
        constructor(player_handle, duration) {
            super();
            this.timer = 0;
            super.setScale(0, 0);
            super.setPos(player_handle.x, player_handle.y /*, true*/); //do not smooth initial position
            this.player_handle = player_handle;
            //@ts-ignore
            this.color = player_handle.painter.color; //color works as a player signature
            this.target_scale = player_handle.width * SCALE_FACTOR;
            this.duration = duration;
            //this.timer = 0;
            //@ts-ignore
            if (typeof Entities !== 'undefined') {
                this.entity_name = Shield.entityName(this.color); //clientside only
                //@ts-ignore
                Entities.addObject(Entities[this.entity_name].id, this);
            }
        }
        destroy() {
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.removeObject(Entities[this.entity_name].id, this);
        }
        update(delta) {
            if ((this.timer += delta) >= this.duration)
                this.expired = true;
            if (this.timer <= GROWING_TIME)
                sc = this.timer / GROWING_TIME * this.target_scale;
            else if (this.duration - this.timer < SHRINKING_TIME)
                sc = Math.pow((this.duration - this.timer) / SHRINKING_TIME, 0.125) * this.target_scale;
            else
                sc = this.target_scale;
            super.setScale(sc, sc);
            super.setPos(this.player_handle.x, this.player_handle.y);
            super.update(delta);
        }
        static entityName(color) {
            // return 'SHIELD_' + Object.values(Colors.PLAYERS_COLORS).indexOf(color);
            //return 'SHIELD_' + Object.keys(Colors.PLAYERS_COLORS)
            //	.map(key => Colors.PLAYERS_COLORS[key]).indexOf(color);
            return 'SHIELD_' + Colors.PLAYERS_COLORS.indexOf(color);
        }
    };
})();
// var Shield = ShieldScope.Shield;
try { //export for NodeJS
    module.exports = Shield;
}
catch (e) { }
///<reference path="object2d.ts"/>
const Immunity = (function () {
    try {
        var _Object2D_ = require('./object2d');
    }
    catch (e) {
        var _Object2D_ = Object2D;
    }
    const SCALE_FACTOR = 1.5;
    const GROWING_TIME = 0.4, SHRINKING_TIME = 2.0;
    const ENTITY_NAME = 'IMMUNITY_AUREOLE';
    var sc;
    return class Immunity extends /*Object2DSmooth*/ _Object2D_ {
        constructor(player_handle, duration) {
            super();
            super.setScale(0, 0);
            super.setPos(player_handle.x, player_handle.y /*, true*/); //do not smooth initial position
            this.player_handle = player_handle;
            this.target_scale = player_handle.width * SCALE_FACTOR;
            this.duration = duration;
            this.timer = 0;
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.addObject(Entities[ENTITY_NAME].id, this);
        }
        destroy() {
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.removeObject(Entities[ENTITY_NAME].id, this);
        }
        update(delta) {
            if ((this.timer += delta) >= this.duration)
                this.expired = true;
            if (this.timer <= GROWING_TIME)
                sc = this.timer / GROWING_TIME * this.target_scale;
            else if (this.duration - this.timer < SHRINKING_TIME)
                sc = Math.pow((this.duration - this.timer) / SHRINKING_TIME, 0.125) * this.target_scale;
            else
                sc = this.target_scale;
            super.setScale(sc, sc);
            super.setPos(this.player_handle.x, this.player_handle.y);
            super.update(delta);
        }
    };
})();
try { //export for NodeJS
    module.exports = Immunity;
}
catch (e) { }
///<reference path="../objects/object2d.ts"/>
///<reference path="../common/colors.ts"/>
////<reference path="../../../client/game/entities.ts"/>
const Bomb = (function () {
    try {
        var _Object2D_ = require('./object2d');
    }
    catch (e) {
        var _Object2D_ = Object2D;
    }
    const SCALE = 0.075, GROW_SCALE = 0.075, SHAKING_RADIUS = 0.02;
    const DELAY_TIME = 2, SHAKING_TIME = 2;
    var shake_factor, rand_a, sc;
    return class Bomb extends _Object2D_ {
        //NOTE - parent must constains a Painter instance as 'painter' property name
        //@parent - instance that 'owns' this bullet
        constructor(x, y, parent) {
            super();
            super.setPos(x, y);
            super.setScale(SCALE, SCALE);
            //this.color = color;//color works as a player signature
            this.parent = parent;
            this.initial_x = x;
            this.initial_y = y;
            this.timer = 0;
            //@ts-ignore
            if (typeof Entities !== 'undefined') {
                //@ts-ignore
                this.entity_name = Bomb.entityName(parent.painter.color); //clientside only
                //@ts-ignore
                Entities.addObject(Entities[this.entity_name].id, this);
            }
        }
        destroy() {
            //@ts-ignore
            if (typeof Entities !== 'undefined')
                //@ts-ignore
                Entities.removeObject(Entities[this.entity_name].id, this);
        }
        update(delta) {
            if ((this.timer += delta) >= DELAY_TIME + SHAKING_TIME) {
                this.expired = true;
                return;
            }
            if (this.timer > DELAY_TIME) {
                shake_factor = (this.timer - DELAY_TIME) / SHAKING_TIME;
                rand_a = Math.random() * Math.PI * 2.0;
                super.setPos(this.initial_x + Math.cos(rand_a) * SHAKING_RADIUS * shake_factor, this.initial_y + Math.sin(rand_a) * SHAKING_RADIUS * shake_factor);
                super.setRot((Math.random() * 2.0 - 1.0) * Math.PI * shake_factor * 0.25);
                sc = SCALE + GROW_SCALE * Math.pow(shake_factor, 4);
                super.setScale(sc, sc);
            }
        }
        static entityName(color) {
            return 'BOMB_' + Colors.PLAYERS_COLORS.indexOf(color);
            //return 'BOMB';
        }
    };
})();
try { //export for NodeJS
    module.exports = Bomb;
}
catch (e) { }
///<reference path="paint_layer.ts"/>
///<reference path="objects/player.ts"/>
///<reference path="objects/enemy.ts"/>
///<reference path="objects/rocket_enemy.ts"/>
///<reference path="objects/poisonous_enemy.ts"/>
///<reference path="objects/enemy_spawner.ts"/>
///<reference path="objects/item.ts"/>
///<reference path="objects/bullet.ts"/>
///<reference path="objects/shield.ts"/>
///<reference path="objects/immunity.ts"/>
///<reference path="objects/bomb.ts"/>
// const GameMap = (function(/*PaintLayer, Vector, Object2D*/) {
var GameMap;
///<reference path="paint_layer.ts"/>
///<reference path="objects/player.ts"/>
///<reference path="objects/enemy.ts"/>
///<reference path="objects/rocket_enemy.ts"/>
///<reference path="objects/poisonous_enemy.ts"/>
///<reference path="objects/enemy_spawner.ts"/>
///<reference path="objects/item.ts"/>
///<reference path="objects/bullet.ts"/>
///<reference path="objects/shield.ts"/>
///<reference path="objects/immunity.ts"/>
///<reference path="objects/bomb.ts"/>
// const GameMap = (function(/*PaintLayer, Vector, Object2D*/) {
(function (GameMap) {
    try {
        var _PaintLayer_ = require('./paint_layer');
        var _Vector_ = require('./../utils/vector');
        var _Object2D_ = require('./../game/objects/object2d');
    }
    catch (e) {
        var _Object2D_ = Object2D;
        var _Vector_ = Vector;
        var _PaintLayer_ = PaintLayer;
    }
    //const MAP_FOLDER = 'play/res/maps';
    const DEFAULT_WALLS_SIZE = 0.08;
    //helper variables
    var ui, obji, temp_arr;
    class Map extends _PaintLayer_.Layer {
        constructor() {
            super();
            // public players: (typeof Player)[] = [];
            // public enemies: (typeof Enemy)[] = [];
            // public enemy_spawners: (typeof EnemySpawner)[] = [];
            // public items: (typeof Item)[] = [];
            // public bullets: (typeof Bullet)[] = [];
            // public shields: (typeof Shield)[] = [];
            // public immunities: (typeof Immunity)[] = [];
            // public bombs: (typeof Bomb)[] = [];
            this.players = [];
            this.enemies = [];
            this.enemy_spawners = [];
            this.items = [];
            this.bullets = [];
            this.shields = [];
            this.immunities = [];
            this.bombs = [];
            this.background = new _Vector_.Vec3f(1, 1, 1);
            this.updatables = [
                this.players, this.enemies,
                this.enemy_spawners, this.items,
                this.bullets, this.shields,
                this.immunities, this.bombs
            ];
            //server-side use for constantly sending object updates each few frames
            //clientside use for receiving and applying updates
            this.server_synchronized = [this.enemies];
        }
        destroy() {
            super.destroy();
            //this.players.length = 0;
        }
        update(delta) {
            //updating updatables
            for (ui = 0; ui < this.updatables.length; ui++) {
                temp_arr = this.updatables[ui];
                for (obji = 0; obji < temp_arr.length; obji++) {
                    if (temp_arr[obji].expired === true) {
                        temp_arr[obji].destroy();
                        temp_arr.splice(obji, 1);
                        obji--;
                    }
                    else {
                        temp_arr[obji].update(delta);
                        temp_arr[obji].timestamp = 0;
                    }
                }
            }
        }
        updateTimestamps(delta) {
            var timestamp = Date.now();
            for (ui = 0; ui < this.updatables.length; ui++) {
                temp_arr = this.updatables[ui];
                for (obji = 0; obji < temp_arr.length; obji++) {
                    if (temp_arr[obji].expired === true) {
                        temp_arr[obji].destroy();
                        temp_arr.splice(obji, 1);
                        obji--;
                    }
                    else if (temp_arr[obji].timestamp !== 0) {
                        //console.log( (timestamp - temp_arr[obji].timestamp) / 1000.0 );
                        temp_arr[obji].update((timestamp - temp_arr[obji].timestamp) / 1000.0);
                        temp_arr[obji].timestamp = 0;
                    }
                    else //object timestamp === 0
                        temp_arr[obji].update(delta);
                }
            }
        }
        loadMap(map) {
            try {
                console.log('(' + map.name + ') map data:', map.data);
                if (map.data === null)
                    throw "No map data";
                super.size = map.data['size'] || 5; //default
                if (map.data['background_color'])
                    this.background.set(...map.data['background_color'].map(v => v / 256));
                super.generateChunks();
                super.paintMapWalls(map);
                super.drawWalls(DEFAULT_WALLS_SIZE); //TODO - make it modifable from map file
                //placing entities
                Object.keys(map.data.entities).forEach(key => {
                    //@ts-ignore
                    map.data.entities[key].forEach(obj_data => {
                        var obj = new _Object2D_().setPos(obj_data.x || 0, obj_data.y || 0)
                            .setScale(obj_data.scale || 1, obj_data.scale || 1)
                            .setRot(obj_data.rot || 0);
                        //@ts-ignore
                        if (typeof Entities !== 'undefined') {
                            //@ts-ignore
                            Entities.addObject(Entities[key].id, obj);
                        }
                    });
                });
                return true;
            }
            catch (e) {
                console.error(e);
                //onLoad(false);
                return false;
            }
        }
    }
    GameMap.Map = Map;
    ;
})(GameMap || (GameMap = {})); //)();
try { //export for NodeJS
    module.exports = GameMap;
}
catch (e) { }
/* directed towards performance calculations */
///<reference path="../utils/vector.ts"/>
///<reference path="../room_info.ts"/>
///<reference path="objects/object2d.ts"/>
const CollisionDetector = (function () {
    try {
        var _Vector_ = require('./../utils/vector');
        var _RoomInfo_ = require('./../room_info');
    }
    catch (e) {
        var _Vector_ = Vector;
        var _RoomInfo_ = RoomInfo;
    }
    const abstractFunc_painter = function (object, pixel_buffer) { };
    const abstractFunc_object_to_object = function (arg1, arg2) { };
    const PUSH_STEPS = 4;
    var cm_i;
    const colorsMatch = (c1, c2) => {
        for (cm_i = 0; cm_i < 4; cm_i++) {
            if (c1[cm_i] != c2[cm_i])
                return false;
        }
        return true;
    };
    const randRange = (min, max) => min + Math.random() * (max - min);
    const pow2 = (a) => a * a;
    //const distanceSqrt = (p1x, p1y, p2x, p2y) => 5;
    //collision detecting variables
    var p_i, e_i, b_i, i_i, es_i, coords, c_i, s, c, xx, yy, pixel_buffer = new Uint8Array(4);
    //random spot finding variables
    var find_trials, up_i, obj_i, obj_it, temp_arr, overlap_ray_steps, overlap_ray_color = new Uint8Array(4), o_rr, o_angle, o_a_s, o_dx, o_dy, o_r_s;
    const OVERLAP_ANGLE_STEPS = 16;
    const OVERLAP_ANGLE_SHIFT = Math.PI * 2.0 / OVERLAP_ANGLE_STEPS;
    //bouncing variables
    var current_vec = new _Vector_.Vec2f(), bounce_vec = new _Vector_.Vec2f(), dot, ray_color = new Uint8Array(4), b_radius, b_angle, found, safety, b_product, r_i, ray_steps, r_s, rr, b_dx, b_dy;
    const RAYS = 32;
    const ANGLE_SHIFT = Math.PI * 2.0 / RAYS;
    const COLLISION_PUSH_FACTOR = 0.01; //0.01
    function getBounceVec(object, color, map, out_vec) {
        //vec4b ray_color;
        b_radius = object.width;
        //every nth pixel
        ray_steps = 3; //((PaintLayer.CHUNK_RES * b_radius / PaintLayer.CHUNK_SIZE) / 3) | 0;
        b_angle = 0;
        found = false;
        for (r_i = 0; r_i < RAYS; r_i++) {
            //console.log("ray steps:", ray_steps);
            for (r_s = ray_steps; r_s > 0; r_s--) {
                rr = b_radius * (r_s / ray_steps);
                b_dx = Math.cos(b_angle) * rr;
                b_dy = Math.sin(b_angle) * rr;
                map.getPixelColor(object.x + b_dx, object.y + b_dy, ray_color);
                if (colorsMatch(ray_color, color)) {
                    if (out_vec !== null) {
                        out_vec.x -= b_dx;
                        out_vec.y -= b_dy;
                    }
                    /*if(true) {
                        map.color = "#fff";
                        map.drawLine(object.x, object.y,
                            object.x + b_dx, object.y + b_dy, 0.002);
                    }*/
                    found = true;
                    break;
                }
            }
            b_angle += ANGLE_SHIFT;
        }
        return found;
    }
    function bounceOutOfColor(object, color, map, out_bounce_vec) {
        bounce_vec.set(0, 0);
        if (getBounceVec(object, color, map, bounce_vec) === false) //no collision detected
            return false;
        bounce_vec.normalize();
        if (out_bounce_vec != null)
            out_bounce_vec.set(bounce_vec.x, bounce_vec.y);
        //pushing object out of collision area
        safety = PUSH_STEPS; //16
        do {
            object.setPos(object.x + bounce_vec.x * COLLISION_PUSH_FACTOR, object.y + bounce_vec.y * COLLISION_PUSH_FACTOR);
        } while (getBounceVec(object, color, map, null) && --safety > 0);
        //no need to normalize
        current_vec.set(Math.cos(-object.rot + Math.PI / 2.0), Math.sin(-object.rot + Math.PI / 2.0));
        /*if(true) {//test
            map.color = "#0f0";
            map.drawLine(object.x, object.y,
                object.x + bounce_vec.x, object.y + bounce_vec.y, 0.003);

            map.color = "#ff0";
            map.drawLine(object.x, object.y,
                object.x - current_vec.x, object.y - current_vec.y, 0.003);
        }*/
        b_product = current_vec.dot(bounce_vec);
        if (b_product > 0.0)
            return true; /*NOTE - changed from false*/
        //bounce_vec = current_vec - (bounce_vec * b_product * 2.0);
        bounce_vec.x = current_vec.x - (bounce_vec.x * b_product * 2.0);
        bounce_vec.y = current_vec.y - (bounce_vec.y * b_product * 2.0);
        object.rot = -Math.atan2(bounce_vec.y, bounce_vec.x) + Math.PI / 2.0;
        // object.rot = Math.atan2( bounce_vec.y, bounce_vec.x );
        /*if(true) {
            bounce_vec.normalize();
            map.color = "#000";
            map.drawLine(object.x, object.y,
                object.x + bounce_vec.x, object.y + bounce_vec.y, 0.003);
        }*/
        return true;
    }
    //bounces obj1 from obj2 (circle interpolation)
    function bounceOneObjectFromAnother(obj1, obj2) {
        current_vec.set(Math.cos(-obj1.rot + Math.PI / 2.0), Math.sin(-obj1.rot + Math.PI / 2.0)).normalize();
        bounce_vec.set(obj1.x - obj2.x, obj1.y - obj2.y).normalize();
        safety = 16;
        do {
            obj1.setPos(obj1.x + bounce_vec.x * COLLISION_PUSH_FACTOR, obj1.y + bounce_vec.y * COLLISION_PUSH_FACTOR);
        } while (twoObjectsIntersect(obj1, obj2) && --safety > 0);
        dot = current_vec.dot(bounce_vec);
        if (dot > 0.0)
            return true;
        bounce_vec.x = current_vec.x - (bounce_vec.x * dot * 2.0);
        bounce_vec.y = current_vec.y - (bounce_vec.y * dot * 2.0);
        obj1.rot = -Math.atan2(bounce_vec.y, bounce_vec.x) + Math.PI / 2.0;
        return false;
    }
    //just for searching random empty spot
    function objectOverlap(map, in_vec, _radius) {
        //assumption - the object radius is its width
        for (up_i = 0; up_i < map.updatables.length; up_i++) {
            temp_arr = map.updatables[up_i];
            for (obj_i = 0; obj_i < temp_arr.length; obj_i++) {
                obj_it = temp_arr[obj_i];
                if (_Vector_.distanceSqrt(in_vec, obj_it) <= pow2(obj_it.width + _radius))
                    return true;
            }
        }
        return false;
    }
    function paintOverlap(map, in_vec, _radius) {
        overlap_ray_steps = _radius / 0.015; //2;
        for (o_r_s = overlap_ray_steps; o_r_s > 0; o_r_s--) {
            o_rr = _radius * (o_r_s / overlap_ray_steps);
            o_angle = 0;
            for (o_a_s = 0; o_a_s < OVERLAP_ANGLE_STEPS; o_a_s++) {
                o_dx = Math.cos(o_angle) * o_rr;
                o_dy = Math.sin(o_angle) * o_rr;
                //ChunkedCanvas::getPixelColor(in_vec.x() + dx, in_vec.y() + dy, overlap_ray_color);
                map.getPixelColor(in_vec.x + o_dx, in_vec.y + o_dy, overlap_ray_color);
                if (overlap_ray_color[3] > 0) //pixel is not invisible => overlap
                    return true;
                o_angle += OVERLAP_ANGLE_SHIFT;
            }
        }
        return false;
    }
    const twoObjectsIntersect = (obj1, obj2) => _Vector_.distanceSqrt(obj1, obj2) <= pow2(obj1.width + obj2.width);
    return {
        detectCollisions: function (map, gamemode) {
            for (p_i = 0; p_i < map.players.length; p_i++) { //for each player
                //player to painter collision
                this.detectSensorToPainterCollision(map, map.players[p_i], this.onPlayerPainterCollision);
                //player to enemy collision
                for (e_i = 0; e_i < map.enemies.length; e_i++) {
                    if (twoObjectsIntersect(map.players[p_i], map.enemies[e_i]) === true)
                        this.onPlayerEnemyCollision(map.players[p_i], map.enemies[e_i]);
                }
                //player to enemy spawner collision
                for (es_i = 0; es_i < map.enemy_spawners.length; es_i++) {
                    if (twoObjectsIntersect(map.players[p_i], map.enemy_spawners[es_i]) === true)
                        this.onPlayerEnemySpawnerCollision(map.players[p_i], map.enemy_spawners[es_i]);
                }
                //player to item collision
                for (i_i = 0; i_i < map.items.length; i_i++) {
                    if (twoObjectsIntersect(map.players[p_i], map.items[i_i]) === true)
                        this.onPlayerItemCollision(map.players[p_i], map.items[i_i]);
                }
                //player to bullet collision (only competition mode)
                if (gamemode === _RoomInfo_.MODES.COMPETITION) {
                    for (b_i = 0; b_i < map.bullets.length; b_i++) {
                        if (twoObjectsIntersect(map.players[p_i], map.bullets[b_i]) === true)
                            this.onPlayerBulletCollision(map.players[p_i], map.bullets[b_i]);
                    }
                }
            }
            for (e_i = 0; e_i < map.enemies.length; e_i++) { //for each enemy
                //enemy to painter collision
                this.detectSensorToPainterCollision(map, map.enemies[e_i], this.onEnemyPainterCollision);
                if (map.enemies[e_i].spawning === false) { //only spawned enemies
                    //enemy to enemy spawner collision
                    for (es_i = 0; es_i < map.enemy_spawners.length; es_i++) {
                        if (twoObjectsIntersect(map.enemies[e_i], map.enemy_spawners[es_i]) === true)
                            this.onEnemyEnemySpawnerCollision(map.enemies[e_i], map.enemy_spawners[es_i]);
                    }
                    //enemy to bullet collision
                    for (b_i = 0; b_i < map.bullets.length; b_i++) {
                        if (twoObjectsIntersect(map.enemies[e_i], map.bullets[b_i]) === true)
                            this.onEnemyBulletCollision(map.enemies[e_i], map.bullets[b_i]);
                    }
                }
            }
            //bullet to painter collision, NOTE - should be after testing collisions with objects
            for (b_i = 0; b_i < map.bullets.length; b_i++) { //for each bullet
                this.detectSensorToPainterCollision(map, map.bullets[b_i], this.onBulletPainterCollision);
            }
        },
        detectSensorToPainterCollision: function (map, object, onCollide) {
            //@ts-ignore
            if (object.sensor === undefined)
                console.log(object);
            //@ts-ignore
            coords = object.sensor.shape;
            for (c_i = 0; c_i < coords.length; c_i++) {
                s = Math.sin(-object.rot);
                c = Math.cos(-object.rot);
                xx = (coords[c_i][0] * c - coords[c_i][1] * s) * object.width + object.x;
                yy = (coords[c_i][0] * s + coords[c_i][1] * c) * object.height + object.y;
                map.getPixelColor(xx, yy, pixel_buffer);
                if (pixel_buffer[3] === 255) {
                    //this.onPlayerPainterCollision(object, pixel_buffer);
                    onCollide.call(this, object, pixel_buffer);
                }
            }
        },
        //TODO - try GameMap type
        findRandomEmptySpot: function (map, _radius, out_vec) {
            find_trials = 0;
            const sc = map.map_size;
            const wall_margin = map.walls_thickness * 2.0 + _radius;
            while (find_trials++ < 16) { //maximum trials for perfomance matter
                out_vec.set(randRange(-sc, sc), randRange(-sc, sc));
                if ( /*distanceSqrt(out_vec.x(), out_vec.y(), 0, 0) //TODO - check distance to safe area
                    > pow2f(SAFE_AREA_RADIUS+_radius)
                    &&*/out_vec.x > -sc + wall_margin && out_vec.x < sc - wall_margin &&
                    out_vec.y > -sc + wall_margin && out_vec.y < sc - wall_margin &&
                    objectOverlap(map, out_vec, _radius) === false &&
                    paintOverlap(map, out_vec, _radius) === false)
                    return true;
            }
            return false;
        },
        bounceOneObjectFromAnother: bounceOneObjectFromAnother,
        //@color - Uint8Array buffer (color to bounce of), @out_bounce_vec - Vec2f
        bounceOutOfColor: bounceOutOfColor,
        //abstract functions
        onPlayerPainterCollision: abstractFunc_painter,
        onEnemyPainterCollision: abstractFunc_painter,
        onBulletPainterCollision: abstractFunc_painter,
        onPlayerItemCollision: abstractFunc_object_to_object,
        onPlayerEnemyCollision: abstractFunc_object_to_object,
        onPlayerEnemySpawnerCollision: abstractFunc_object_to_object,
        onPlayerBulletCollision: abstractFunc_object_to_object,
        onEnemyEnemySpawnerCollision: abstractFunc_object_to_object,
        onEnemyBulletCollision: abstractFunc_object_to_object
    };
})(
//typeof Vector !== 'undefined' ? Vector : require('./../utils/vector'),
//typeof RoomInfo !== 'undefined' ? RoomInfo : require('./../room_info')
);
try { //export for NodeJS
    module.exports = CollisionDetector;
}
catch (e) { }
///<reference path="game_map.ts"/>
///<reference path="collision_detector.ts"/>
///<reference path="common/colors.ts"/>
////<reference path="objects/player.ts"/>
////<reference path="objects/enemy.ts"/>
////<reference path="objects/rocket_enemy.ts"/>
////<reference path="objects/poisonous_enemy.ts"/>
////<reference path="objects/enemy_spawner.ts"/>
///<reference path="objects/item.ts"/>
const GameCore = (function ( /*GameMap, CollisionDetector, Colors, Player,
    RocketEnemy, PoisonousEnemy, EnemySpawner, Vector, Item*/) {
    try {
        var _GameMap_ = require('./game_map');
        var _CollisionDetector_ = require('./collision_detector');
        var _Colors_ = require('./common/colors');
        var _Player_ = require('./objects/player');
        var _RocketEnemy_ = require('./objects/rocket_enemy');
        var _PoisonousEnemy_ = require('./objects/poisonous_enemy');
        var _EnemySpawner_ = require('./objects/enemy_spawner');
        //var _Enemy_: typeof Enemy = require('./objects/enemy');
        var _Vector_ = require('./../utils/vector');
        var _Item_ = require('./objects/item');
    }
    catch (e) {
        var _GameMap_ = GameMap;
        var _CollisionDetector_ = CollisionDetector;
        var _Colors_ = Colors;
        var _Player_ = Player;
        var _RocketEnemy_ = RocketEnemy;
        var _PoisonousEnemy_ = PoisonousEnemy;
        var _EnemySpawner_ = EnemySpawner;
        //var _Enemy_ = Enemy;
        var _Vector_ = Vector;
        var _Item_ = Item;
    }
    const PARAMS = {
        spawn_radius: 0.33,
        spawn_offset: 0.266,
        spawn_walls_thickness: 0.08,
        death_mark_size: 0.04,
        //damages
        enemy_to_bullet_receptivity: 0.2,
        enemy_to_bouncing_bullet_receptivity: 0.45,
        player_to_bullet_receptivity: 0.2,
        player_to_bouncing_bullet_receptivity: 0.45,
        energy_blast_damage: 0.6,
        enemy_collision_damage: 0.2,
        enemy_painter_collision_damage: 0.2,
        //effects parameters
        explosion_radius: 0.5,
        small_explosion_radius: 0.3,
        bullet_explosion_radius: 0.066,
        bomb_explosion_radius: 0.75,
        energy_blast_radius: 0.5,
        //points
        points_for_enemy_damage: 50,
        points_for_player_damage: 500,
        points_for_enemy_kill: 100,
        points_for_player_kill: 1000,
        //points_for_enemy_hit: 25,//deprecated
        points_lose_for_enemy_collision: 100,
        points_lose_for_enemy_painter_collision: 200,
        //others
        instant_heal_value: 0.3,
        stain_shrink: 0.825
    };
    const STAINS = [[[-0.07, -0.23, 0.57], [0.18, 0.46, 0.53], [0.26, 0.08, 0.85], [0.07, 0.18, 0.68], [-0.44, 0.18, 0.58], [-0.11, -0.5, 0.88]], [[0.16, -0.07, 0.9], [0.01, 0.04, 0.77], [0.05, -0.21, 0.83], [-0.05, -0.38, 0.53], [-0.46, 0.18, 0.98], [0.1, -0.08, 0.79]], [[0.05, 0.46, 0.88], [0.46, -0.3, 0.57], [-0.37, -0.17, 0.91], [-0.06, -0.29, 0.64], [0.18, -0.4, 0.87], [0.14, -0.16, 0.61]], [[0.26, 0.15, 0.79], [-0.12, 0.43, 0.67], [0.06, -0.38, 0.84], [0.18, 0.48, 0.57], [-0.16, 0.02, 0.83], [-0.5, 0.13, 0.68]], [[-0.02, 0.25, 0.79], [-0.04, -0.16, 0.86], [-0.07, -0.18, 0.88], [-0.05, 0.14, 0.74], [0.07, -0.21, 0.66], [0.37, -0.24, 0.82]], [[0.34, 0.13, 0.73], [0.39, -0.03, 0.55], [0.22, -0.21, 0.65], [-0.22, 0.24, 0.88], [-0.38, 0.42, 0.97], [0.45, -0.49, 0.62]], [[-0.12, 0.1, 0.68], [0.26, 0.32, 0.65], [0.41, -0.14, 0.64], [0.48, 0.44, 0.61], [-0.43, -0.06, 0.92], [-0.21, 0.12, 0.93]], [[-0.3, 0.32, 0.79], [-0.42, -0.09, 0.59], [0.05, 0.46, 0.54], [0.15, 0.42, 0.69], [-0.17, 0.08, 0.85], [0.12, 0, 0.74]], [[0.48, -0.03, 0.89], [0.1, 0.06, 0.71], [0.09, 0.44, 0.93], [-0.42, 0.06, 0.61], [0.21, -0.38, 0.9], [-0.35, -0.04, 0.51]], [[-0.11, 0.25, 0.96], [0.09, 0.49, 0.5], [0.27, 0.33, 0.84], [-0.24, 0.36, 0.77], [0.17, -0.2, 0.92], [-0.14, -0.22, 0.89]], [[0.4, -0.05, 0.9], [0.33, 0.44, 0.93], [-0.46, 0.23, 0.63], [0.12, -0.36, 0.72], [0.11, 0.35, 0.97], [0.2, -0.11, 0.8]], [[0.38, 0.42, 0.54], [0.02, 0.03, 0.9], [0.42, 0.12, 0.92], [-0.42, -0.39, 0.96], [0.42, 0.38, 0.68], [0.26, -0.33, 0.82]], [[-0.11, 0.44, 0.84], [-0.03, 0.01, 0.57], [0.21, 0.08, 0.95], [0.31, 0.15, 0.67], [-0.16, 0.23, 0.56], [-0.43, 0.17, 0.7]], [[-0.35, 0.47, 0.53], [0.07, -0.33, 0.86], [0.07, 0.2, 0.53], [0.04, -0.42, 0.63], [0.34, 0.38, 0.87], [-0.12, -0.33, 0.75]], [[0.01, -0.09, 0.86], [0.31, -0.37, 0.67], [0.25, 0.44, 0.82], [-0.32, -0.1, 0.88], [-0.07, -0.09, 0.7], [-0.31, 0.18, 0.66]], [[0.13, -0.08, 0.72], [0.41, -0.07, 0.96], [0.49, -0.32, 0.74], [-0.26, -0.27, 0.99], [-0.02, 0.1, 0.68], [-0.17, -0.25, 0.58]], [[0.22, -0.41, 0.97], [0.42, 0.47, 0.75], [0.26, -0.47, 0.99], [-0.36, 0.07, 0.66], [0.03, 0.4, 0.99], [-0.19, 0.41, 0.81]], [[0.43, 0.39, 0.93], [0.05, -0.27, 0.61], [0.45, -0.36, 0.51], [0.37, -0.08, 0.82], [0.49, 0.21, 0.79], [0.42, -0.27, 0.53]], [[-0.17, 0.03, 0.69], [-0.11, -0.1, 0.67], [-0.48, 0.13, 0.56], [0.48, -0.27, 0.96], [0.24, 0, 0.8], [0.28, 0.1, 0.83]], [[0.13, -0.24, 0.64], [0.22, 0.02, 0.99], [-0.24, 0.43, 0.75], [-0.2, 0.36, 0.83], [-0.35, -0.4, 0.88], [0.22, 0.42, 0.79]]];
    const ENEMY_CLASSES = [_PoisonousEnemy_, _RocketEnemy_];
    //NOTE - sum of this array must be equal to 1 and it must be sorted with ascending order
    const ENEMY_SPAWN_PROPABILITES = [0.03, 0.97]; //0.03, 0.97
    var InterfaceWith = function (ParentInstance, Interface) {
        Object.getOwnPropertyNames(Interface).forEach(prop => {
            if (typeof ParentInstance[prop] === 'undefined')
                ParentInstance[prop] = Interface[prop];
        });
    };
    /////////////
    var vec2 = new _Vector_.Vec2f(), p_i, st_i;
    class GameCore extends _GameMap_.Map {
        constructor() {
            super();
            this.last_respawn_angle = Math.PI / 2.0;
            //if(!_CLIENT_) {//interface only server side becouse collision are handling on server
            if (typeof module !== 'undefined') {
                console.log('Assigning collision detecting methods to GameCore instance');
                InterfaceWith(this, _CollisionDetector_); //assigns CollisionDetector interface
            }
            // this.last_respawn_angle = Math.PI / 2.0;
        }
        destroy() {
            super.destroy();
        }
        initPlayers(init_data) {
            super.paintHole(0, 0, PARAMS.spawn_radius + PARAMS.spawn_offset);
            super.drawSpawn(PARAMS.spawn_radius, PARAMS.spawn_walls_thickness);
            //let colors = Object.values(Colors.PLAYERS_COLORS);
            for (let i = 0; i < init_data.length; i++) {
                let player = new _Player_(init_data[i]['ship_type'], init_data[i]['skills'], _Colors_.PLAYERS_COLORS[init_data[i].color_id | 0]);
                player.user_id = init_data[i]['id'];
                player.nick = init_data[i]['nick'];
                player.level = init_data[i]['level'];
                player.rank = init_data[i]['rank'];
                let a = Math.PI * 2.0 * i / init_data.length + Math.PI / 2;
                player.setPos(Math.cos(a) * PARAMS.spawn_radius / 2, Math.sin(a) * PARAMS.spawn_radius / 2).setRot(-a + Math.PI / 2);
                player.painter.lastPos.set(player.x, player.y);
                player.spawning = true;
                player.painter.active = false;
                // player.movement.speed = player.movement.maxSpeed;
                //super.addPlayer( player );
                this.players.push(player);
            }
        }
        respawnPlayer(player) {
            player.spawning = true;
            player.effects.clearAll();
            let a = this.last_respawn_angle; //Math.PI / 2;
            this.last_respawn_angle += Math.PI * 2.0 / this.players.length + (Math.PI * 2.0 / 16);
            player.setPos(Math.cos(a) * PARAMS.spawn_radius / 2, Math.sin(a) * PARAMS.spawn_radius / 2).setRot(-a + Math.PI / 2);
            player.movement.speed = 0;
            player.movement.resetState();
            player.painter.active = false;
            player.painter.lastPos.set(player.x, player.y);
            player.hp = 1;
            player.energy = 1;
        }
        spawnEnemy(class_index) {
            //@ts-ignore
            if (this.findRandomEmptySpot(this, _EnemySpawner_.SCALE, vec2) === false)
                return null; //no empty spot found
            let enemy = new ENEMY_CLASSES[class_index](); //new RocketEnemy();
            enemy.setPos(vec2.x, vec2.y);
            enemy.setRot(Math.random() * Math.PI * 2); //random player angle
            this.enemies.push(enemy);
            this.enemy_spawners.push(new _EnemySpawner_(enemy));
            return enemy;
        }
        spawnItem(type) {
            //@ts-ignore
            if (this.findRandomEmptySpot(this, _EnemySpawner_.SCALE, vec2) === false)
                return null; //no empty spot found
            let item = new _Item_(type);
            item.setPos(vec2.x, vec2.y);
            this.items.push(item);
            return item;
        }
        drawDeathMark(x, y, color) {
            this.color = color.hex;
            super.drawLine(x - PARAMS.death_mark_size, y - PARAMS.death_mark_size, x + PARAMS.death_mark_size, y + PARAMS.death_mark_size, 0.01);
            super.drawLine(x - PARAMS.death_mark_size, y + PARAMS.death_mark_size, x + PARAMS.death_mark_size, y - PARAMS.death_mark_size, 0.01);
        }
        drawStain(stain_index, x, y, size) {
            this.color = _Colors_.POISON.hex;
            for (st_i = 0; st_i < STAINS[stain_index].length; st_i++) {
                this.drawCircle(x + STAINS[stain_index][st_i][0] * size, y + STAINS[stain_index][st_i][1] * size, STAINS[stain_index][st_i][2] * size);
            }
        }
        findPlayerIndexByColor(color) {
            for (p_i = 0; p_i < this.players.length; p_i++) {
                if (this.players[p_i].painter.color === color) //NOTE strict equal operator
                    return p_i;
            }
            return -1; //in case player with given color is not found
        }
        update(delta) {
            super.update(delta);
        }
        static get PARAMS() {
            return PARAMS;
        }
        static get ENEMY_CLASSES() {
            return ENEMY_CLASSES;
        }
        static getRandomEnemyClassIndex() {
            let random_value = Math.random(); //[0, 1]
            let prop_sum = 0;
            for (var i = 0; i < ENEMY_SPAWN_PROPABILITES.length; i++) {
                if (random_value < ENEMY_SPAWN_PROPABILITES[i] + prop_sum)
                    return i;
                prop_sum += ENEMY_SPAWN_PROPABILITES[i];
            }
            throw new Error('Cannot get random index from ENEMY_SPAWN_PROPABILITES');
        }
        static getRandomStainIndex() {
            return (Math.random() * STAINS.length) | 0;
        }
    }
    return GameCore;
})();
try { //export for NodeJS
    module.exports = GameCore;
}
catch (e) { }
///<reference path="game_core.ts"/>
const GameResult = (function (GameCore) {
    const EXP_FACTOR = 0.01; //1 percent per kill point
    const COINS_PER_BEATEN_PLAYER = 50;
    const COINS_FOR_POINTS_BONUS_FACTOR = 4;
    //according to killed enemies minus deaths, player's level and points
    function calculateExpReward(player) {
        return Math.max(0, player.kills + player.points / GameCore.PARAMS.points_for_enemy_kill - player.deaths * 5) * EXP_FACTOR / Math.sqrt(player.level);
    }
    function calculateCoinsReward(position, players_count, points) {
        if (players_count < 2)
            return 0;
        let beaten_players = players_count - (position + 1);
        return Math.round(beaten_players * COINS_PER_BEATEN_PLAYER +
            points / GameCore.PARAMS.points_for_enemy_kill * COINS_FOR_POINTS_BONUS_FACTOR *
                ((players_count - 1) / 8));
    }
    function probability(r1, r2) {
        return 1.0 * 1.0 / (1 + 1.0 * Math.pow(10, 1.0 * (r1 - r2) / 400));
    }
    const eloK = 10;
    function eloRating(Ra, Rb, d) {
        //calculate the winning probability of Player A
        let Pa = probability(Rb, Ra);
        // Case -1 When Player A wins
        if (d === true)
            return eloK * (1 - Pa);
        else // Case -2 When Player B wins
            return eloK * (0 - Pa);
        throw new Error('Impossible error');
    }
    //@players - array of objects with rank property
    //@target_index - index of target object within players array
    function calculateRankReward(players, target_index) {
        let total_reward = 0; //stores sum of partial rewards
        let Ra = players[target_index].rank;
        for (let i = 0; i < players.length; i++) {
            let Rb = players[i].rank;
            if (i !== target_index) //TODO - ignore guests
                total_reward += eloRating(Ra, Rb, i > target_index);
        }
        return total_reward;
    }
    /*(function() {//Elo test

        let players = [
            // {rank: 2173},
            // {rank: 2162},
            // {rank: 1996},
            // {rank: 2025},
            // {rank: 2097},
            // {rank: 2140},
            // {rank: 1831},
            // {rank: 1558}
            ///////////////
            
            /////////////////
            // {rank: 1200},
            // {rank: 1000}
        ];

        for(let i=0; i<players.length; i++)
            console.log( Math.round(calculateRankReward(players, i)) );
    })();*/
    return class GameResult {
        constructor(game) {
            this.players_results = [];
            if (game instanceof GameCore) { //this should be invoke only server-side
                game.players.sort((a, b) => b.points - a.points)
                    .forEach((player, index, arr) => {
                    //@arr - sorted array of players
                    let rank_reward = calculateRankReward(arr, index);
                    this.players_results.push({
                        user_id: player.user_id,
                        nick: player.nick,
                        level: player.level,
                        points: player.points,
                        kills: player.kills,
                        deaths: player.deaths,
                        exp: calculateExpReward(player),
                        //NOTE - array is sorted desc by player points
                        coins: calculateCoinsReward(index, game.players.length, player.points),
                        rank: player.rank + rank_reward,
                        rank_reward: rank_reward
                    });
                });
            }
        }
        toJSON() {
            return {
                players_results: this.players_results
            };
        }
        static fromJSON(json_data) {
            if (typeof json_data === 'string')
                json_data = JSON.parse(json_data);
            let result = new GameResult();
            result.players_results = json_data['players_results'];
            return result;
        }
    };
})(
//@ts-ignore
typeof GameCore !== 'undefined' ? GameCore : require('./game_core.js'));
try { //export for NodeJS
    module.exports = GameResult;
}
catch (e) { }
///<reference path="common/utils.ts"/>
///<reference path="common/common.ts"/>
///<reference path="chat.ts"/>
//const GamePanel = (function() {
class GamePanel extends Chat {
    constructor() {
        super();
        this._widget = null;
        //private input: $_face | null = null;
        this.folded = false;
        this.added_users_entries = [];
        //this._widget = null;
        this.createPanelWidget();
        // this.folded = false;
        if (SETTINGS.game_panel_auto_hide)
            this.panel_slide();
        // this.added_users_entries = [];
        setTimeout(() => {
            if (this.input)
                this.input.blur();
        }); //regain focus to canvas
    }
    get widget() {
        return this._widget || $$(document.body);
    }
    panel_slide() {
        this.folded = !this.folded;
        if (!this.folded)
            this.widget.removeClass('folded');
        else
            this.widget.addClass('folded');
    }
    addUser(user) {
        let users_list = this.widget.getChildren('.users_list');
        if (!users_list)
            return;
        //store array of DOM nodes associated with user
        let user_nodes = COMMON.createUserEntry(user);
        this.added_users_entries.push({
            id: user.id,
            nodes: user_nodes
        });
        users_list.addChild(user_nodes);
        // COMMON.createUserEntry(user, users_list);
        COMMON.createUserEntry(user);
    }
    removeUserByID(user_id) {
        $$.assert(typeof user_id === 'number', 'user_id must be a number');
        for (let i = 0; i < this.added_users_entries.length; i++) {
            let entry = this.added_users_entries[i];
            if (entry.id === user_id) {
                entry.nodes.forEach(node => node.remove());
                this.added_users_entries.splice(i, 1);
                i--;
            }
        }
    }
    createPanelWidget() {
        if (this._widget !== null)
            return this._widget;
        let panel_slider = $$.create('BUTTON').setClass('panel_slide_btn')
            .addClass('opacity_and_rot_transition').on('click', () => {
            this.panel_slide();
            panel_slider.blur();
        });
        this._widget = $$.create('DIV').addClass('game_gui_right').setStyle({
            width: '' + GamePanel.RIGHT_PANEL_WIDTH + 'px'
        }).addChild(//panel header
        $$.create('DIV').addClass('header').addChild($$.create('IMG').addClass('icon_btn')
            .setAttrib('src', 'img/icons/settings.png').on('click', () => {
            let curr_stage = Stage.getCurrent();
            if (curr_stage)
                curr_stage.popup(Popup.Settings);
        })).addChild($$.create('IMG').addClass('icon_btn')
            .setAttrib('src', 'img/account.png').on('click', () => {
            let curr_stage = Stage.getCurrent();
            if (curr_stage)
                curr_stage.popup(Popup.Account);
        }))).addChild(//list of users
        $$.create('DIV').addClass('users_list_container').addChild($$.create('DIV').addClass('users_list'))).addChild(/*buttons*/ $$.create('DIV').setClass('panel_buttons').addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
            .setText('EXIT TO LOBBY').on('click', () => {
            try {
                Network.leaveRoom();
            }
            catch (e) {
                console.error('cannot send leave room request: ', e);
            }
        }))).addChild(//chat widget
        super.createWidget().setStyle({
            width: '' + GamePanel.RIGHT_PANEL_WIDTH + 'px',
        })).addChild(panel_slider);
        return this._widget;
    }
}
GamePanel.RIGHT_PANEL_WIDTH = 250;
// })();
const GRAPHICS = (function () {
    const SESSION_STRING = COMMON.generateRandomString(10);
    var CANVAS, GL, EXT, aspect;
    var initialized = false;
    var fullscreen_framebuffers = [];
    function loadContext() {
        try { //premultipliedAlpha
            GL = CANVAS.getContext('webgl', { antialias: true, alpha: false });
            EXT = GL.getExtension('WEBGL_draw_buffers') ||
                GL.getExtension("OES_draw_buffer") ||
                GL.getExtension("MOZ_OES_draw_buffer") ||
                GL.getExtension("WEBKIT_OES_draw_buffer");
            if (!GL)
                throw new Error('Cannot aquire webgl context');
            if (!EXT)
                throw new Error('Browser does not support "draw buffers" webgl extention');
        }
        catch (e) {
            console.error(e);
            alert('No WebGL support');
        }
        // Turn off rendering to alpha
        GL.colorMask(true, true, true, true);
        GL.enable(GL.BLEND);
        GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    }
    var self = {
        init: function () {
            if (CANVAS && typeof CANVAS.remove === 'function') //removing existing canvas
                CANVAS.remove();
            //creating new one
            CANVAS = $$.create('CANVAS').setAttrib('id', 'renderer#' + SESSION_STRING)
                .setAttrib('moz-opaque', '')
                .setStyle({
                'display': 'inline-block',
                'position': 'fixed',
                'left': '0px',
                'top': '0px',
                'background': 'none',
                'user-select': 'none'
                //'pointerEvents': 'none',
            });
            $$.expand(CANVAS, $$.getScreenSize(), true);
            aspect = $$.getScreenSize().width / $$.getScreenSize().height;
            if ($$(document.body) == null)
                throw new Error('No page body found');
            $$(document.body).appendAtBeginning(CANVAS);
            //CANVAS.focus();
            loadContext();
            initialized = true;
            return CANVAS;
        },
        destroy: function () {
            initialized = false;
            //console.log("WAAT", CANVAS);
            if (CANVAS && typeof CANVAS.remove === 'function') //removing existing canvas
                CANVAS.remove();
            CANVAS = null;
            GL = null;
        },
        enableAddiveBlending: function (enable) {
            if (enable)
                GL.blendFunc(GL.SRC_ALPHA, GL.ONE);
            else
                GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
        },
        isInitialized: function () {
            return initialized;
        },
        onResize: function (width, height) {
            CANVAS.width = width;
            CANVAS.height = height;
            aspect = width / height;
            for (let fb of fullscreen_framebuffers)
                fb.updateTextureResolution(width, height);
            GL.viewport(0, 0, width, height);
            //loadContext();
        },
        getWidth: function () {
            return CANVAS.width;
        },
        getHeight: function () {
            return CANVAS.height;
        },
        getAspect: function () {
            return aspect;
        },
        clear: function (r, g, b) {
            GL.clearColor(r, g, b, 0);
            GL.clear(GL.COLOR_BUFFER_BIT);
        },
        //};
        TEXTURES: (function () {
            const mipmaps = true;
            function powerOfTwo(n) {
                return (n & (n - 1)) === 0;
            }
            function stitchTextureObject(texture) {
                return {
                    webgl_texture: texture,
                    //fb: null,//framebuffer
                    update: function (pixels, linear) {
                        this.bind();
                        // console.time("texture update test");
                        // GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
                        GL.texSubImage2D(GL.TEXTURE_2D, 0, 0, 0, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
                        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, linear ? GL.LINEAR : GL.NEAREST);
                        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, linear ? GL.LINEAR : GL.NEAREST);
                        //if(mipmaps)
                        //	GL.generateMipmap(GL.TEXTURE_2D);
                        //
                        // console.timeEnd("texture update test");
                    },
                    bind: function () {
                        GL.bindTexture(GL.TEXTURE_2D, this.webgl_texture);
                    },
                    destroy: function () {
                        if (this.webgl_texture != null)
                            GL.deleteTexture(this.webgl_texture);
                        //if(this.fb != null)
                        //	GL.deleteFramebuffer(this.fb);
                    }
                };
            }
            return {
                createEmpty: function (width, height, linear) {
                    var temp_canvas = document.createElement('canvas');
                    temp_canvas.width = width;
                    temp_canvas.height = height;
                    return this.createFromCanvas(temp_canvas, linear);
                },
                /*createFromCanvas: function(canvas, linear) {
                    return this.createFromIMG(canvas, linear);
                },*/
                createFrom: function (image, linear) {
                    var texture = GL.createTexture();
                    if (linear === undefined)
                        linear = true;
                    GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
                    GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                    GL.bindTexture(GL.TEXTURE_2D, texture);
                    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
                    //if image width and height are powers of two
                    var filter = linear ? GL.LINEAR : GL.NEAREST;
                    if (powerOfTwo(image.width) && powerOfTwo(image.height)) {
                        var mipmap_filter = linear ? GL.LINEAR_MIPMAP_LINEAR : GL.NEAREST_MIPMAP_NEAREST;
                        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, filter);
                        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, mipmaps ? mipmap_filter : filter);
                    }
                    else {
                        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, filter);
                        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, filter);
                    }
                    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
                    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
                    if (mipmaps)
                        GL.generateMipmap(GL.TEXTURE_2D);
                    GL.bindTexture(GL.TEXTURE_2D, null);
                    return stitchTextureObject(texture);
                },
                active: function (number) {
                    GL.activeTexture(GL.TEXTURE0 + (number || 0));
                },
                unbind: function () {
                    GL.bindTexture(GL.TEXTURE_2D, null);
                }
            };
        })(),
        FRAMEBUFFERS: (function () {
            var current_fb = null;
            return {
                create: function (options /*name, w, h, linear, texturesCount*/) {
                    $$.assert(typeof options === 'object', 'Framebuffer options not specified');
                    //console.log('Creating framebuffer with given options:', options);
                    let linear = options.linear === undefined ? true : options.linear; //default
                    let width = options.width, height = options.height;
                    if (options.fullscreen === true) {
                        width = CANVAS.width;
                        height = CANVAS.height;
                    }
                    //var texturesCount = texturesCount || 1;
                    let fb = GL.createFramebuffer();
                    GL.bindFramebuffer(GL.FRAMEBUFFER, fb);
                    let texture = GL.createTexture();
                    GL.bindTexture(GL.TEXTURE_2D, texture);
                    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
                    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, linear ? GL.LINEAR : GL.NEAREST);
                    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, linear ? GL.LINEAR : GL.NEAREST);
                    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
                    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
                    //GL.generateMipmap(GL.TEXTURE_2D);
                    //var buffers = [];
                    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
                    //buffers.push(EXT.COLOR_ATTACHMENT0_WEBGL);//TODO no need to use array ...
                    //EXT.drawBuffersWEBGL(buffers);//... [EXT.COLOR_ATTACHMENT0_WEBGL] instead of buffers
                    GL.bindTexture(GL.TEXTURE_2D, null);
                    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
                    let framebuffer = {
                        framebuffer: fb,
                        webgl_texture: texture,
                        linear: linear,
                        updateTextureResolution: function (w, h) {
                            GL.bindTexture(GL.TEXTURE_2D, this.webgl_texture);
                            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, w, h, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
                            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, this.linear ? GL.LINEAR : GL.NEAREST);
                            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, this.linear ? GL.LINEAR : GL.NEAREST);
                            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
                            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
                        },
                        renderToTexture: function () {
                            current_fb = this.framebuffer;
                            GL.bindFramebuffer(GL.FRAMEBUFFER, this.framebuffer);
                        },
                        stopRenderingToTexture: function () {
                            current_fb = null;
                            GL.bindFramebuffer(GL.FRAMEBUFFER, null);
                        },
                        bindTexture: function () {
                            GL.bindTexture(GL.TEXTURE_2D, this.webgl_texture);
                        },
                        destroy: function () {
                            GL.deleteFramebuffer(this.framebuffer);
                            GL.deleteTexture(this.webgl_texture);
                            let index = fullscreen_framebuffers.indexOf(this);
                            if (index != -1)
                                fullscreen_framebuffers.splice(index, 1);
                        }
                    };
                    if (options.fullscreen === true)
                        fullscreen_framebuffers.push(framebuffer);
                    return framebuffer;
                },
                getCurrent: function () {
                    return current_fb;
                }
            };
        })(),
        SHADERS: (function () {
            var current_shader_program = null;
            //CREATE GL OBJECT SHADER BY SHADER TYPE AND ITS SOURCE
            function get_shader(source, type) {
                let shader = GL.createShader(type);
                GL.shaderSource(shader, source);
                GL.compileShader(shader);
                if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
                    console.error("ERROR IN " + (type === GL.VERTEX_SHADER ? "VERTEX" : "FRAGMENT") +
                        " SHADER : " + GL.getShaderInfoLog(shader));
                    return false;
                }
                return shader;
            }
            //CREATE GL OBJECT SHADER FROM GIVEN SHADER SOURCES
            function compile_shader(vertex_source, fragment_source) {
                var shader_vertex = get_shader(vertex_source, GL.VERTEX_SHADER);
                var shader_fragment = get_shader(fragment_source, GL.FRAGMENT_SHADER);
                if (!shader_vertex || !shader_fragment)
                    return false;
                let SHADER_PROGRAM = GL.createProgram();
                GL.attachShader(SHADER_PROGRAM, shader_vertex);
                GL.attachShader(SHADER_PROGRAM, shader_fragment);
                GL.linkProgram(SHADER_PROGRAM);
                var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
                var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
                var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
                if (_uv != -1)
                    GL.enableVertexAttribArray(_uv);
                if (_color != -1)
                    GL.enableVertexAttribArray(_color);
                GL.enableVertexAttribArray(_position);
                GL.useProgram(SHADER_PROGRAM);
                return SHADER_PROGRAM;
            }
            function uniform_loc(name) {
                return GL.getUniformLocation(current_shader_program, name);
            }
            return {
                create: function (sources) {
                    $$.assert(GL !== undefined, "GL context required");
                    $$.assert(typeof sources !== undefined &&
                        typeof sources.vertex_source === 'string' &&
                        typeof sources.fragment_source === 'string', 'Incorrect argument format');
                    let compiled_program = compile_shader(sources.vertex_source, sources.fragment_source);
                    $$.assert(compiled_program, "Cannot compile shader");
                    return {
                        program: compiled_program,
                        bind: function () {
                            GL.useProgram(this.program);
                            current_shader_program = this.program;
                        },
                        destroy: function () {
                            GL.deleteProgram(this.program);
                        }
                    };
                },
                getCurrent: function () {
                    return current_shader_program;
                },
                //UNIFORMS
                uniform_int: function (name, value) {
                    GL.uniform1i(uniform_loc(name), value);
                },
                uniform_float: function (name, value) {
                    GL.uniform1f(uniform_loc(name), value);
                },
                //accepts Float32Array
                uniform_vec4: function (name, value) {
                    GL.uniform4fv(uniform_loc(name), value);
                },
                uniform_vec3: function (name, value) {
                    GL.uniform3fv(uniform_loc(name), value);
                },
                uniform_vec2: function (name, value) {
                    GL.uniform2fv(uniform_loc(name), value);
                },
                uniform_mat3: function (name, value) {
                    GL.uniformMatrix3fv(uniform_loc(name), false, value);
                }
            };
        })(),
        VBO: (function () {
            var binded = null; //curently binded VBO
            return {
                create: function (data) {
                    $$.assert(data && data.vertex && data.faces, 'Incorrect data format');
                    var vertex_buff = GL.createBuffer();
                    var faces_buff = GL.createBuffer();
                    //VERTEXES:
                    GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
                    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(data.vertex), GL.STATIC_DRAW);
                    //FACES:
                    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buff);
                    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.faces), GL.STATIC_DRAW);
                    return {
                        faces_len: data.faces.length,
                        bind: function () {
                            //binding
                            GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
                            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buff);
                            var _uv = GL.getAttribLocation(self.SHADERS.getCurrent(), "uv");
                            var _position = GL.getAttribLocation(self.SHADERS.getCurrent(), "position");
                            /*bytes(float) * 2values per vertex + 2 offset for uv coords*/
                            GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4 * (2 + 2), 0);
                            if (_uv !== -1)
                                GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4 * (2 + 2), 4 * (2));
                            binded = this;
                        },
                        draw: function () {
                            GL.drawElements(GL.TRIANGLE_FAN, this.faces_len, GL.UNSIGNED_SHORT, 0);
                        },
                        destroy: function () {
                            GL.deleteBuffer(vertex_buff);
                            GL.deleteBuffer(faces_buff);
                        }
                    };
                    //return vbo;
                },
                createVertexBuffer: function (count) {
                    var vertex_buff = GL.createBuffer();
                    //if(data != nullptr)
                    //	updateData(data, data_length);
                    GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
                    GL.bufferData(GL.ARRAY_BUFFER, count * 4, GL.STATIC_DRAW);
                    //glBindBuffer(GL_ARRAY_BUFFER, 0);//unbind
                    return {
                        updateData: function (data /*, data_length*/) {
                            GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
                            //4 - bytes for float
                            //GL.bufferData(GL.ARRAY_BUFFER, count, GL.STATIC_DRAW);
                            GL.bufferSubData(GL.ARRAY_BUFFER, 0, data);
                        },
                        enableAttribute: function (attrib_name, size, stride, offset) {
                            var attrib = GL.getAttribLocation(self.SHADERS.getCurrent(), attrib_name);
                            if (attrib != -1)
                                GL.enableVertexAttribArray(attrib);
                            GL.vertexAttribPointer(attrib, size, GL.FLOAT, false, 4 * (stride), 4 * offset);
                        },
                        bind: function () {
                            GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
                            binded = this;
                        },
                        destroy: function () {
                            GL.deleteBuffer(vertex_buff);
                        },
                        draw: function (_count) {
                            GL.drawArrays(GL.POINTS, 0, _count);
                        }
                    };
                }
            };
        })(),
        Emitter: (function () {
            const POSITION_VALUES = 3, COLOR_VALUES = 4, VALUES_PER_PARTICLE = (POSITION_VALUES + COLOR_VALUES);
            return class {
                constructor(_texture, _count, _additive) {
                    this.data_length = 0;
                    this.buffer = self.VBO.createVertexBuffer(_count * VALUES_PER_PARTICLE);
                    this.texture = self.TEXTURES.createFrom(ASSETS.getTexture(_texture), true); //linear filtering
                    this.count = _count;
                    this.additive = _additive || false;
                    this.visible = true;
                    this.data = new Float32Array(_count * VALUES_PER_PARTICLE);
                    this.expired = false;
                    this.timestamp = undefined;
                }
                destroy() {
                    this.buffer.destroy();
                    this.texture.destroy();
                    this.data = null;
                }
                draw() {
                    //binding
                    this.buffer.bind();
                    this.buffer.enableAttribute("position", POSITION_VALUES, VALUES_PER_PARTICLE, 0);
                    this.buffer.enableAttribute("color", COLOR_VALUES, VALUES_PER_PARTICLE, POSITION_VALUES);
                    //updating data
                    this.buffer.updateData(this.data /*, this.count * VALUES_PER_PARTICLE*/);
                    //binding texture
                    self.TEXTURES.active(0);
                    self.SHADERS.uniform_int('texture', 0);
                    this.texture.bind();
                    self.enableAddiveBlending(this.additive);
                    //rendering buffer
                    this.buffer.draw(this.count);
                    self.enableAddiveBlending(false);
                }
                static get VALUES_PER_PARTICLE() {
                    return VALUES_PER_PARTICLE;
                }
            };
        })(),
    };
    return self;
})();
///<reference path="../engine/settings.ts"/>
///<reference path="../game/in_game_gui.ts"/>
///<reference path="../../include/game/objects/emoticon.ts"/>
///<reference path="../../include/game/common/colors.ts"/>
const ASSETS = (function () {
    const SHADERS_PATH = 'shaders/';
    const TEXTURES_PATH = 'img/textures/';
    var shaders = {};
    var textures = {};
    var pending = 1; //currently loading resources (0 means loaded)
    var onLoadCallbacks = [];
    const printError = (e) => console.error(e);
    const notFound = (name) => { throw new Error('Resource not found: ' + name); };
    function loadAssets() {
        // IMAGES //
        //items
        loadImage('health_item', TEXTURES_PATH + 'items/health.png');
        loadImage('energy_item', TEXTURES_PATH + 'items/energy.png');
        loadImage('speed_item', TEXTURES_PATH + 'items/speed.png');
        //skills icons
        // loadImage('basic_shot_skill', TEXTURES_PATH + 'skills_icons/basic_shot.png');
        // loadImage('bariere_skill', TEXTURES_PATH + 'skills_icons/bariere.png');
        loadImage('shot1_skill', TEXTURES_PATH + 'skills_icons/shot1.png');
        loadImage('shot2_skill', TEXTURES_PATH + 'skills_icons/shot2.png');
        loadImage('shot3_skill', TEXTURES_PATH + 'skills_icons/shot3.png');
        loadImage('shield_skill', TEXTURES_PATH + 'skills_icons/shield.png');
        loadImage('bounce_shot_skill', TEXTURES_PATH + 'skills_icons/bounce_shot.png');
        loadImage('energy_blast_skill', TEXTURES_PATH + 'skills_icons/energy_blast.png');
        loadImage('heal_skill', TEXTURES_PATH + 'skills_icons/heal.png');
        loadImage('speed_skill', TEXTURES_PATH + 'skills_icons/speed.png');
        loadImage('bomb_skill', TEXTURES_PATH + 'skills_icons/bomb.png');
        //emoticons
        InGameGUI.EMOTS.forEach(emot => {
            loadImage(Emoticon.entityName(emot.file_name), InGameGUI.EMOTS_FOLDER + emot.file_name, loaded_image => {
                //loaded_image.setAttrib('width', 256);
                //loaded_image.setAttrib('height', 256);
                loaded_image.width = 128;
                loaded_image.height = 128;
            });
        });
        //streak for emoticons
        loadImage('streak', InGameGUI.EMOTS_FOLDER + 'streak.png');
        // PARTICLES
        loadImage('fussion_particle', TEXTURES_PATH + 'particles/fussion.png');
        loadImage('cloud_particle', TEXTURES_PATH + 'particles/cloud.png');
        loadImage('plus', TEXTURES_PATH + 'particles/plus.png');
        loadImage('ring', TEXTURES_PATH + 'ring.png');
        loadImage('ring_thick', TEXTURES_PATH + 'ring_thick.png');
        //others
        //loadImage('hexagon', TEXTURES_PATH + 'hexagon.png');
        loadImage('pixel', TEXTURES_PATH + 'pixel.png');
        loadImage('enemy_rocket', TEXTURES_PATH + 'enemies/rocket.png');
        loadImage('enemy_poisonous', TEXTURES_PATH + 'enemies/poisonous.png');
        loadImage('bullet', TEXTURES_PATH + 'bullets/bullet.png');
        loadImage('bomb', TEXTURES_PATH + 'bomb.png');
        // SHADERS //
        loadShaderSource('main_shader', SHADERS_PATH + 'main.vs', SHADERS_PATH + 'main.fs');
        if (SETTINGS.shadows_type === 'FLAT') {
            loadShaderSource('post_shader', SHADERS_PATH + 'post_gui.vs', SHADERS_PATH + 'post_game_flat.fs');
        }
        else {
            loadShaderSource('post_shader', SHADERS_PATH + 'post_gui.vs', SHADERS_PATH + 'post_game_long.fs');
        }
        loadShaderSource('particles_shader', SHADERS_PATH + 'particles.vs', SHADERS_PATH + 'particles.fs');
    }
    var self = {
        loaded: () => pending === 0,
        onload: function (callback) {
            if (this.loaded())
                callback();
            else
                onLoadCallbacks.push(callback);
        },
        getShaderSources: name => shaders[name] || notFound(name),
        getTexture: name => textures[name] || notFound(name)
    };
    function loadShaderSource(name, vertex_file_path, fragment_file_path) {
        pending++;
        $$.loadFile(vertex_file_path, (vss) => {
            if (vss === undefined)
                throw new Error('Cannot load file (' + vertex_file_path + ')');
            else {
                $$.loadFile(fragment_file_path, (fss) => {
                    if (fss === undefined)
                        throw new Error('Cannot load file (' + vertex_file_path + ')');
                    else
                        shaders[name] = {
                            vertex_source: vss,
                            fragment_source: fss
                        };
                    pending--;
                });
            }
        });
    }
    function loadImage(name, path, onLoad) {
        pending++;
        //new version of this method
        $$.create('IMG').on('load', function () {
            textures[name] = this;
            if (onLoad)
                onLoad(this);
            pending--;
        }).on('error', e => printError(e)).setAttrib('src', path);
    }
    function generatePlayersTextures() {
        //pending++;
        //@ts-ignore
        Object.keys(Player.TYPES).map(key => Player.TYPES[key]).forEach((type_i) => {
            pending++;
            $$.create('IMG').on('load', function () {
                var player_texture = this;
                // console.log(this);
                Colors.PLAYERS_COLORS.forEach((color) => {
                    pending++;
                    let player_canv = $$.create('CANVAS'); //document.createElement('CANVAS');
                    player_canv.width = this.naturalWidth;
                    player_canv.height = this.naturalHeight;
                    let player_ctx = player_canv.getContext('2d', { antialias: true });
                    player_ctx.drawImage(player_texture, 0, 0);
                    var canvasData = player_ctx.getImageData(0, 0, player_canv.width, player_canv.height), pix = canvasData.data;
                    for (var i = 0, n = pix.length, j = 0; i < n; i += 4) {
                        for (j = 0; j < 3; j++)
                            pix[i + j] = Math.min(255, pix[i + j] + color.byte_buffer[j]); //cbuff[0];
                    }
                    player_ctx.putImageData(canvasData, 0, 0);
                    textures[Player.entityName(type_i, color)] = player_canv;
                    pending--;
                    // $$(document.body).append(player_canv);
                });
                pending--;
            }).on('error', e => printError(e))
                .setAttrib('src', TEXTURES_PATH + 'players/type_' + (type_i + 1) + '.png');
        });
    }
    //LOADING GAME RESOURCES ASYNCHRONOUSLY
    $$.runAsync(() => {
        loadAssets();
        //generating players textures
        generatePlayersTextures();
        pending--;
        let checkLoaded = () => {
            if (self.loaded())
                onLoadCallbacks.forEach(cb => cb());
            else
                setTimeout(checkLoaded, 100);
        };
        checkLoaded();
    });
    return self;
})();
///<reference path="../common/utils.ts"/>
///<reference path="../engine/assets.ts"/>
///<reference path="../engine/network.ts"/>
///<reference path="../../include/game/objects/player.ts"/>
///<reference path="../../include/game/common/colors.ts"/>
// const InGameGUI = (function() {
const formatTime = (seconds) => {
    let minutes = 0;
    while (seconds >= 60) {
        minutes++;
        seconds -= 60;
    }
    let seconds_str = (seconds < 10 ? '0' : '') + seconds + 's';
    if (minutes > 0)
        return (minutes < 10 ? '0' : '') + minutes + 'm ' + seconds_str;
    else
        return seconds_str;
};
const toPercent = (value) => Math.round(Math.min(1, Math.max(0, value)) * 100) + '%';
function createSkillButton(texture_name, key, continous) {
    let main_part = $$.create('DIV').addClass('main_part');
    let cooldown_timer = $$.create('DIV').addClass('cooldown').setStyle({ 'display': 'none' });
    //.setText('')
    let widget = $$.create('SPAN').addClass('skill_button').addChild(main_part.addChild($$.create('IMG').setAttrib('src', ASSETS.getTexture(texture_name).getAttrib('src'))).addChild(cooldown_timer)).addChild($$.create('DIV').addClass('key').setText(key));
    return {
        onUse: function (cooldown_value) {
            if (this.continous)
                main_part.addClass('in_use');
            else { //start countdown
                this.cooldown = cooldown_value || 0;
                this.end_timestamp = Date.now() + (this.cooldown * 1000);
                cooldown_timer.setStyle({ 'display': 'block' }).setText(Math.round(cooldown_value));
            }
        },
        onStop: function () {
            if (this.continous)
                main_part.removeClass('in_use');
        },
        update: function (delta) {
            if (this.cooldown === 0)
                return;
            let last_sec = Math.round(this.cooldown);
            this.cooldown = ((this.end_timestamp - Date.now()) / 1000);
            if (this.cooldown <= 0) {
                this.cooldown = 0;
                cooldown_timer.setStyle({ 'display': 'none' });
            }
            else if (last_sec > Math.round(this.cooldown))
                cooldown_timer.setText(Math.round(this.cooldown));
        },
        cooldown: 0,
        end_timestamp: 0,
        continous: continous,
        widget: widget
    };
}
class InGameGUI {
    constructor() {
        this.focused_speed_value = 0;
        this.focused_hp_value = 0;
        this.focused_energy_value = 0;
        this.players_infos = [];
        this.skills = [];
        this.emoticon_use_listener = null;
        this.skill_use_listener = null;
        this.skill_stop_listener = null;
        let current_room = Network.getCurrentRoom();
        if (current_room === null)
            throw new Error('No current room');
        this.timer = $$.create('SPAN').setText(formatTime(current_room.duration));
        this.focused_health = $$.create('SPAN').addClass('bar').addClass('health').setText('0%');
        this.focused_energy = $$.create('SPAN').addClass('bar').addClass('energy').setText('0%');
        this.focused_speed = $$.create('SPAN').addClass('bar').addClass('speed').setText('0%');
        // this.focused_speed_value = 0;
        // this.focused_hp_value = 0;
        // this.focused_energy_value = 0;
        // this.players_infos = [];//allows to access player's infos widgets
        this.skills = [];
        // this.emoticon_use_listener = null;
        // this.skill_use_listener = null;
        // this.skill_stop_listener = null;
        this.entries_container = $$.create('DIV').addClass('entries')
            .addChild(//user's player hp, mp and speed
        $$.create('DIV').addClass('entry')
            .addChild(this.focused_health)
            .addChild(this.focused_energy)
            .addChild(this.focused_speed)).addChild(//game info, timers
        $$.create('DIV').addClass('entry').addClass('gridded').addChild($$.create('SPAN').setText('Room:')).addChild($$.create('SPAN').setText(current_room.name))
            .addChild($$.create('SPAN').setText('Map:'))
            .addChild($$.create('SPAN').setText(current_room.map))
            .addChild($$.create('SPAN').setText('Mode:'))
            .addChild($$.create('SPAN')
            .setText(InGameGUI.gamemode_names[current_room.gamemode]))
            .addChild($$.create('SPAN').setText('Time:'))
            .addChild(this.timer));
        this.notifications_container = $$.create('DIV').addClass('notifications');
        var left_panel = $$.create('DIV').addClass('game_gui_left').setStyle({
            width: '' + InGameGUI.LEFT_PANEL_WIDTH + 'px'
        }).addChild(this.entries_container).addChild(this.notifications_container);
        this.entries_container.addChild(current_room.sits.map(sit => {
            let player = current_room && current_room.getUserByID(sit);
            if (player === null)
                throw new Error('Cannot find player by it\'s sit id');
            let player_info = {
                points_widget: $$.create('SPAN').addClass('player_points').setText(0),
                ship_preview_widget: $$.create('SPAN').addClass('player_ship'),
                kills_widget: $$.create('SPAN').addClass('player_kills').setText(0),
                deaths_widget: $$.create('SPAN').addClass('player_deaths').setText(0),
                health_widget: $$.create('DIV').addClass('player_health')
                    .setStyle({ width: '100%' }),
                energy_widget: $$.create('DIV').addClass('player_energy')
                    .setStyle({ width: '100%' })
            };
            this.players_infos.push(player_info);
            return $$.create('DIV').addClass('entry').addClass('player_info').addChild($$.create('SPAN').addClass('player_nick').setText(player.nick)).addChild(Object.keys(player_info).map(key => player_info[key]));
        }));
        //console.log(this.players_infos);
        $$(document.body).addChild(left_panel);
        // SKILLS BAR (EMPTY)
        var footer = $$.create('DIV').setStyle({
            'position': 'fixed',
            'bottom': '0px',
            'width': '100%',
            'textAlign': 'center',
            'pointerEvents': 'none',
            'display': 'grid',
            'justify-content': 'center'
        });
        var emots_visible = false;
        let emots_switcher = $$.create('DIV').addClass('opacity_and_rot_transition')
            .addClass('emot_bar_switcher').on('click', () => {
            if ((emots_visible = !emots_visible)) {
                emots_switcher.addClass('active');
                this.emots_bar.removeClass('hidden');
            }
            else {
                emots_switcher.removeClass('active');
                this.emots_bar.addClass('hidden');
            }
        });
        this.skills_bar = $$.create('DIV').addClass('skills_bar').addChild(emots_switcher);
        this.emots_bar = $$.create('DIV').addClass('emots_bar').addClass('hidden');
        footer.addChild([this.emots_bar, this.skills_bar]);
        InGameGUI.EMOTS.forEach((emot, index) => {
            this.emots_bar.addChild($$.create('SPAN').addClass('emoticon_button').addChild($$.create('IMG')
                .setAttrib('src', InGameGUI.EMOTS_FOLDER + emot.file_name)).addChild($$.create('DIV').addClass('key').setText(emot.key)).setStyle({ 'transition-delay': (index * 50) + 'ms' }).on('click', () => {
                if (typeof this.emoticon_use_listener === 'function')
                    this.emoticon_use_listener(index);
            }));
        });
        $$(document.body).addChild(footer);
        /*setInterval(() => {
            this.addNotification( COMMON.generateRandomString(50) );
        }, 2000);*/
    }
    /*static get EMOTS() {
        return EMOTS;
    }*/
    /*static get EMOTS_FOLDER() {
        return EMOTS_FOLDER;
    }*/
    onEmoticonUse(callback) {
        this.emoticon_use_listener = callback;
    }
    onSkillUse(callback) {
        this.skill_use_listener = callback;
    }
    onSkillStop(callback) {
        this.skill_stop_listener = callback;
    }
    updateTimer(duration) {
        // console.log('remaining time:', duration);
        this.timer.setText(formatTime(duration));
        if (duration === 5 || duration === 10 || duration === 30)
            this.addNotification(duration + ' seconds left');
    }
    addNotification(text) {
        let notif = $$.create('DIV').setClass('notification').setText(text);
        this.notifications_container.addChild(notif);
        setTimeout(() => {
            notif.addClass('fader');
            setTimeout(() => notif.remove(), 1100); //little longer than animation duration
        }, InGameGUI.NOTIFICATION_LIFETIME);
    }
    addChildSkill(texture_asset_name, key, continous) {
        let skill_btn = createSkillButton(texture_asset_name, key, continous);
        this.skills.push(skill_btn);
        this.skills_bar.addChild(skill_btn.widget);
        //key = typeof key === 'number' ? key : 0;
        skill_btn.widget.on('mousedown', (e) => {
            if (e.button !== 0) //only LMB
                return;
            if (typeof this.skill_use_listener === 'function')
                this.skill_use_listener(key);
        });
        skill_btn.widget.on('mouseup', (e) => {
            if (e.button !== 0) //only LMB
                return;
            if (typeof this.skill_stop_listener === 'function')
                this.skill_stop_listener(key);
        });
    }
    addChildEmptySkill(key) {
        this.skills.push(null);
        this.skills_bar.addChild($$.create('SPAN').addClass('skill_button').addChild($$.create('DIV').addClass('main_part')).addChild($$.create('DIV').addClass('key').setText(key)));
    }
    onSkillUsed(skill_index, cooldown_value) {
        try {
            //@ts-ignore
            this.skills[skill_index].onUse(cooldown_value);
        }
        catch (e) {
            console.error(e);
        }
    }
    onSkillStopped(skill_index) {
        try {
            //@ts-ignore
            this.skills[skill_index].onStop();
        }
        catch (e) {
            console.error(e);
        }
    }
    assignPlayerPreview(player_index, ship_type, color_index) {
        try {
            let texture_name = Player.entityName(ship_type, Colors.PLAYERS_COLORS[color_index]);
            this.players_infos[player_index].ship_preview_widget.addChild(
            //@ts-ignore
            $$.create('IMG').setAttrib('src', ASSETS.getTexture(texture_name).toDataURL())).addChild($$.create('SPAN').addClass('color_stain').setStyle({
                'backgroundColor': Colors.PLAYERS_COLORS[color_index].hex
            }));
        }
        catch (e) {
            console.error(e);
        }
    }
    onPlayerHpChange(player_index, hp_value) {
        try {
            this.players_infos[player_index].health_widget
                .setStyle({ width: toPercent(hp_value) });
        }
        catch (e) {
            console.error(e);
        }
    }
    onPlayerEnergyChange(player_index, energy_value) {
        try {
            this.players_infos[player_index].energy_widget
                .setStyle({ width: toPercent(energy_value) });
        }
        catch (e) {
            console.error(e);
        }
    }
    onPlayerPointsChange(player_index, points_value) {
        try {
            this.players_infos[player_index].points_widget.setText(points_value);
        }
        catch (e) {
            console.error(e);
        }
    }
    onPlayerKill(player_index) {
        try {
            let widget = this.players_infos[player_index].kills_widget;
            widget.setText(parseInt(widget.innerHTML) + 1);
        }
        catch (e) {
            console.error(e);
        }
    }
    onPlayerDeath(player_index) {
        try {
            let widget = this.players_infos[player_index].deaths_widget;
            widget.setText(parseInt(widget.innerHTML) + 1);
        }
        catch (e) {
            console.error(e);
        }
    }
    update(focused, delta) {
        if (this.focused_speed_value !== focused.movement.speed) {
            this.focused_speed_value = focused.movement.speed;
            var speed_normalized = focused.movement.speed / focused.movement.maxSpeed;
            let percent = toPercent(speed_normalized);
            this.focused_speed.setText(percent).setStyle({ 'width': percent });
        }
        if (this.focused_hp_value !== focused.hp) {
            this.focused_hp_value = focused.hp;
            let percent = toPercent(focused.hp);
            this.focused_health.setText(percent).setStyle({ 'width': percent });
        }
        if (this.focused_energy_value !== focused.energy) {
            this.focused_energy_value = focused.energy;
            let percent = toPercent(focused.energy);
            this.focused_energy.setText(percent).setStyle({ 'width': percent });
        }
        for (var s_i = 0; s_i < this.skills.length; s_i++) {
            if (this.skills[s_i] !== null) {
                //@ts-ignore
                this.skills[s_i].update(delta);
            }
        }
    }
}
InGameGUI.LEFT_PANEL_WIDTH = 200;
InGameGUI.NOTIFICATION_LIFETIME = 5 * 1000;
InGameGUI.EMOTS_FOLDER = '/img/textures/emoticons/';
InGameGUI.EMOTS = [
    { file_name: 'hand.png', key: 'Q' },
    { file_name: 'happy.svg', key: 'E' },
    { file_name: 'sad.svg', key: 'R' },
    { file_name: 'laugh.svg', key: 'T' },
    { file_name: 'angry.svg', key: 'Y' },
    { file_name: 'shocked.svg', key: 'U' },
    { file_name: 'inlove.svg', key: 'I' },
    { file_name: 'dead.svg', key: 'O' },
];
InGameGUI.gamemode_names = ['Cooperation', 'Competition'];
// })();
///<reference path="../../include/game/objects/player.ts"/>
///<reference path="../../include/game/common/colors.ts"/>
///<reference path="../../include/game/objects/emoticon.ts"/>
///<reference path="../../include/game/objects/shield.ts"/>
///<reference path="../../include/game/objects/bomb.ts"/>
///<reference path="../../include/game/objects/bullet.ts"/>
///<reference path="../../include/game/objects/object2d.ts"/>
///<reference path="../engine/graphics.js"/>
///<reference path="in_game_gui.ts"/>
//const Entities = (function() {//@child of Renderer
// namespace EntitiesScope {
var Entities = (function () {
    var current_instance = null;
    let LAYERS;
    (function (LAYERS) {
        LAYERS[LAYERS["FOREGROUND"] = 0] = "FOREGROUND";
        LAYERS[LAYERS["PAINT"] = 1] = "PAINT";
    })(LAYERS || (LAYERS = {}));
    const DEFAULT_LAYER = LAYERS.FOREGROUND;
    const DEFAULT_COLOR = Colors.WHITE.buffer;
    const DEFAULT_FILTERING = true;
    //definies texture colors etc of each individual game entity
    //NOTE - entry names must be prevented from change by closure compiller
    //TODO - this data can be loaded from JSON file
    const EntitiesData = {
        'HEALTH_ITEM': {
            texture_name: 'health_item' //name of texture resource
        },
        'ENERGY_ITEM': {
            texture_name: 'energy_item'
        },
        'SPEED_ITEM': {
            texture_name: 'speed_item'
        },
        'ENEMY_ROCKET': {
            texture_name: 'enemy_rocket',
        },
        'ENEMY_POISONOUS': {
            texture_name: 'enemy_poisonous'
        },
        'ENEMY_SPAWNER': {
            texture_name: 'ring_thick',
            color: Colors.ENEMY_SPAWN.buffer,
            layer: LAYERS.PAINT
        },
        'POISONOUS_ENEMY_SPAWNER': {
            texture_name: 'ring_thick',
            color: Colors.POISON.buffer,
            layer: LAYERS.PAINT
        },
        'HEALTH_BAR': {
            texture_name: 'pixel',
            linear: false,
            color: Colors.HEALTH_BAR.buffer
        },
        'STREAK': {
            texture_name: 'streak'
        },
        IMMUNITY_AUREOLE: {
            texture_name: 'ring',
            color: Colors.IMMUNITY_AUREOLE.buffer,
            layer: LAYERS.PAINT
        }
    };
    //EMOTICONS ENTITIES
    InGameGUI.EMOTS.forEach(emot => {
        let emot_name = Emoticon.entityName(emot.file_name);
        EntitiesData[emot_name] = {
            texture_name: emot_name
        };
    });
    //adding entities that are distinct by player's colors
    Colors.PLAYERS_COLORS.forEach((color) => {
        let bullet_name = Bullet.entityName(color);
        EntitiesData[bullet_name] = {
            texture_name: 'bullet',
            color: color.buffer
        };
        let bomb_name = Bomb.entityName(color);
        EntitiesData[bomb_name] = {
            texture_name: 'bomb',
            color: color.buffer,
            layer: LAYERS.PAINT
        };
        let shield_name = Shield.entityName(color);
        EntitiesData[shield_name] = {
            texture_name: 'ring_thick',
            color: color.buffer,
            layer: LAYERS.PAINT
        };
        //for each player type
        //@ts-ignore
        Object.keys(Player.TYPES).map(key => Player.TYPES[key]).forEach(type_i => {
            let name = Player.entityName(type_i, color);
            //console.log(name);
            EntitiesData[name] = {
                texture_name: name,
                linear: true,
                color: Colors.WHITE.buffer,
                layer: LAYERS.PAINT
            };
        });
    });
    var ids = 0, key, l, entity_it, obj_it; //data
    for (key in EntitiesData) //assigning id to each entity data
        EntitiesData[key].id = ids++;
    // console.log(EntitiesData)
    class Entities {
        constructor(rect) {
            $$.assert(GRAPHICS.isInitialized(), 'Graphics must be initialized');
            if (current_instance === null)
                current_instance = this;
            else
                throw new Error('Only single instance of Entities class is allowed');
            this.rect = rect; //VBO rect
            //creating list of entities
            this.entities = [];
            var data;
            for (key in EntitiesData) {
                data = EntitiesData[key];
                //CREATE NEW ENTITY OBJECT
                this.entities.push({
                    layer: data.layer !== undefined ? data.layer : DEFAULT_LAYER,
                    color: data.color || DEFAULT_COLOR,
                    //@ts-ignore
                    texture: GRAPHICS.TEXTURES.createFrom(ASSETS.getTexture(data.texture_name), data.linear === undefined ? DEFAULT_FILTERING : data.linear),
                    objects: []
                });
            }
        }
        destroy() {
            console.log('removing existing entities');
            this.entities.forEach(ent => {
                ent.texture.destroy();
                //@ts-ignore
                ent.objects = null;
            });
            //@ts-ignore
            this.entities = null;
            current_instance = null;
        }
        drawLayer(layer) {
            for (entity_it of this.entities) {
                if (entity_it.layer !== layer || entity_it.objects.length === 0)
                    continue;
                //@ts-ignore
                GRAPHICS.SHADERS.uniform_vec4('color', entity_it.color);
                entity_it.texture.bind();
                for (obj_it of entity_it.objects) { //drawing objects
                    //@ts-ignore
                    GRAPHICS.SHADERS.uniform_mat3('u_matrix', obj_it.buffer);
                    this.rect.draw();
                }
            }
        }
        ////////////////////////////////////////////////////////////
        // STATIC METHODS
        ////////////////////////////////////////////////////////////
        //@entity_id - id of entity (or null for server cases)
        //@object - instance of Object2D
        static addObject(entity_id, object) {
            //console.log(entity_id, object);
            if (entity_id === null || current_instance == null)
                return false;
            if (current_instance.entities[entity_id]) {
                current_instance.entities[entity_id].objects.push(object);
                return true;
            }
            return false;
        }
        static removeObject(entity_id, object) {
            if (current_instance == null)
                return false;
            if (current_instance.entities[entity_id]) {
                l = current_instance.entities[entity_id].objects.indexOf(object);
                if (l !== -1) {
                    current_instance.entities[entity_id].objects.splice(l, 1);
                    return true;
                }
            }
            else { //searching for object in every entity (slow)
                for (entity_it of current_instance.entities) {
                    l = entity_it.objects.indexOf(object);
                    if (l !== -1) {
                        entity_it.objects.splice(l, 1);
                        return true;
                    }
                }
            }
            return false;
        }
    }
    Entities.LAYERS = LAYERS;
    //@ts-ignore
    Object.assign(Entities, EntitiesData);
    //self.LAYERS = LAYERS;
    return Entities;
})();
// var Entities = EntitiesScope.Entities;
///<reference path="../../engine/graphics.js"/>
// const DustEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const DustEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 100;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    let gauss = (n) => Math.random() * (n <= 1 ? 1 : gauss(n - 1));
    var aspect, i;
    class Dust extends GRAPHICS.Emitter {
        constructor() {
            super('fussion_particle', PARTICLES, true);
            this.velocities_data = new Float32Array(PARTICLES * 2);
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = (Math.random() * 2.0 - 1.0) * GRAPHICS.getAspect(); //x
                this.data[i * vals + 1] = Math.random() * 2.0 - 1.0; //yy
                this.data[i * vals + 2] = gauss(3) * 0.2 + 0.005; //scale
                this.data[i * vals + 3] = 1.0; //r
                this.data[i * vals + 4] = 1.0; //g
                this.data[i * vals + 5] = 1.0; //b
                this.data[i * vals + 6] = 0.015 + 0.02 * Math.pow(1.0 - this.data[i * vals + 2] / 0.205, 2);
                //a (0.02)
                let angle = Math.random() * 2.0 * Math.PI;
                let rand_speed = (Math.random() * 0.4 + 0.8) * 0.1;
                this.velocities_data[i * 2 + 0] = Math.cos(angle) * rand_speed;
                this.velocities_data[i * 2 + 1] = Math.sin(angle) * rand_speed;
            }
        }
        destroy() {
            //@ts-ignore
            this.velocities_data = null; //free memory
            super.destroy();
        }
        update(delta, camera) {
            aspect = GRAPHICS.getAspect();
            //for(i=0, j=0; i<PARTICLES_COUNT; i++, j+=VALUES_PER_PARTICLE) {
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] += this.velocities_data[i * 2 + 0] * delta;
                this.data[i * vals + 1] += this.velocities_data[i * 2 + 1] * delta;
                if (this.data[i * vals + 0] > aspect + camera.x)
                    this.data[i * vals + 0] -= aspect * 2.0;
                if (this.data[i * vals + 0] < -aspect + camera.x)
                    this.data[i * vals + 0] += aspect * 2.0;
                if (this.data[i * vals + 1] > 1.0 + camera.y)
                    this.data[i * vals + 1] -= 2.0;
                if (this.data[i * vals + 1] < -1.0 + camera.y)
                    this.data[i * vals + 1] += 2.0;
            }
        }
    }
    Emitters.Dust = Dust;
})(Emitters || (Emitters = {})); //)();
///<reference path="../common/utils.ts"/>
///<reference path="entities.ts"/>
///<reference path="../engine/graphics.js"/>
///<reference path="../engine/assets.ts"/>
///<reference path="emitters/dust_emitter.ts"/>
// const Renderer = (function() {
var Renderer;
///<reference path="../common/utils.ts"/>
///<reference path="entities.ts"/>
///<reference path="../engine/graphics.js"/>
///<reference path="../engine/assets.ts"/>
///<reference path="emitters/dust_emitter.ts"/>
// const Renderer = (function() {
(function (Renderer) {
    const rect_data = {
        vertex: [-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1],
        faces: [0, 1, 2, 0, 2, 3]
    };
    var shadow_vector = new Vector.Vec2f();
    shadow_vector.set(-$$.getScreenSize().height, $$.getScreenSize().width).normalize();
    var windowHeight = $$.getScreenSize().height;
    function onResize(e) {
        //@ts-ignore
        var w = (e.srcElement || e.currentTarget).innerWidth, 
        //@ts-ignore
        h = (e.srcElement || e.currentTarget).innerHeight;
        GRAPHICS.onResize(w, h);
        shadow_vector.set(-h, w).normalize();
        windowHeight = h;
    }
    //performance matter variables
    var chunk_it, chunk_ref, e_i; //chunk iterator
    var current_instance = null; //stores lastly created instance
    class Class extends Entities {
        constructor(map) {
            $$.assert(current_instance === null, 'Only single instance of Renderer is allowed');
            //$$.assert(map instanceof GameMap, 'map argument must be instance of GameMap');
            if (ASSETS.loaded() !== true)
                throw new Error('Game assets are not loaded');
            const game_canvas = GRAPHICS.init();
            //@ts-ignore
            var rect = GRAPHICS.VBO.create(rect_data);
            super(rect);
            this.GUI = new InGameGUI();
            this.VBO_RECT = rect;
            this.map = map; //handle to map instance
            this.focused = null; //handle to focused player
            $$(window).on('resize', onResize);
            this.camera = new Vector.Vec3f(0, 0, 1);
            this._zoom = 1;
            // $$(window).on('wheel', e => this.zoom(e.wheelDelta / 120));
            //@ts-ignore
            game_canvas.on('wheel', (e) => this.zoom(e.wheelDelta / 120));
            let drag_data = { x: 0, y: 0, dragging: false };
            //@ts-ignore
            game_canvas.on('mousedown', e => {
                drag_data.x = e.clientX;
                drag_data.y = e.clientY;
                drag_data.dragging = true;
            });
            //@ts-ignore
            game_canvas.on('mouseup', e => drag_data.dragging = false);
            //@ts-ignore
            game_canvas.on('mouseout', e => drag_data.dragging = false);
            //@ts-ignore
            game_canvas.on('mousemove', e => {
                if (drag_data.dragging !== true)
                    return;
                if (this.focused === null) {
                    this.freeMoveCamera(e.clientX - drag_data.x, e.clientY - drag_data.y);
                }
                drag_data.x = e.clientX;
                drag_data.y = e.clientY;
            });
            //@ts-ignore
            this.main_fb = GRAPHICS.FRAMEBUFFERS.create({ fullscreen: true, linear: true });
            //@ts-ignore
            this.paint_fb = GRAPHICS.FRAMEBUFFERS.create({ fullscreen: true, linear: true });
            //@ts-ignore
            this.main_shader = GRAPHICS.SHADERS.create(ASSETS.getShaderSources('main_shader'));
            //@ts-ignore
            this.post_shader = GRAPHICS.SHADERS.create(ASSETS.getShaderSources('post_shader'));
            this.particles_shader =
                //@ts-ignore
                GRAPHICS.SHADERS.create(ASSETS.getShaderSources('particles_shader'));
            this.emitters = [];
            this.paint_emitters = [];
            this.dust_emitter = new Emitters.Dust();
            this.emitters.push(this.dust_emitter);
            this.ready = true;
            current_instance = this;
        }
        destroy() {
            current_instance = null;
            super.destroy(); //Entities class destructor
            //destroying objects
            [
                this.VBO_RECT, this.main_shader, this.post_shader,
                this.main_fb, this.paint_fb, ...this.emitters, ...this.paint_emitters
                //@ts-ignore
            ].forEach((obj) => {
                if (obj)
                    obj.destroy();
            });
            //this.chunks_handlers.forEach(ch => ch.destroy());
            $$(window).off('resize', onResize);
            GRAPHICS.destroy();
        }
        withinVisibleArea(x, y, offset) {
            var a = GRAPHICS.getAspect();
            //var cam_max = this.map.map_size - 1/this.camera.z;
            //var cam_max_a = this.map.map_size - GRAPHICS.getAspect()/this.camera.z;
            return x + offset > this.camera.x - a / this.camera.z &&
                x - offset < this.camera.x + a / this.camera.z &&
                y + offset > this.camera.y - 1.0 / this.camera.z &&
                y - offset < this.camera.y + 1.0 / this.camera.z;
        }
        focusOn(player) {
            this.focused = player;
        }
        zoom(factor) {
            if (this.focused === null) //free camera
                this._zoom = Math.min(1, Math.max(1 / this.map.map_size, this._zoom + factor * 0.1));
        }
        freeMoveCamera(pixX, pixY) {
            var factor = (this.map.map_size - 1) / 2.0 / this.camera.z;
            this.camera.x -= pixX / GRAPHICS.getHeight() * factor;
            this.camera.y += pixY / GRAPHICS.getHeight() * factor;
        }
        updateCamera(delta) {
            if (this._zoom !== this.camera.z) {
                this.camera.z += (this._zoom - this.camera.z) * delta * 6.0;
                // if(Math.abs(this.camera.z - this.zoom) < 0.001)
                if (Math.abs(this.camera.z - this._zoom) < 0.001)
                    this.camera.z = this._zoom;
            }
            if (this.focused !== null) {
                var dtx = this.focused.x - this.camera.x;
                var dty = this.focused.y - this.camera.y;
                //TODO - multiple by smoothing value instad of const
                this.camera.x += dtx * delta * 3.0 * this.camera.z;
                this.camera.y += dty * delta * 3.0 * this.camera.z;
            }
            //else
            ///	this.camera.set(this.focused.x, this.focused.y);//camera movement without smoothing
            //clamping to edges
            var a = GRAPHICS.getAspect();
            var cam_max = this.map.map_size - 1 / this.camera.z;
            var cam_max_a = this.map.map_size - a / this.camera.z;
            if (this.camera.y > cam_max)
                this.camera.y = cam_max;
            else if (this.camera.y < -cam_max)
                this.camera.y = -cam_max;
            if (this.camera.z * this.map.map_size > a) {
                if (this.camera.x > cam_max_a)
                    this.camera.x = cam_max_a;
                else if (this.camera.x < -cam_max_a)
                    this.camera.x = -cam_max_a;
            }
            else
                this.camera.x = 0;
        }
        prepareSceneFramebuffer() {
            GRAPHICS.clear(0, 0, 0);
            this.main_shader.bind();
            this.VBO_RECT.bind();
            //@ts-ignore
            GRAPHICS.TEXTURES.active(0);
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_int('sampler', 0);
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_float('aspect', GRAPHICS.getAspect());
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_vec3('camera', this.camera.buffer);
        }
        drawForegroundEntities() {
            super.drawLayer(Entities.LAYERS.FOREGROUND);
        }
        drawPaintLayerEntities() {
            super.drawLayer(Entities.LAYERS.PAINT);
        }
        drawParticles(list) {
            this.particles_shader.bind();
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_float('screen_height', windowHeight);
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_float('aspect', GRAPHICS.getAspect());
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_vec3('camera', this.camera.buffer);
            //console.log('emitters:', this.emitters.length);
            for (e_i = 0; e_i < list.length; e_i++) {
                if (list[e_i].expired === true) {
                    list[e_i].destroy();
                    list.splice(e_i, 1);
                    e_i--;
                }
                else if (list[e_i].visible === true)
                    list[e_i].draw();
            }
        }
        draw(delta) {
            if (!this.ready)
                return;
            if (delta <= 0.5) {
                if (this.focused !== null)
                    this.GUI.update(this.focused, delta);
                this.updateCamera(delta);
                this.dust_emitter.update(delta, this.camera);
            }
            //GRAPHICS.clear(255/256, 144/256, 156/256);
            this.main_fb.renderToTexture();
            this.prepareSceneFramebuffer();
            this.drawForegroundEntities();
            this.main_fb.stopRenderingToTexture();
            this.paint_fb.renderToTexture();
            this.prepareSceneFramebuffer();
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_vec4('color', Colors.WHITE.buffer);
            //for(chunk_it of this.map.chunks) {
            var cam_w = GRAPHICS.getAspect() / this.camera.z, cam_h = 1 / this.camera.z;
            for (chunk_it = 0; chunk_it < this.map.chunks.length; chunk_it++) {
                chunk_ref = this.map.chunks[chunk_it];
                //skipping chunks invisible to camera
                if (chunk_ref.matrix.x + chunk_ref.matrix.width < this.camera.x - cam_w ||
                    chunk_ref.matrix.x - chunk_ref.matrix.width > this.camera.x + cam_w ||
                    chunk_ref.matrix.y + chunk_ref.matrix.height < this.camera.y - cam_h ||
                    chunk_ref.matrix.y - chunk_ref.matrix.height > this.camera.y + cam_h) {
                    if (chunk_ref.webgl_texture != null)
                        continue;
                }
                if (chunk_ref.need_update) { //updating webgl texture
                    //console.log('updating chunk:', chunk_ref);
                    chunk_ref.need_update = false;
                    if (chunk_ref.webgl_texture == null) { //generate texture for the first time
                        chunk_ref.webgl_texture =
                            //@ts-ignore
                            GRAPHICS.TEXTURES.createFrom(chunk_ref.canvas, true /*, true*/);
                        //this.chunks_handlers.push( chunk_ref.webgl_texture );
                        //chunk_ref.buff = chunk_ref.ctx.getImageData(0, 0, 
                        //	chunk_ref.canvas.width, chunk_ref.canvas.height);
                        //chunk_ref.webgl_texture.createFramebuffer();//allows to read pixels
                    }
                    else {
                        //console.time('chunk update');
                        /*chunk_ref.buff = chunk_ref.ctx.getImageData(0, 0,
                            chunk_ref.canvas.width, chunk_ref.canvas.height);
                        chunk_ref.webgl_texture.update( chunk_ref.buff );*/
                        chunk_ref.webgl_texture.update(chunk_ref.canvas, true);
                        //console.timeEnd('chunk update');
                    }
                }
                chunk_ref.webgl_texture.bind();
                //@ts-ignore
                GRAPHICS.SHADERS.uniform_mat3('u_matrix', chunk_ref.matrix.buffer);
                this.VBO_RECT.draw();
            }
            this.drawPaintLayerEntities();
            this.drawParticles(this.paint_emitters);
            this.paint_fb.stopRenderingToTexture();
            this.post_shader.bind();
            this.VBO_RECT.bind();
            //drawing scene entities
            //@ts-ignore
            GRAPHICS.TEXTURES.active(0);
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_int('scene_pass', 0);
            this.main_fb.bindTexture();
            //drawing paint layer
            //@ts-ignore
            GRAPHICS.TEXTURES.active(1);
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_int('curves_pass', 1);
            this.paint_fb.bindTexture();
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_vec3('background_color', this.map.background.buffer);
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_vec2('offset', shadow_vector.buffer);
            //@ts-ignore
            GRAPHICS.SHADERS.uniform_float('shadow_length', 0.1 * this.camera.z);
            this.VBO_RECT.draw();
            this.drawParticles(this.emitters);
        }
        /*static get CURRENT_EMITTERS() {
            if(current_instance == null)
                return null;
            return current_instance.emitters;
        }*/
        static getCurrentInstance() {
            if (current_instance === null)
                throw "No current instance";
            return current_instance;
        }
        static addEmitter(emitter, paint_layer = false) {
            if (current_instance === null)
                throw "No Renderer instance";
            if (paint_layer === true)
                current_instance.paint_emitters.push(emitter);
            else
                current_instance.emitters.push(emitter);
            return emitter;
        }
    }
    Renderer.Class = Class;
    ;
})(Renderer || (Renderer = {})); //)();
///<reference path="../../engine/graphics.js"/>
//const HitEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
//const HitEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 50;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    const SCALE = 0.15;
    const SCALE_SPEED = (SCALE / 0.5); //0.5 seconds effect duration
    var i, j;
    class Hit extends GRAPHICS.Emitter {
        constructor() {
            super('fussion_particle', PARTICLES, false);
            this.index = 0;
            this.indexes = [];
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = 0; //
                this.data[i * vals + 1] = 0; //
                this.data[i * vals + 2] = 0; //scale
                this.data[i * vals + 3] = 1; //r
                this.data[i * vals + 4] = 1; //g
                this.data[i * vals + 5] = 1; //b
                this.data[i * vals + 6] = 1.0; //Math.random();
            }
        }
        destroy() {
            super.destroy();
        }
        hit(x, y, damage) {
            //discard hits beyond camera view
            if (Renderer.Class.getCurrentInstance().withinVisibleArea(x, y, 0.2) === false)
                return;
            this.data[this.index * vals + 0] = x;
            this.data[this.index * vals + 1] = y;
            if (damage) {
                this.data[this.index * vals + 3] = 1;
                this.data[this.index * vals + 4] = 0.75;
                this.data[this.index * vals + 5] = 0.65;
            }
            else {
                this.data[this.index * vals + 3] = 1;
                this.data[this.index * vals + 4] = 1;
                this.data[this.index * vals + 5] = 1;
            }
            this.indexes.push(this.index);
            this.index = (this.index + 1) % PARTICLES;
        }
        update(delta) {
            for (j = 0; j < this.indexes.length; j++) {
                i = this.indexes[j];
                if ((this.data[i * vals + 2] += delta * SCALE_SPEED) >= SCALE) {
                    this.data[i * vals + 2] = 0;
                    this.data[i * vals + 6] = 0;
                    this.indexes.splice(j, 1);
                    j--;
                }
                else
                    this.data[i * vals + 6] = 1.0 - this.data[i * vals + 2] / SCALE; //alpha
            }
        }
    }
    Emitters.Hit = Hit;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
//const ExplosionEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
//const ExplosionEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 4;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    //const SCALE = 0.15;
    const SPREAD_SPEED = 0.5, EXPLODING_TIME = 0.5, FADING_TIME = 0.9;
    var i; //, j: number;
    class Explosion extends GRAPHICS.Emitter {
        constructor(x, y, radius) {
            super('ring', PARTICLES, false);
            this.radius = radius;
            this.timer = 0.0;
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = x; //
                this.data[i * vals + 1] = y; //
                this.data[i * vals + 2] = 0; //
                this.data[i * vals + 3] = 1.0; //r
                this.data[i * vals + 4] = 0.37; //g
                this.data[i * vals + 5] = 0.37; //b
                this.data[i * vals + 6] = 1.0; //Math.random();
            }
        }
        destroy() {
            super.destroy();
        }
        update(delta) {
            this.timer += delta;
            for (i = 0; i < PARTICLES; i++) {
                if (this.data[i * vals + 2] != this.radius) {
                    if (i === 0)
                        this.data[i * vals + 2] += (SPREAD_SPEED + 1.0) * delta; //linear scale first particle
                    else if (i < (this.timer * 8.0) + 2)
                        this.data[i * vals + 2] +=
                            (SPREAD_SPEED + this.data[i * vals + 2] / this.radius) * delta;
                    if (this.data[i * vals + 2] > this.radius)
                        this.data[i * vals + 2] = this.radius;
                }
            }
            if (this.timer >= EXPLODING_TIME) {
                if (this.timer - EXPLODING_TIME < FADING_TIME) {
                    for (i = 0; i < PARTICLES; i++) {
                        this.data[i * vals + 6] = 1.0 - (this.timer - EXPLODING_TIME) / FADING_TIME;
                        if (this.data[i * vals + 6] < 0)
                            this.data[i * vals + 6] = 0;
                    }
                }
                else
                    this.expired = true;
            }
        }
    }
    Emitters.Explosion = Explosion;
    ;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
// const EnergyBlastEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const EnergyBlastEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 200;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    const LIFETIME = 0.8, FADING_TIME = 0.4, ALPHA = 0.3;
    var pow = (n) => n * n;
    var i, dst, fading_factor, scale_str;
    class EnergyBlast extends GRAPHICS.Emitter {
        constructor(x, y, radius, color) {
            super('fussion_particle', PARTICLES, true);
            // console.log(color.buffer);
            this.x = x;
            this.y = y;
            this.radius = radius * 0.75;
            this.timer = 0;
            this.velocities_data = new Float32Array(PARTICLES * 2);
            for (i = 0; i < PARTICLES; i++) {
                var rand = Math.random();
                this.data[i * vals + 0] = x; //x
                this.data[i * vals + 1] = y; //yy
                this.data[i * vals + 2] = rand * 0.08 + 0.03; //scale
                //225, 53, 61
                this.data[i * vals + 3] = color.buffer[0]; //r
                this.data[i * vals + 4] = color.buffer[1]; //g
                this.data[i * vals + 5] = color.buffer[2]; //b
                this.data[i * vals + 6] = ALPHA; //a
                var angle = Math.random() * 2.0 * Math.PI;
                var speed = (1.0 - rand) * 0.2 + (this.radius / (LIFETIME - FADING_TIME)) * 1.0;
                this.velocities_data[i * 2 + 0] = Math.cos(angle) * speed;
                this.velocities_data[i * 2 + 1] = Math.sin(angle) * speed;
            }
        }
        destroy() {
            //@ts-ignore
            this.velocities_data = null;
            super.destroy();
        }
        update(delta) {
            if ((this.timer += delta) >= LIFETIME) {
                this.expired = true;
                return;
            }
            fading_factor = (1.0 - ((this.timer - (LIFETIME - FADING_TIME)) / FADING_TIME));
            for (i = 1; i < PARTICLES; i++) { //NOTE - do not update first particle
                this.data[i * vals + 0] += this.velocities_data[i * 2 + 0] * delta;
                this.data[i * vals + 1] += this.velocities_data[i * 2 + 1] * delta;
                dst = pow(this.data[i * vals + 0] - this.x) + pow(this.data[i * vals + 1] - this.y);
                if (dst > this.radius * this.radius) {
                    scale_str = (this.data[i * vals + 2] - 0.03) / 0.08 * 0.4;
                    this.velocities_data[i * 2 + 0] *= 0.95 - scale_str;
                    this.velocities_data[i * 2 + 1] *= 0.95 - scale_str;
                    // this.velocities_data[i*2+0] = 0;
                    // this.velocities_data[i*2+1] = 0;
                    this.data[i * vals + 2] *= 0.95;
                }
                if (this.timer > LIFETIME - FADING_TIME)
                    this.data[i * vals + 6] = ALPHA * fading_factor;
            }
            //special case for first particle
            this.data[2] = this.radius * 2.0;
            if (this.timer > LIFETIME - FADING_TIME)
                this.data[6] = fading_factor * 0.5;
            else
                this.data[6] = this.timer / (LIFETIME - FADING_TIME) * 0.5;
        }
    }
    Emitters.EnergyBlast = EnergyBlast;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
// const ExperienceEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const ExperienceEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 20;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    const SCALE = 0.03, SPREAD_SPEED = 0.3, SPREAD_DURATION = 0.3;
    var i, dx, dy, ddx, ddy, atan;
    class Experience extends GRAPHICS.Emitter {
        constructor(from_object, to_object) {
            super('fussion_particle', PARTICLES, true);
            this.from = from_object;
            this.to = to_object;
            //this.timer = 0.0;
            this.done = false;
            this.angles = new Float32Array(PARTICLES);
            this.spread_factor = 1.0;
            this.moving_speed = 0.0;
            this.timer = 0;
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = this.from.x; //
                this.data[i * vals + 1] = this.from.y; //
                this.data[i * vals + 2] = SCALE * (Math.random() * 0.5 + 0.5); //
                this.angles[i] = Math.random() * Math.PI * 2.0;
                this.data[i * vals + 3] = 1.0; //r
                this.data[i * vals + 4] = 0.85; //g
                this.data[i * vals + 5] = 0.4; //b
                this.data[i * vals + 6] = 1.0; //Math.random();
            }
        }
        destroy() {
            //@ts-ignore
            this.angles = null;
            super.destroy();
        }
        update(delta) {
            this.spread_factor -= delta / SPREAD_DURATION;
            this.moving_speed += delta;
            this.timer += delta;
            for (i = 0; i < PARTICLES; i++) {
                ddx = this.to.x - this.data[i * vals + 0];
                ddy = this.to.y - this.data[i * vals + 1];
                atan = Math.atan2(ddy, ddx);
                dx = Math.cos(atan) * this.moving_speed;
                dy = Math.sin(atan) * this.moving_speed;
                if (this.spread_factor > 0) {
                    dx += Math.cos(this.angles[i]) * SPREAD_SPEED;
                    dy += Math.sin(this.angles[i]) * SPREAD_SPEED;
                }
                this.data[i * vals + 0] += dx * delta;
                this.data[i * vals + 1] += dy * delta;
                //close enough to target object
                if ((Math.abs(ddx) < 0.1 && Math.abs(ddy) < 0.1) || this.timer > 10)
                    this.done = true; //start vanishing stage
                if (this.done === true) {
                    if ((this.data[i * vals + 6] -= delta * 3.0) <= 0)
                        this.expired = true;
                }
            }
        }
    }
    Emitters.Experience = Experience;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
// const FussionEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const FussionEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 10;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    const SCALE = 0.04;
    var i;
    class Fussion extends GRAPHICS.Emitter {
        constructor() {
            super('fussion_particle', PARTICLES, true);
            this.setInitial();
        }
        destroy() {
            super.destroy();
        }
        setInitial() {
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = 1e9; //set initial position for "far out of camera"
                this.data[i * vals + 1] = 1e9;
                this.data[i * vals + 2] = SCALE * (i / PARTICLES); //gauss(3) * 0.2 + 0.005;//scale
                this.data[i * vals + 3] = 0.25; //r
                this.data[i * vals + 4] = 0.5; //g
                this.data[i * vals + 5] = 1.0; //b
                this.data[i * vals + 6] = 0.75;
            }
        }
        update(delta, x, y, angle, radius) {
            for (i = 0; i < PARTICLES; i++) {
                // this.data[i*vals + 6] -= delta * 0.075 / SCALE;
                if ((this.data[i * vals + 2] -= delta * 0.15) <= 0) {
                    this.data[i * vals + 2] += SCALE;
                    this.data[i * vals + 6] = 0.75;
                    this.data[i * vals + 0] = x + Math.cos(-angle - Math.PI / 2.0) * radius;
                    this.data[i * vals + 1] = y + Math.sin(-angle - Math.PI / 2.0) * radius;
                }
            }
        }
    }
    Emitters.Fussion = Fussion;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
// const InstantHealEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const InstantHealEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 40;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    const LIFETIME = 2, FADING_TIME = 0.75, ALPHA = 0.3;
    var i, is_fading, fading_alpha = ALPHA;
    class InstantHeal extends GRAPHICS.Emitter {
        constructor(x, y) {
            super('plus', PARTICLES, true);
            this.velocities_data = new Float32Array(PARTICLES * 2);
            this.timer = 0;
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = x; //
                this.data[i * vals + 1] = y; //
                this.data[i * vals + 2] = Math.random() * 0.01 + 0.01; //
                this.data[i * vals + 3] = 0.5; //r
                this.data[i * vals + 4] = 1.0; //g
                this.data[i * vals + 5] = 0.5; //b
                this.data[i * vals + 6] = ALPHA;
                var angle = Math.random() * 2.0 * Math.PI;
                var speed = Math.random() * 0.1 + 0.1;
                this.velocities_data[i * 2 + 0] = Math.cos(angle) * speed;
                this.velocities_data[i * 2 + 1] = Math.sin(angle) * speed;
            }
        }
        destroy() {
            //@ts-ignore
            this.velocities_data = null;
            super.destroy();
        }
        update(delta) {
            if ((this.timer += delta) > LIFETIME) {
                this.expired = true;
                return;
            }
            if ((is_fading = this.timer > LIFETIME - FADING_TIME) === true)
                fading_alpha = (1.0 - (this.timer - (LIFETIME - FADING_TIME)) / FADING_TIME) * ALPHA;
            for (i = 0; i < PARTICLES; i++) {
                // this.data[i*vals + 0];
                this.data[i * vals + 0] += this.velocities_data[i * 2 + 0] * delta;
                this.data[i * vals + 1] += this.velocities_data[i * 2 + 1] * delta;
                if (is_fading)
                    this.data[i * vals + 6] = fading_alpha;
            }
        }
    }
    Emitters.InstantHeal = InstantHeal;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
// const PlayerEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const PlayerEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 100;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    //NOTE - scale is Player.INITIAL_SCALE*0.8
    const SCALE = 0.05 * 0.8, /*SPEED = 0.1,*/ ALPHA = 0.2;
    const GROW_LENGTH = 0.9, SHRINK_LENGTH = 0.2; //range 0 to 1
    const PRECALCULATED_PROPORTION = 0.5 * (1.0 / (1.0 - GROW_LENGTH));
    var i, alpha_l;
    class Player extends GRAPHICS.Emitter {
        constructor(_player) {
            super('fussion_particle', PARTICLES, true);
            this.player = _player;
            //@ts-ignore
            let col = this.player.painter.color.buffer;
            this.alphas = new Float32Array(PARTICLES);
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = NaN; //(Math.random() * 2.0 - 1.0) * GRAPHICS.getAspect();//x
                this.data[i * vals + 1] = NaN; //Math.random() * 2.0 - 1.0;//yy
                this.data[i * vals + 2] = 0; //0.05 * Math.random() + 0.025;
                this.alphas[i] = i / PARTICLES;
                this.data[i * vals + 3] = col[0]; //r
                this.data[i * vals + 4] = col[1]; //g
                this.data[i * vals + 5] = col[2]; //b
                this.data[i * vals + 6] = ALPHA * (i / PARTICLES); //Math.random();
            }
        }
        destroy() {
            //@ts-ignore
            this.alphas = null;
            super.destroy();
        }
        update(delta) {
            for (i = 0; i < PARTICLES; i++) {
                //if( (this.data[i*vals + 6] -= delta * 0.1) <= 0 ) {
                if ((this.alphas[i] -= delta * 0.666) <= 0) {
                    this.alphas[i] += 1.0;
                    // this.data[i*vals + 6] = this.alphas[i] * ALPHA;
                    this.data[i * vals + 0] = this.player.x +
                        Math.cos(-this.player.rot - Math.PI / 2.0) * this.player.width;
                    this.data[i * vals + 1] = this.player.y +
                        Math.sin(-this.player.rot - Math.PI / 2.0) * this.player.width;
                    // this.data[i*vals + 0] = this.player.x;
                    // this.data[i*vals + 1] = this.player.y;
                }
                //alpha_l = this.data[i*vals + 6] / ALPHA;
                alpha_l = this.alphas[i];
                this.data[i * vals + 6] = alpha_l * ALPHA *
                    //@ts-ignore
                    this.player.movement.speed / this.player.movement.maxSpeed;
                this.data[i * vals + 2] = alpha_l > GROW_LENGTH ?
                    (SCALE * (0.5 + PRECALCULATED_PROPORTION * (1.0 - alpha_l))) :
                    (alpha_l < SHRINK_LENGTH ? (SCALE * (alpha_l / SHRINK_LENGTH)) :
                        SCALE);
            }
        }
    }
    Emitters.Player = Player;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
// const PoisoningEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const PoisoningEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 50;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    const SCALE = 0.08, ALPHA = 0.5, FADING_DURATION = 1, SPEED = 0.1;
    var i;
    class Poisoning extends GRAPHICS.Emitter {
        constructor(_parent) {
            super('cloud_particle', PARTICLES, true);
            this.timer = 0;
            this.parent = _parent;
            this.x_movements = new Float32Array(PARTICLES);
            this.speeds = new Float32Array(PARTICLES);
            this.resetTimer();
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = _parent.x;
                this.data[i * vals + 1] = _parent.y;
                this.data[i * vals + 2] = SCALE;
                this.x_movements[i] = (Math.random() * 2.0 - 1.0) * SPEED * 0.5;
                this.speeds[i] = (Math.random() * 0.5 + 0.5);
                this.data[i * vals + 3] = 0.4; //r
                this.data[i * vals + 4] = 1.0; //g
                this.data[i * vals + 5] = 0.2; //b
                this.data[i * vals + 6] = ALPHA * Math.random();
            }
        }
        destroy() {
            //@ts-ignore
            this.x_movements = null;
            //@ts-ignore
            this.speed = null;
            super.destroy();
        }
        resetTimer() {
            this.timer = Effects.TYPES.POISONING.duration + FADING_DURATION; //some offset for fading
        }
        update(delta) {
            if ((this.timer -= delta) <= 0) {
                this.expired = true;
                return;
            }
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] += this.x_movements[i] * delta;
                this.data[i * vals + 1] += this.speeds[i] * SPEED * delta;
                if ((this.data[i * vals + 6] -= delta * this.speeds[i] * 0.45) < 0) {
                    if (this.timer < FADING_DURATION)
                        this.data[i * vals + 6] = 0;
                    else {
                        this.data[i * vals + 6] += ALPHA;
                        this.data[i * vals + 0] = this.parent.x;
                        this.data[i * vals + 1] = this.parent.y;
                    }
                }
                this.data[i * vals + 2] = (1.0 - this.data[i * vals + 6] / ALPHA) * SCALE;
            }
        }
    }
    Emitters.Poisoning = Poisoning;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
// const ShadowEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const ShadowEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 1;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    //const SCALE = 0.15;
    const /*MAX_SIZE = 0.15,*/ EFFECT_DURATION = 15, VANISHING_DURATION = 10; //seconds
    const INITIAL_ALPHA = 0.3333;
    var i;
    class Shadow extends GRAPHICS.Emitter {
        constructor(x, y, radius) {
            super('fussion_particle', PARTICLES, false);
            //this.radius = radius;
            this.timer = 0.0;
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = x; //
                this.data[i * vals + 1] = y; //
                this.data[i * vals + 2] = radius; //
                this.data[i * vals + 3] = 0; //r
                this.data[i * vals + 4] = 0; //g
                this.data[i * vals + 5] = 0; //b
                this.data[i * vals + 6] = INITIAL_ALPHA; //Math.random();
            }
        }
        destroy() {
            super.destroy();
        }
        update(delta) {
            if ((this.timer += delta) > EFFECT_DURATION) {
                if (this.timer >= EFFECT_DURATION + VANISHING_DURATION) {
                    this.expired = true;
                    return;
                }
                for (i = 0; i < PARTICLES; i++) {
                    //update transparency
                    this.data[i * vals + 6] = INITIAL_ALPHA *
                        (1.0 - (this.timer - EFFECT_DURATION) / VANISHING_DURATION);
                }
            }
        }
    }
    Emitters.Shadow = Shadow;
})(Emitters || (Emitters = {})); //)();
///<reference path="../../engine/graphics.js"/>
// const SpawnerEmitter = (function() {
var Emitters;
///<reference path="../../engine/graphics.js"/>
// const SpawnerEmitter = (function() {
(function (Emitters) {
    const PARTICLES = 100;
    const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;
    //SCALE = EnemySpawner.SCALE
    const /*SCALE = 0.15, */ SPEED = 0.1, ALPHA = 0.15;
    //let gauss = n => Math.random() * (n <= 1 ? 1 : gauss(n-1));
    var i;
    class Spawner extends GRAPHICS.Emitter {
        constructor(green) {
            super('fussion_particle', PARTICLES, true);
            this.angles = new Float32Array(PARTICLES);
            for (i = 0; i < PARTICLES; i++) {
                this.data[i * vals + 0] = 1e8; //(Math.random() * 2.0 - 1.0) * GRAPHICS.getAspect();//x
                this.data[i * vals + 1] = 1e8; //Math.random() * 2.0 - 1.0;//yy
                this.data[i * vals + 2] = 0.05 * Math.random() + 0.025;
                this.angles[i] = Math.random() * Math.PI * 2.0;
                this.data[i * vals + 3] = green ? 0.5 : 1.0; //r
                this.data[i * vals + 4] = green ? 1.0 : 0.6; //g
                this.data[i * vals + 5] = green ? 0.3 : 0.4; //b
                this.data[i * vals + 6] = ALPHA * Math.random();
            }
        }
        destroy() {
            //@ts-ignore
            this.angles = null;
            super.destroy();
        }
        update(delta, x, y, vanishing) {
            for (i = 0; i < PARTICLES; i++) {
                if ((this.data[i * vals + 6] -= delta * 0.08) <= 0) {
                    if (vanishing)
                        this.data[i * vals + 6] = 0;
                    else {
                        this.data[i * vals + 6] += ALPHA;
                        this.data[i * vals + 0] = x;
                        this.data[i * vals + 1] = y;
                    }
                }
                else {
                    this.data[i * vals + 0] += Math.cos(this.angles[i]) * delta * SPEED;
                    this.data[i * vals + 1] += Math.sin(this.angles[i]) * delta * SPEED;
                }
            }
        }
    }
    Emitters.Spawner = Spawner;
})(Emitters || (Emitters = {})); //)();
///<reference path="entities.ts"/>
///<reference path="renderer.ts"/>
///<reference path="emitters/hit_emitter.ts"/>
///<reference path="emitters/explosion_emitter.ts"/>
///<reference path="emitters/energy_blast_emitter.ts"/>
///<reference path="emitters/experience_emitter.ts"/>
///<reference path="emitters/fussion_emitter.ts"/>
///<reference path="emitters/instant_heal_emitter.ts"/>
///<reference path="emitters/player_emitter.ts"/>
///<reference path="emitters/poisoning_emitter.ts"/>
///<reference path="emitters/shadow_emitter.ts"/>
///<reference path="emitters/spawner_emitter.ts"/>
///<reference path="../../include/game/game_core.ts"/>
///<reference path="../../include/game/maps.ts"/>
///<reference path="../../include/game/common/effects.ts"/>
///<reference path="../../include/game/common/skills.ts"/>
//const ClientGame = (function() {
var ClientGame;
///<reference path="entities.ts"/>
///<reference path="renderer.ts"/>
///<reference path="emitters/hit_emitter.ts"/>
///<reference path="emitters/explosion_emitter.ts"/>
///<reference path="emitters/energy_blast_emitter.ts"/>
///<reference path="emitters/experience_emitter.ts"/>
///<reference path="emitters/fussion_emitter.ts"/>
///<reference path="emitters/instant_heal_emitter.ts"/>
///<reference path="emitters/player_emitter.ts"/>
///<reference path="emitters/poisoning_emitter.ts"/>
///<reference path="emitters/shadow_emitter.ts"/>
///<reference path="emitters/spawner_emitter.ts"/>
///<reference path="../../include/game/game_core.ts"/>
///<reference path="../../include/game/maps.ts"/>
///<reference path="../../include/game/common/effects.ts"/>
///<reference path="../../include/game/common/skills.ts"/>
//const ClientGame = (function() {
(function (ClientGame) {
    function runLoop(self) {
        let last = 0, dt;
        //time measurments
        let timer, time_samples = [];
        let timer_log = $$.create('SPAN').html('0ms')
            .setStyle({ fontSize: '13px', fontFamily: 'RobotoLight' });
        $$(document.body).addChild($$.create('DIV').setStyle({
            position: 'fixed',
            left: '0px',
            bottom: '0px',
            background: '#0008',
            color: '#fff',
            fontSize: '13px',
            fontFamily: 'RobotoLight'
        }).html('updating + rendering:&nbsp;').addChild(timer_log));
        var step = function (time) {
            dt = time - last;
            last = time;
            if (self.running) {
                timer = performance.now();
                self.update(dt);
                time_samples.push(performance.now() - timer);
                if (time_samples.length >= 120) {
                    timer_log.setText((time_samples.reduce((a, b) => a + b) / time_samples.length)
                        .toFixed(2) + 'ms');
                    time_samples = [];
                }
                //@ts-ignore
                window.requestAnimFrame(step);
            }
        };
        step(0);
    }
    //TODO - p_h => Player type, e_h => Enemy type, b_h =>...
    var code, p_h, p_h2, s_h, p_i, e_i, b_i, i_i, e_h, b_h, obj_i, synch_array, rot_dt;
    class Game extends GameCore {
        constructor(map, onLoad) {
            super();
            this.running = false;
            this.destroyed = false;
            Network.assignCurrentGameHandle(this);
            var curr_room = Network.getCurrentRoom();
            if (curr_room === null)
                throw "Cannot start game not being in room";
            this.room = curr_room;
            this.renderer = new Renderer.Class(this);
            ASSETS.onload(() => {
                if (this.destroyed === true)
                    return;
                // this.renderer = new Renderer.Class(this);
                let result = super.loadMap(map);
                if (result !== true)
                    throw new Error('Cannot load map');
                //after map loaded
                try {
                    if (this.renderer === null /* || this.destroyed === true*/)
                        return;
                    // this.running = true;
                    // runLoop(this);
                    this.renderer.draw(0); //draw first frame before waiting for server response
                    onLoad(true);
                }
                catch (e) {
                    console.error('Cannot initialize renderer: ', e);
                    this.running = false;
                    onLoad(false);
                }
            });
            //this.bounceVec = new Vector.Vec2f();//buffer object for storing bounce results
            this.hit_effects = Renderer.Class.addEmitter(new Emitters.Hit());
            this.emitters = [this.hit_effects];
            setTimeout(() => {
                if (!ASSETS.loaded())
                    throw new Error('Waiting for assets to load timed out');
            }, 5000); //maximum waiting for assets to load
        }
        destroy() {
            super.destroy();
            this.destroyed = true;
            this.running = false;
            this.hit_effects.expired = true;
            //@ts-ignore
            this.hit_effects = null;
            //@ts-ignore
            this.emitters = null;
            if (this.renderer) {
                this.renderer.destroy();
                //@ts-ignore
                this.renderer = null;
            }
            if (this.onKeyDown)
                $$(window).off('keydown', this.onKeyDown);
            if (this.onKeyUp)
                $$(window).off('keyup', this.onKeyUp);
            Network.removeCurrentGameHandle();
        }
        onServerData(data, index = 0) {
            //index = index || 0;
            switch (data[index] | 0) {
                default:
                    throw new Error('Received incorrect server data');
                case NetworkCodes.OBJECT_SYNCHRONIZE: //object_id, sync_array_index, pos_x, pos_y, rot
                    synch_array = this.server_synchronized[data[index + 2]];
                    for (obj_i = 0; obj_i < synch_array.length; obj_i++) {
                        if (synch_array[obj_i].id === data[index + 1]) {
                            synch_array[obj_i].setPos(data[index + 3], data[index + 4]);
                            synch_array[obj_i].setRot(data[index + 5]);
                        }
                    }
                    index += 6;
                    break;
                case NetworkCodes.ON_PLAYER_SPAWNING_FINISH:
                    p_h = this.players[data[index + 1] | 0];
                    p_h.spawning = false;
                    p_h.painter.lastPos.set(p_h.x, p_h.y); //reset painter position
                    p_h.painter.active = true;
                    p_h.setPos(data[index + 2], data[index + 3], false);
                    index += 4;
                    break;
                case NetworkCodes.ON_PLAYER_EMOTICON: //player_index, emoticon_id
                    p_h = this.players[data[index + 1] | 0];
                    p_h.showEmoticon(InGameGUI.EMOTS[data[index + 2]].file_name);
                    index += 3;
                    break;
                case NetworkCodes.DRAW_PLAYER_LINE: //NOTE - use for update player position
                    p_h = this.players[data[index + 1] | 0];
                    super.color = p_h.painter.color.hex;
                    p_h.setPos(data[index + 2], p_h.y = data[index + 3]);
                    p_h.painter.lastPos.x = data[index + 4];
                    p_h.painter.lastPos.y = data[index + 5];
                    super.drawLine(p_h.x, p_h.y, p_h.painter.lastPos.x, p_h.painter.lastPos.y, p_h.painter.thickness);
                    index += 6;
                    break;
                case NetworkCodes.PLAYER_MOVEMENT_UPDATE:
                    //console.log(data);
                    p_h = this.players[data[index + 1] | 0];
                    //p_h.setPos(data[index + 2], data[index + 3]);
                    if (!(data[index + 3] & Movement.FLAGS.LEFT) && //if player doesn't turn
                        !(data[index + 3] & Movement.FLAGS.RIGHT)) {
                        p_h.setRot(data[index + 2]);
                        p_h.movement.smooth = true;
                    }
                    else {
                        rot_dt = data[index + 2] - p_h.rot;
                        if (rot_dt > Math.PI)
                            rot_dt -= Math.PI * 2.0;
                        else if (rot_dt < -Math.PI)
                            rot_dt += Math.PI * 2.0;
                        p_h.setRot(p_h.rot + rot_dt * 0.125);
                    }
                    if (p_h !== this.renderer.focused) //update only different user's player
                        p_h.movement.state = data[index + 3];
                    p_h.movement.speed = data[index + 4];
                    index += 5;
                    break;
                //player_index, player_x, player_y, player_hp, player_points
                case NetworkCodes.ON_PLAYER_ENEMY_PAINTER_COLLISION:
                    p_h = this.players[data[index + 1] | 0];
                    /*p_h.points -= GameCore.PARAMS.points_lose_for_enemy_painter_collision;
                    p_h.hp -= GameCore.PARAMS.enemy_painter_collision_damage;
                    if(p_h.hp < 0.01)
                        p_h.hp = 0.01;*/
                    p_h.hp = data[index + 4];
                    p_h.points = data[index + 5];
                    p_h.movement.speed = p_h.movement.maxSpeed;
                    this.renderer.GUI.onPlayerHpChange(data[index + 1], p_h.hp);
                    this.renderer.GUI.onPlayerPointsChange(data[index + 1], p_h.points);
                    this.explosionEffect(data[index + 2], data[index + 3], GameCore.PARAMS.small_explosion_radius);
                    index += 6;
                    break;
                case NetworkCodes.ON_PLAYER_BOUNCE:
                    p_h = this.players[data[index + 1] | 0];
                    p_h.setPos(data[index + 2], data[index + 3], false);
                    p_h.setRot(data[index + 4], true);
                    //p_h.timestamp = Date.now();
                    this.hit_effects.hit(p_h.x - data[index + 5] * p_h.width, p_h.y - data[index + 6] * p_h.height, false);
                    index += 7;
                    break;
                case NetworkCodes.ON_ENEMY_BOUNCE:
                    for (e_i = 0; e_i < this.enemies.length; e_i++) {
                        if (this.enemies[e_i].id === (data[index + 1] | 0)) {
                            e_h = this.enemies[e_i];
                            e_h.setPos(data[index + 2], data[index + 3]);
                            e_h.setRot(data[index + 4]);
                            e_h.timestamp = Date.now();
                            this.hit_effects.hit(e_h.x - data[index + 5] * e_h.width, e_h.y - data[index + 6] * e_h.height, false);
                            break;
                        }
                    }
                    index += 7;
                    break;
                case NetworkCodes.ON_BULLET_BOUNCE: //bullet_id, pos_x, pos_y, rot, hit_x, hit_y
                    for (b_i = 0; b_i < this.bullets.length; b_i++) {
                        if (this.bullets[b_i].id === (data[index + 1] | 0)) {
                            b_h = this.bullets[b_i];
                            b_h.setPos(data[index + 2], data[index + 3]);
                            b_h.setRot(data[index + 4]);
                            b_h.timestamp = Date.now();
                            this.hit_effects.hit(b_h.x - data[index + 5] * b_h.width, b_h.y - data[index + 6] * b_h.height, false);
                            break;
                        }
                    }
                    index += 7;
                    break;
                case NetworkCodes.ON_BULLET_HIT: //bullet_id, hit_x, hit_y
                    for (b_i = 0; b_i < this.bullets.length; b_i++) {
                        if (this.bullets[b_i].id === data[index + 1]) {
                            this.bullets[b_i].expired = true;
                            this.hit_effects.hit(data[index + 2], data[index + 3], true);
                            break;
                        }
                    }
                    index += 4;
                    break;
                case NetworkCodes.WAVE_INFO:
                    // this.renderer.GUI.addNotification('Wave ' + data[index + 1]);
                    this.renderer.GUI.addNotification('More enemies!');
                    index += 2;
                    break;
                case NetworkCodes.SPAWN_ENEMY: //enemy_class_index, object_id, pos_x, pos_y, rot
                    let enemy = new GameCore.ENEMY_CLASSES[data[index + 1]](); //new RocketEnemy();
                    enemy.id = data[index + 2];
                    enemy.setPos(data[index + 3], data[index + 4]);
                    enemy.setRot(data[index + 5]);
                    this.enemies.push(enemy); //add to GameMap objects
                    this.enemy_spawners.push(new EnemySpawner(enemy));
                    index += 6;
                    //console.log(enemy);
                    break;
                case NetworkCodes.SPAWN_ITEM: //item_id, item_type, item_x, item_y
                    let item = new Item(data[index + 2]);
                    item.id = data[index + 1];
                    item.setPos(data[index + 3], data[index + 4]);
                    item.timestamp = Date.now();
                    this.items.push(item);
                    index += 5;
                    break;
                //enemy_id, damage, player_index, new_enemy_hp, hit_x, hit_y
                case NetworkCodes.ON_ENEMY_ATTACKED:
                    for (e_i = 0; e_i < this.enemies.length; e_i++) {
                        if (this.enemies[e_i].id === (data[index + 1] | 0)) {
                            //player_index, damage, enemy_index, enemy_hp, hit_x, hit_y
                            this.onPlayerAttackedEnemy(data[index + 3], data[index + 2], e_i, data[index + 4], data[index + 5], data[index + 6]);
                            break;
                        }
                    }
                    index += 7;
                    break;
                //attacker_index, damage, victim_index, new_victim_hp, hit_x, hit_y
                case NetworkCodes.ON_PLAYER_ATTACKED: //player attacked by player
                    this.onPlayerAttackedPlayer(data[index + 1], data[index + 2], data[index + 3], data[index + 4], data[index + 5], data[index + 6]);
                    index += 7;
                    break;
                //player_index, number_of_bullets, bullet_id1, pos_x1, pos_y1, rot1, ...
                case NetworkCodes.ON_BULLET_SHOT: //NOTE receives data of multiple bullets
                    p_h = this.players[data[index + 1] | 0];
                    let number_of_bullets = data[index + 2];
                    for (let i = 0; i < number_of_bullets; i++) { //bullet_id, pos_x, pos_y, rot
                        let off = index + 3 + i * 4;
                        let bullet = new Bullet(data[off + 1], data[off + 2], data[off + 3], p_h);
                        bullet.id = data[off + 0];
                        this.bullets.push(bullet);
                    }
                    index += 3 + number_of_bullets * 4;
                    break;
                //player_index, bullet_id, pos_x, pos_y, rot
                case NetworkCodes.ON_BOUNCE_BULLET_SHOT: //NOTE - only single bullet data
                    p_h = this.players[data[index + 1] | 0];
                    let bullet = new Bullet(data[index + 3], data[index + 4], data[index + 5], p_h, true);
                    bullet.id = data[index + 2];
                    this.bullets.push(bullet);
                    index += 6;
                    break;
                case NetworkCodes.ON_BOMB_PLACED: //player_index, bomb_id, pos_x, pos_y
                    p_h = this.players[data[index + 1]];
                    let bomb = new Bomb(data[index + 3], data[index + 4], p_h);
                    bomb.id = data[index + 2];
                    bomb.timestamp = Date.now();
                    this.bombs.push(bomb);
                    index += 5;
                    break;
                case NetworkCodes.ON_BOMB_EXPLODED: //bomb_id, pos_x, pos_y
                    for (b_i = 0; b_i < this.bombs.length; b_i++) { //pre expiring bomb for server sync 
                        if (this.bombs[b_i].id === data[index + 1])
                            this.bombs[b_i].expired = true;
                    }
                    this.explosionEffect(data[index + 2], data[index + 3], GameCore.PARAMS.bomb_explosion_radius);
                    index += 4;
                    break;
                case NetworkCodes.ON_POISON_STAIN: //stain_index, pos_x, pos_y, size
                    super.drawStain(data[index + 1], data[index + 2], data[index + 3], data[index + 4] * GameCore.PARAMS.stain_shrink);
                    index += 5;
                    break;
                case NetworkCodes.ON_PLAYER_POISONED: //player_index
                    p_h = this.players[data[index + 1] | 0];
                    p_h.effects.active(Effects.TYPES.POISONING);
                    p_h.onPoisoned();
                    index += 2;
                    break;
                case NetworkCodes.ON_SHIELD_EFFECT: //player_index
                    p_h = this.players[data[index + 1] | 0];
                    p_h.effects.active(Effects.TYPES.SHIELD);
                    let shield = new Shield(p_h, Effects.TYPES.SHIELD.duration);
                    this.shields.push(shield);
                    index += 2;
                    break;
                case NetworkCodes.ON_IMMUNITY_EFFECT: //player_index
                    p_h = this.players[data[index + 1] | 0];
                    p_h.effects.active(Effects.TYPES.SPAWN_IMMUNITY);
                    let immunity_indicator = new Immunity(p_h, Effects.TYPES.SPAWN_IMMUNITY.duration);
                    this.immunities.push(immunity_indicator);
                    index += 2;
                    break;
                case NetworkCodes.ON_SPEED_EFFECT: //player_index
                    p_h = this.players[data[index + 1] | 0];
                    p_h.effects.active(Effects.TYPES.SPEED);
                    index += 2;
                    break;
                case NetworkCodes.ON_INSTANT_HEAL:
                    p_h = this.players[data[index + 1] | 0];
                    p_h.hp += GameCore.PARAMS.instant_heal_value;
                    this.renderer.GUI.onPlayerHpChange(data[index + 1] | 0, p_h.hp);
                    if (this.renderer.withinVisibleArea(p_h.x, p_h.y, 0.5) === true) {
                        //@ts-ignore
                        let heal_emitter = new Emitters.InstantHeal(p_h.x, p_h.y);
                        heal_emitter.timestamp = Date.now();
                        Renderer.Class.addEmitter(heal_emitter);
                        this.emitters.push(heal_emitter);
                    }
                    index += 2;
                    break;
                //pos_x, pos_y, player_color_index
                case NetworkCodes.ON_ENERGY_BLAST:
                    if (this.renderer.withinVisibleArea(data[index + 1], data[index + 2], GameCore.PARAMS.energy_blast_radius) === true) {
                        //@ts-ignore
                        let blast_emitter = new Emitters.EnergyBlast(data[index + 1], data[index + 2], GameCore.PARAMS.energy_blast_radius, Colors.PLAYERS_COLORS[data[index + 3]]);
                        blast_emitter.timestamp = Date.now();
                        Renderer.Class.addEmitter(blast_emitter);
                        this.emitters.push(blast_emitter);
                    }
                    //super.paintHole(data[index+1],data[index+2],GameCore.PARAMS.energy_blast_radius);
                    index += 4;
                    break;
                //enemy_id, player_index, x, y, player_rot, player_hp, player_points, bounce_x and y
                case NetworkCodes.ON_PLAYER_ENEMY_COLLISION:
                    for (e_i = 0; e_i < this.enemies.length; e_i++) {
                        if (this.enemies[e_i].id === (data[index + 1] | 0)) {
                            this.enemies[e_i].expired = true;
                            break;
                        }
                    }
                    p_h = this.players[data[index + 2] | 0];
                    p_h.setPos(data[index + 3], data[index + 4], false);
                    p_h.setRot(data[index + 5], true);
                    p_h.hp = data[index + 6];
                    p_h.points = data[index + 7];
                    //if(p_h.effects.isActive(Effects.SHIELD) === false && 
                    //	p_h.effects.isActive(Effects.SPAWN_IMMUNITY) === false) 
                    //{
                    //p_h.points -= GameCore.PARAMS.points_lose_for_enemy_collision;
                    this.renderer.GUI.onPlayerPointsChange(data[index + 2] | 0, p_h.points);
                    //}
                    this.renderer.GUI.onPlayerHpChange(data[index + 2] | 0, p_h.hp);
                    p_h.movement.speed = p_h.movement.maxSpeed;
                    var xx = p_h.x - data[index + 8] * p_h.width;
                    var yy = p_h.y - data[index + 9] * p_h.height;
                    this.explosionEffect(xx, yy, GameCore.PARAMS.explosion_radius);
                    index += 10;
                    break;
                case NetworkCodes.ON_BULLET_EXPLODE: //bullet_id, hit_x, hit_y
                    for (b_i = 0; b_i < this.bullets.length; b_i++) {
                        if (this.bullets[b_i].id === data[index + 1])
                            this.bullets[b_i].expired = true;
                    }
                    //console.log(data[index + 2], data[index + 3]);
                    super.paintHole(data[index + 2], data[index + 3], GameCore.PARAMS.bullet_explosion_radius);
                    this.hit_effects.hit(data[index + 2], data[index + 3], false);
                    index += 4;
                    break;
                case NetworkCodes.ON_PLAYER_COLLECT_ITEM: //item_id, item_type, player_index
                    for (i_i = 0; i_i < this.items.length; i_i++) {
                        if (this.items[i_i].id === (data[index + 1] | 0)) {
                            this.items[i_i].expired = true;
                            break;
                        }
                    }
                    p_h = this.players[data[index + 3] | 0];
                    switch (data[index + 2] | 0) { //switch item.type
                        case Item.TYPES.HEALTH:
                            {
                                p_h.hp += Item.HEALTH_VALUE;
                                this.renderer.GUI.onPlayerHpChange(data[index + 3] | 0, p_h.hp);
                                if (this.renderer.withinVisibleArea(p_h.x, p_h.y, 0.5) === true) {
                                    //@ts-ignore
                                    let heal_emitter = new Emitters.InstantHeal(p_h.x, p_h.y);
                                    heal_emitter.timestamp = Date.now();
                                    Renderer.Class.addEmitter(heal_emitter);
                                    this.emitters.push(heal_emitter);
                                }
                            }
                            break;
                        case Item.TYPES.ENERGY:
                            {
                                p_h.energy += Item.ENERGY_VALUE;
                                this.renderer.GUI.onPlayerEnergyChange(data[index + 3] | 0, p_h.energy);
                            }
                            break;
                        case Item.TYPES.SPEED:
                            {
                                p_h.effects.active(Effects.TYPES.SPEED);
                            }
                            break;
                    }
                    index += 4;
                    break;
                //player_index, spawning_duration death_pos_x and y, explosion_radius
                case NetworkCodes.ON_PLAYER_DEATH:
                    p_h = this.players[data[index + 1] | 0];
                    if (data[index + 5] > 0) { //explosion radius
                        this.explosionEffect(data[index + 3], data[index + 4], data[index + 5]);
                    }
                    super.respawnPlayer(p_h);
                    super.drawDeathMark(data[index + 3], data[index + 4], p_h.painter.color);
                    this.renderer.GUI.onPlayerHpChange(data[index + 1] | 0, p_h.hp);
                    this.renderer.GUI.onPlayerEnergyChange(data[index + 1] | 0, p_h.hp);
                    //player deaths count update
                    p_h.deaths++;
                    this.renderer.GUI.onPlayerDeath(data[index + 1] | 0);
                    if (p_h === this.renderer.focused)
                        this.renderer.GUI.addNotification('You died. Respawn in ' + data[index + 2] + ' seconds');
                    index += 6;
                    break;
                case NetworkCodes.ON_PLAYER_SKILL_USE: //player_index, skill_index, player_energy
                    p_h = this.players[data[index + 1] | 0];
                    p_h.energy = data[index + 3];
                    this.renderer.GUI.onPlayerEnergyChange(data[index + 1] | 0, p_h.energy);
                    s_h = p_h.skills[data[index + 2] | 0];
                    s_h.use();
                    if (p_h === this.renderer.focused) {
                        this.renderer.GUI.onSkillUsed(data[index + 2] | 0, s_h.data.cooldown);
                    }
                    index += 4;
                    break;
                case NetworkCodes.ON_PLAYER_SKILL_CANCEL: //player_index, skill_index
                    p_h = this.players[data[index + 1] | 0];
                    p_h.skills[data[index + 2] | 0].stopUsing();
                    if (p_h === this.renderer.focused) {
                        this.renderer.GUI.onSkillStopped(data[index + 2] | 0);
                    }
                    index += 3;
                    break;
            }
            if (index < data.length) { //if not everything was handled
                if (index === 0)
                    throw new Error('Index of server data not incremented after first iteration');
                this.onServerData(data, index); //looping for next data from server
            }
        }
        //@duration, round_delay - number (game duration in seconds), @init_data - array
        startGame(duration, round_delay, init_data) {
            console.log('Starting game (' + duration + '+' + round_delay + ' sec),', init_data);
            try {
                super.initPlayers(init_data);
                init_data.forEach((data, index) => {
                    this.renderer.GUI.assignPlayerPreview(index, data['ship_type'], data['color_id']);
                    var curr_room = Network.getCurrentUser();
                    if (curr_room === null)
                        throw "No room";
                    if (data['id'] === curr_room.id) {
                        this.renderer.focusOn(this.players[index]);
                        //filling skills bar
                        for (let s_i = 0; s_i < this.renderer.focused.skills.length; s_i++) {
                            let sk = this.renderer.focused.skills[s_i];
                            if (sk === null) {
                                for (let j = s_i + 1; j < this.renderer.focused.skills.length; j++) {
                                    if (this.renderer.focused.skills[j] !== null) {
                                        this.renderer.GUI.addChildEmptySkill(s_i);
                                        break;
                                    }
                                }
                            }
                            else
                                this.renderer.GUI.addChildSkill(sk.data.texture_name, s_i === 0 ? 'space' : s_i, sk.isContinous());
                        }
                    }
                });
                this.renderer.GUI.onEmoticonUse((index) => {
                    if (this.renderer.focused !== null && this.renderer.focused.spawning !== true)
                        this.tryEmoticonUse(index);
                });
                this.renderer.GUI.onSkillUse(((index) => {
                    if (this.renderer.focused !== null && this.renderer.focused.spawning !== true)
                        this.trySkillUse(index);
                }));
                this.renderer.GUI.onSkillStop(((index) => {
                    if (this.renderer.focused !== null && this.renderer.focused.spawning !== true)
                        this.trySkillStop(index);
                }));
            }
            catch (e) {
                console.error(e);
            }
            //references to class methods preserve for later events detach
            this.onKeyUp = (e) => this.onKey(e, false);
            this.onKeyDown = (e) => this.onKey(e, true);
            //assigning keyboard controls
            $$(window).on('keydown', this.onKeyDown);
            $$(window).on('keyup', this.onKeyUp);
            this.remaining_time = duration || 180;
            this.end_timestamp = Date.now() + (this.remaining_time * 1000);
            this.delay = round_delay || 0;
            this.delay_timestamp = Date.now() + (this.delay * 1000);
            //for(let i=0; i<100; i++)
            //	this.items.push( new Item(Item.randomType(), Math.random(), Math.random()) );
            //super.drawDeathMark( 0.5, 0, Colors.SAFE_AREA );
            this.running = true;
            runLoop(this);
        }
        end() {
            //try {
            this.renderer.GUI.updateTimer(0);
            this.running = false;
            //}
            //catch(e) {
            //	console.error(e);
            //TODO - fallback to lobby stage
            //}
        }
        onPlayerAttackedPlayer(attacker_i, damage, victim_i, victim_hp, hit_x, hit_y) {
            // if(this.room.gamemode !== RoomInfo.GAME_MODES.COMPETITION)
            // return;
            p_h = this.players[attacker_i];
            p_h2 = this.players[victim_i];
            p_h2.hp = victim_hp;
            this.renderer.GUI.onPlayerHpChange(victim_i, p_h2.hp);
            p_h.points += damage * GameCore.PARAMS.points_for_player_damage;
            this.renderer.GUI.onPlayerPointsChange(attacker_i, p_h.points);
            if (p_h2.isAlive() === false) {
                //this.onPlayerDeath(p_h2, GameCore.PARAMS.explosion_radius);
                this.onPlayerKilledPlayer(attacker_i, victim_i);
                //p_h.kills++;
                //p_h.points += GameCore.PARAMS.points_for_player_kill;
            }
        }
        onPlayerAttackedEnemy(player_i, damage, enemy_i, enemy_hp, hit_x, hit_y) {
            e_h = this.enemies[enemy_i];
            e_h.hp_bar.hp = enemy_hp; //set up to date enemy's hp value
            if (this.room.gamemode === GAME_MODES.COOPERATION) {
                this.players[player_i].points +=
                    damage * GameCore.PARAMS.points_for_enemy_damage;
                this.renderer.GUI.onPlayerPointsChange(player_i, this.players[player_i].points);
            }
            if (e_h.isAlive() === false) { //enemy died - exploson
                this.explosionEffect(hit_x, hit_y, GameCore.PARAMS.explosion_radius);
                this.onPlayerKilledEnemy(player_i, enemy_i);
                e_h.expired = true; //safe removing (after processed by other methods)
            }
            //else {//hitted but not died		
            //MOVED UP
            //}
        }
        //redundantion
        onPlayerKill(attacker_i, notification, gamemode, points_for_kill, victim_obj) {
            if (this.renderer.focused === this.players[attacker_i])
                this.renderer.GUI.addNotification(notification);
            if (this.room.gamemode === gamemode) {
                this.players[attacker_i].kills++;
                this.players[attacker_i].points += points_for_kill;
                this.renderer.GUI.onPlayerKill(attacker_i);
                this.renderer.GUI.onPlayerPointsChange(attacker_i, this.players[attacker_i].points);
                //@ts-ignore
                let exp_effect = new Emitters.Experience(victim_obj, this.players[attacker_i]);
                exp_effect.timestamp = new Date();
                Renderer.Class.addEmitter(exp_effect, false);
                this.emitters.push(exp_effect);
            }
        }
        onPlayerKilledPlayer(attacker_i, victim_i) {
            this.onPlayerKill(attacker_i, 'Player killed', GAME_MODES.COMPETITION, GameCore.PARAMS.points_for_player_kill, this.players[victim_i]);
            //if(this.room.gamemode === RoomInfo.GAME_MODES.COMPETITION) {
            //	this.players[attacker_i].kills++;
            //	this.players[attacker_i].points += GameCore.PARAMS.points_for_player_kill;
            //this.renderer.GUI.onPlayerKill( attacker_i );
            //this.renderer.GUI.onPlayerPointsChange(attacker_i, this.players[attacker_i].points);
            // let exp_effect = new ExperienceEmitter(
            // 	this.players[victim_i], this.players[attacker_i]);
            // exp_effect.timestamp = new Date();
            // Renderer.addEmitter( exp_effect, false );
            // this.emitters.push( exp_effect );
            //}
        }
        onPlayerKilledEnemy(player_i, enemy_i) {
            this.onPlayerKill(player_i, 'Enemy killed', GAME_MODES.COOPERATION, GameCore.PARAMS.points_for_enemy_kill, this.enemies[enemy_i]);
            //if(this.renderer.focused === this.players[player_i])
            //	this.renderer.GUI.addNotification('Enemy killed');
            //if(this.room.gamemode === RoomInfo.GAME_MODES.COOPERATION) {
            //	this.players[player_i].kills++;
            //	this.players[player_i].points += GameCore.PARAMS.points_for_enemy_kill;
            //this.renderer.GUI.onPlayerKill( player_i );
            //this.renderer.GUI.onPlayerPointsChange(player_i, this.players[player_i].points);
            // let exp_effect = new ExperienceEmitter(
            //		this.enemies[enemy_i], this.players[player_i]);
            // exp_effect.timestamp = new Date();
            // Renderer.addEmitter( exp_effect, false );
            // this.emitters.push( exp_effect );
            //}
        }
        trySkillUse(index) {
            var focused = this.renderer.focused;
            if (focused.skills[index] && focused.skills[index].canBeUsed(focused.energy)) {
                Network.sendByteBuffer(Uint8Array.from([NetworkCodes.PLAYER_SKILL_USE_REQUEST, Number(index)]));
            }
        }
        trySkillStop(index) {
            var focused = this.renderer.focused;
            if (focused.skills[index] && focused.skills[index].isContinous()) {
                Network.sendByteBuffer(Uint8Array.from([NetworkCodes.PLAYER_SKILL_STOP_REQUEST, Number(index)]));
            }
        }
        tryEmoticonUse(index) {
            Network.sendByteBuffer(Uint8Array.from([NetworkCodes.PLAYER_EMOTICON, index]));
        }
        onKey(event, pressed) {
            code = event.keyCode;
            var focused = this.renderer.focused;
            if (focused === null || focused.spawning === true)
                return;
            let preserved_state = focused.movement.state;
            if (code === 65 || code === 37) //left
                focused.movement.set(Movement.FLAGS.LEFT, pressed);
            else if (code === 68 || code === 39) //right
                focused.movement.set(Movement.FLAGS.RIGHT, pressed);
            else if (code === 87 || code === 38) //up
                focused.movement.set(Movement.FLAGS.UP, pressed);
            else if (code === 83 || code === 40) //down
                focused.movement.set(Movement.FLAGS.DOWN, pressed);
            else if (code === 32) { //space
                if (pressed)
                    this.trySkillUse(0);
                else //stop using skill (continous skills must be stopped by key release)
                    this.trySkillStop(0);
            }
            else if (code >= 49 && code < 49 + focused.skills.length - 1) { //normal skill
                if (pressed)
                    this.trySkillUse(code - 49 + 1); //key1 == 49 <==> (code-49+1) == 1
                else
                    this.trySkillStop(code - 49 + 1);
            }
            //any letter (emoticons use)
            if (pressed && code >= 65 && code <= 90) {
                InGameGUI.EMOTS.forEach((emot, index) => {
                    if (emot.key.charCodeAt(0) === code) {
                        this.tryEmoticonUse(index);
                    }
                });
            }
            //console.log(event, 'A'.charCodeAt(0));
            if (preserved_state != focused.movement.state) {
                focused.movement.smooth = false;
                Network.sendByteBuffer(Uint8Array.from([NetworkCodes.PLAYER_MOVEMENT, focused.movement.state]));
            }
        }
        explosionEffect(x, y, radius) {
            if (this.renderer.withinVisibleArea(x, y, radius) === true) {
                //@ts-ignore
                let explosion = new Emitters.Explosion(x, y, radius);
                explosion.timestamp = new Date();
                Renderer.Class.addEmitter(explosion, true);
                this.emitters.push(explosion);
            }
            //@ts-ignore
            let explosion_shadow = new Emitters.Shadow(x, y, radius);
            explosion_shadow.timestamp = new Date();
            Renderer.Class.addEmitter(explosion_shadow);
            super.paintHole(x, y, radius);
            this.emitters.push(explosion_shadow);
        }
        update(delta) {
            delta /= 1000.0;
            //console.log(delta);
            //@ts-ignore
            if (this.remaining_time >
                //@ts-ignore
                (this.remaining_time = (((this.end_timestamp - Date.now()) / 1000) | 0))) {
                if (this.remaining_time < 0)
                    this.remaining_time = 0;
                this.renderer.GUI.updateTimer(this.remaining_time);
            }
            if (this.delay !== 0) {
                //@ts-ignore
                if (this.delay >
                    //@ts-ignore
                    (this.delay = (((this.delay_timestamp - Date.now()) / 1000) | 0))) {
                    if (this.delay <= 0) {
                        this.delay = 0;
                        this.renderer.GUI.addNotification('GO!!!');
                    }
                    else
                        this.renderer.GUI.addNotification('Start in ' + this.delay + '...');
                }
            }
            if (delta > 0.5) { //lag occured or page refocused - update using timestamps
                //delta = 0.1;//1 / 10
                //console.log('update using timestamps');
                super.updateTimestamps(delta);
                var timestamp = Date.now();
                for (e_i = 0; e_i < this.emitters.length; e_i++) {
                    if (this.emitters[e_i].expired === true) {
                        this.emitters.splice(e_i, 1);
                        e_i--;
                    }
                    else if (this.emitters[e_i].timestamp) {
                        this.emitters[e_i]
                            .update((timestamp - this.emitters[e_i].timestamp) / 1000.0);
                        this.emitters[e_i].timestamp = 0;
                    }
                    else //object timestamp === 0
                        this.emitters[e_i].update(delta);
                }
            }
            else { //regular delta update
                super.update(delta);
                for (p_i = 0; p_i < this.players.length; p_i++) {
                    if (this.players[p_i].effects.isActive(Effects.TYPES.POISONING))
                        //@ts-ignore
                        this.renderer.GUI.onPlayerHpChange(p_i, this.players[p_i].hp);
                }
                //this.hit_effects.update(delta);
                for (e_i = 0; e_i < this.emitters.length; e_i++) {
                    if (this.emitters[e_i].expired === true) {
                        this.emitters.splice(e_i, 1);
                        e_i--;
                    }
                    else {
                        this.emitters[e_i].update(delta);
                        this.emitters[e_i].timestamp = 0;
                    }
                }
            }
            this.renderer.draw(delta);
            //debugging players sensors
            /*super.color = Colors.SAFE_AREA.hex;
            let p = this.players[0];
            if(p) {
                for(let coord of p.sensor.shape) {
                    var s = Math.sin(-p.rot);
                    var c = Math.cos(-p.rot);

                    var xx = (coord[0] * c - coord[1] * s) * p.width + p.x;
                    var yy = (coord[0] * s + coord[1] * c) * p.height + p.y;

                    super.drawCircle(xx, yy, 0.0025);
                }
            }*/
            //debugging enemies sensors
            /*super.color = Colors.SAFE_AREA.hex;
            for(let en of this.enemies) {
                for(let coord of en.sensor.shape) {
                    var s = Math.sin(-en.rot);
                    var c = Math.cos(-en.rot);

                    var xx = (coord[0] * c - coord[1] * s) * en.width + en.x;
                    var yy = (coord[0] * s + coord[1] * c) * en.height + en.y;

                    super.drawCircle(xx, yy, 0.0025);
                }
            }*/
        }
    }
    ClientGame.Game = Game;
    ;
})(ClientGame || (ClientGame = {})); //)();
///<reference path="../../include/game/game_result.ts"/>
///<reference path="../../include/game/common/skills.ts"/>
///<reference path="../../include/game/objects/player.ts"/>
///<reference path="../engine/network.ts"/>
///<reference path="../game_panel.ts"/>
///<reference path="../game/client_game.ts"/>
///<reference path="../game_panel.ts"/>
///<reference path="../game/client_game.ts"/>
///<reference path="../common/utils.ts"/>
///<reference path="lobby_stage.ts"/>
//Stage.GAME_STAGE = Stage.GAME_STAGE || (function() {
class GAME_STAGE extends Stage {
    constructor() {
        GamePanel;
        super();
        console.log('GAME_STAGE');
        this.panel = new GamePanel(); //extends Chat
        $$(document.body).setStyle({
            height: '100vh',
            width: '100vw',
            display: 'block',
            overflow: 'hidden'
        });
        $$(document.body).addChild(this.panel.createPanelWidget());
        try {
            //@ts-ignore
            Network.getCurrentRoom().users.forEach(u => this.panel.addUser(u));
            this.panel.onRoomJoined();
        }
        catch (e) {
            console.error(e);
        }
        // this.game = new ClientGame(Maps['Open Maze'], result => {
        var curr_room = Network.getCurrentRoom();
        if (curr_room !== null) {
            var map = Maps.getByName(curr_room.map);
            if (!map)
                throw new Error('Map not found: ' + curr_room.map);
            this.game = new ClientGame.Game(map, (result) => {
                if (result !== true)
                    throw new Error('Cannot start the game');
                //WHEN EVERYTHING LOADED CORRECTLY - SENDING CONFIMATION TO SERVER
                if (Network.amISitting())
                    Network.confirmGameStart();
            });
        }
    }
    destroy() {
        //@ts-ignore
        this.panel = null;
        if (this.game)
            this.game.destroy();
    }
    onServerConnected() { }
    onServerDisconnect() {
        this.change(LOBBY_STAGE);
    }
    onServerMessage(data) {
        //console.log(data);
        // console.log(Object.keys(NetworkCodes).find((key,i)=>i===data.type), data);
        try {
            switch (data['type']) {
                case NetworkCodes.ACCOUNT_DATA:
                    if (this.current_popup instanceof Popup.Account)
                        this.current_popup.onAccountData(data['data'], data['friends']);
                    break;
                case NetworkCodes.TRANSACTION_ERROR:
                    if (this.current_popup instanceof Popup.Account)
                        this.current_popup.onTransactionError(data['error_detail']);
                    break;
                case NetworkCodes.START_GAME_FAIL:
                    this.change(LOBBY_STAGE);
                    break;
                case NetworkCodes.LEAVE_ROOM_CONFIRM:
                    this.change(LOBBY_STAGE);
                    break;
                case NetworkCodes.USER_JOINED_ROOM:
                    this.panel.addUser(UserInfo.fromJSON(data['user_info']));
                    break;
                case NetworkCodes.USER_LEFT_ROOM:
                    this.panel.removeUserByID(data['user_id']);
                    break;
                case NetworkCodes.RECEIVE_CHAT_MESSAGE:
                    this.panel.onMessage(data);
                    break;
                case NetworkCodes.START_ROUND_COUNTDOWN:
                    if (this.game)
                        this.game.startGame(data['game_duration'], data['round_delay'], data['init_data']);
                    //showGameResults();//TEMP
                    break;
                case NetworkCodes.END_GAME:
                    if (this.game)
                        this.game.end();
                    GAME_STAGE.showGameResults(GameResult.fromJSON(data['result']).players_results);
                    break;
            }
        }
        catch (e) {
            console.error(e);
        }
    }
}
GAME_STAGE.makeRankWidget = (rank, rank_reward) => {
    let arrow = $$.create('SPAN').html(rank_reward >= 0 ? '&#9650;' : '&#9660;').setStyle({
        'margin': '0px 2px',
        'color': (rank_reward >= 0 ? '#9CCC65' : '#e57373')
    });
    let widget = $$.create('SPAN').addChild($$.create('B').setText(Math.round(rank))).addChild(arrow).addChild($$.create('SPAN').setText((rank_reward >= 0 ? '+' : '') + Math.round(rank_reward)));
    return widget;
};
GAME_STAGE.showGameResults = (results) => {
    let result_table = $$.create('TABLE').setClass('result_table').addChild(
    //table header
    $$.create('TR')
        .addChild($$.create('TH').setText('')) //position
        .addChild($$.create('TH').setText('Nick'))
        .addChild($$.create('TH').setText('Points'))
        .addChild($$.create('TH').setText('Kills'))
        .addChild($$.create('TH').setText('Deaths'))
        .addChild($$.create('TH').setText('EXP'))
        .addChild($$.create('TH').setText('Coins'))
        .addChild($$.create('TH').setText('Rank')));
    let results_node = $$.create('DIV').setClass('game_result_table').addChild($$.create('H6').setText('Game results')).addChild($$.create('DIV').setClass('result_body').addChild(result_table)).addChild($$.create('DIV').addClass('bottom_panel').addChild(//bottom panel for options
    $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
        .setText('EXIT').on('click', () => {
        try {
            Network.leaveRoom();
        }
        catch (e) {
            console.error('cannot send leave room request: ', e);
        }
    })));
    var current_user = Network.getCurrentUser();
    results.sort((a, b) => b['points'] - a['points']).forEach((res, index) => {
        // console.log(res);
        result_table.addChild($$.create('TR')
            .addChild($$.create('TD').setText(index + 1)) //position
            .addChild($$.create('TD').setText(res['nick'])) //nick
            .addChild($$.create('TD').setText(res['points'])) //points
            .addChild($$.create('TD').setText(res['kills'])) //kills
            .addChild($$.create('TD').setText(res['deaths'])) //deaths
            .addChild($$.create('TD').setText('+' + Math.floor(res['exp'] * 100) + '%')) //exp
            .addChild($$.create('TD').setText('+' + res['coins'])) //coins
            .addChild($$.create('TD').addChild(GAME_STAGE.makeRankWidget(res['rank'], res['rank_reward']) //rank
        )));
        //seems that current user leveled up
        if (current_user !== null &&
            current_user.id === res.user_id && current_user.custom_data['exp'] + res['exp'] >= 1.0) {
            let new_lvl = current_user.level + 1;
            HeaderNotifications.addNotification('Your level is now ' + new_lvl);
            //display if new level actualy unlocking something
            if (Object.keys(Skills).map(key => Skills[key]).some(s => s.lvl_required === new_lvl) ||
                Player.SHIP_LVL_REQUIREMENTS.some((lr) => lr === new_lvl)) {
                HeaderNotifications.addNotification('Check out shop for new items which you have unlocked');
            }
        }
    });
    //NOTE - popup_container class from popup.css
    $$(document.body).addChild($$.create('DIV').setClass('popup_container')
        .addChild(results_node));
    $$('CANVAS').setStyle({
        'filter': 'blur(10px)',
        'transition': 'filter 2s ease-in-out'
    });
    $$.expand($$('CANVAS'), $$.getScreenSize(), true);
};
//})();
///<reference path="utils.ts"/>
///<reference path="../engine/assets.ts"/>
///<reference path="../../include/game/common/skills.ts"/>
const WIDGETS_CREATOR = (function () {
    let STATES;
    (function (STATES) {
        STATES[STATES["NORMAL"] = 0] = "NORMAL";
        STATES[STATES["IN_USE"] = 1] = "IN_USE";
        STATES[STATES["TO_BUY"] = 2] = "TO_BUY";
        STATES[STATES["BOUGHT"] = 3] = "BOUGHT";
        STATES[STATES["LOCKED"] = 4] = "LOCKED";
    })(STATES || (STATES = {}));
    function createSkillDescriptionHTML(skill, show_requirements) {
        let temp = $$.create('DIV').addChild($$.create('DIV').setText(skill.name || '').setStyle({ 'fontWeight': 'bold' })).addChild($$.create('DIV').setText(skill.description || '---').setStyle({
            'text-align': 'justify',
            'text-justify': 'auto'
        })); //.setStyle({'display': 'none'});
        if (show_requirements === true) {
            temp.addChild($$.create('HR')).addChild($$.create('DIV').setStyle({ 'textAlign': 'left' }).setText((skill.lvl_required ? 'Required level: ' + skill.lvl_required : '') + '\n' +
                (skill.price ? 'Price: ' + skill.price + ' coins' : '')));
        }
        return temp;
    }
    var Self = {
        WIDGET_STATES: STATES,
        createDescription: function (element, target) {
            let description_visible = false;
            element.addClass('description').setStyle({ 'z-index': '99', 'display': 'none' });
            let openDescription = () => {
                if (description_visible === true)
                    return;
                description_visible = true;
                element.setStyle({ 'display': 'inline-block' });
            };
            let closeDescription = () => {
                if (description_visible === false)
                    return;
                description_visible = false;
                element.setStyle({ 'display': 'none' });
            };
            let moveDescription = (e) => {
                if (description_visible) {
                    element.style.transform = 'translate(' + (e.clientX + 10) + 'px, ' +
                        (e.clientY - 30) + 'px)';
                }
            };
            target.on('mouseenter', openDescription).on('mouseleave', closeDescription)
                .on('mousemove', moveDescription);
            $$(document.body).addChild(element);
            return element;
        },
        createShipWidget: function (type, self) {
            let ship_preview = $$.create('DIV').setClass('preview');
            let panel = $$.create('DIV').setClass('panel');
            //TODO -----
            //let description_html = $$.create('DIV').setText('TODO - ships descriptions');
            //let ship_description = createDescription(description_html, ship_preview);
            let widget = $$.create('DIV').setClass('ship_widget').addChild($$.create('LABEL').setText(Player.SHIP_NAMES[type])).addChild(ship_preview).addChild(panel);
            ASSETS.onload(() => ship_preview.addChild(ASSETS.getTexture(Player.entityName(type, Colors.PLAYERS_COLORS[2]))));
            let use_btn = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                .setText('USE').on('click', () => {
                Network.requestShipUse(type);
            });
            let buy_btn = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                .setText('BUY (' + Player.SHIP_COSTS[type] + ' COINS)').on('click', () => {
                let confirmation = $$.create('DIV').addChild($$.create('DIV').addClass('account_row')
                    .html('Are you sure you want to buy&nbsp;<b>' + Player.SHIP_NAMES[type] +
                    '</b>&nbsp;for ' + Player.SHIP_COSTS[type] + ' coins?')).addChild($$.create('DIV').addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
                    .setText('CONFIRM').on('click', () => Network.requestShipBuy(type))).addChild($$.create('SPAN').setStyle({ width: '50px' })).addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
                    .setText('RETURN').on('click', () => self.exitConfirmation())));
                self.showConfirmation(confirmation, 'Transaction');
            });
            return {
                domElement: widget,
                setState: function (state) {
                    widget.setClass('ship_widget'); //removes additional classes
                    switch (state) {
                        default: throw new Error('Incorrect state');
                        case STATES.NORMAL:
                            panel.html('').addChild(use_btn);
                            break;
                        case STATES.IN_USE:
                            widget.addClass('selected');
                            panel.setText('SELECTED');
                            break;
                        case STATES.TO_BUY:
                            panel.html('').addChild(buy_btn);
                            break;
                        case STATES.BOUGHT:
                            widget.addClass('selected');
                            panel.setText('BOUGHT');
                            break;
                        case STATES.LOCKED:
                            widget.addClass('locked');
                            panel.setText('Requires level ' + Player.SHIP_LVL_REQUIREMENTS[type]);
                            break;
                    }
                }
            };
        },
        createSkillWidget: function (skill, self, short_description = false) {
            $$.assert(ASSETS.loaded() === true, 'Assets not yet loaded');
            /*var skill: SkillsScope.SkillData = (typeof raw_skill === 'number') ?
                (<SkillsScope.SkillData>Object.keys(Skills).map(key => Skills[key])
                    .find((s: any) => typeof s === 'object' && s.id === skill)) :
                <SkillsScope.SkillData>raw_skill;*/
            let use_button = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                .setText('USE').on('click', () => Network.requestSkillUse(skill.id));
            let buy_button = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
                .setText('BUY').on('click', () => {
                try {
                    let confirmation = $$.create('DIV').addChild($$.create('DIV').addClass('account_row')
                        .html('Are you sure you want to buy&nbsp;<b>' + skill.name +
                        '</b>&nbsp;for ' + skill.price + ' coins?')).addChild($$.create('DIV').addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
                        .setText('CONFIRM').on('click', () => {
                        Network.requestSkillBuy(skill.id);
                    })).addChild($$.create('SPAN').setStyle({ width: '50px' })).addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
                        .setText('RETURN').on('click', () => self.exitConfirmation())));
                    self.showConfirmation(confirmation, 'Transaction');
                }
                catch (e) {
                    console.error(e);
                }
            });
            let panel = $$.create('DIV').setClass('panel');
            let skill_preview = $$.create('IMG')
                .setAttrib('src', ASSETS.getTexture(skill.texture_name).getAttrib('src'));
            /*let skill_description = */ this.createDescription(createSkillDescriptionHTML(skill, !short_description), skill_preview);
            let widget = $$.create('DIV').setClass('skill_widget').addChild(skill_preview)
                .addChild(panel); //.addChild( skill_description );
            return {
                domElement: widget,
                setState: function (state) {
                    widget.setClass('skill_widget');
                    switch (state) {
                        default: throw new Error('Incorrect state');
                        case STATES.NORMAL:
                            panel.html('').addChild(use_button);
                            break;
                        case STATES.IN_USE:
                            widget.addClass('selected');
                            panel.setText('SELECTED');
                            break;
                        case STATES.TO_BUY:
                            panel.html('').addChild(buy_button);
                            break;
                        case STATES.BOUGHT:
                            widget.addClass('selected');
                            panel.setText('BOUGHT');
                            break;
                        case STATES.LOCKED:
                            widget.addClass('locked');
                            break;
                    }
                }
            };
        },
        createSkillSlot: function (key_number) {
            let skill_preview = $$.create('IMG');
            let wearing_skill = null;
            let btn_left = $$.create('BUTTON').setStyle({
                'backgroundImage': 'url(../img/icons/arrow.png)',
                'width': '15px',
                'height': '15px',
                'transform': 'rotate(90deg)',
                'gridArea': 'left_btn'
            });
            let btn_throw = $$.create('BUTTON').setText('Put off').setStyle({
                'width': '100%',
                'height': '15px',
                'gridArea': 'throw'
            }).on('click', () => {
                if (wearing_skill !== null)
                    Network.requestSkillPutOff(wearing_skill.id);
            });
            let btn_right = $$.create('BUTTON').setStyle({
                'backgroundImage': 'url(../img/icons/arrow.png)',
                'width': '15px',
                'height': '15px',
                'transform': 'rotate(270deg)',
                'gridArea': 'right_btn'
            });
            let slot = $$.create('SPAN').addChild($$.create('DIV').setStyle({ 'gridArea': 'top' }).setText(key_number)).addChild([btn_left, skill_preview, btn_right]).addChild(btn_throw);
            slot.getChildren('BUTTON').setStyle({ 'display': 'none' });
            let skill_description = null;
            const skill_slot = {
                setSkill: function (skill) {
                    if ( /*skill === undefined || */skill === null) {
                        skill_slot.setEmpty();
                        return;
                    }
                    $$.assert(ASSETS.loaded() === true, 'Assets not yet loaded');
                    if (typeof skill === 'number') { //skill index
                        var found_skill = Object.keys(Skills)
                            .map(key => Skills[key]).find((s) => {
                            return typeof s === 'object' && s.id === skill;
                        });
                        if (found_skill !== undefined)
                            skill = found_skill;
                        // skill = Object.values(Skills).find(s => typeof s==='object' && s.id===skill);
                    }
                    wearing_skill = skill;
                    skill_preview.setAttrib('src', ASSETS.getTexture(skill.texture_name).getAttrib('src'));
                    slot.getChildren('BUTTON').setStyle({ 'display': 'initial' });
                    if (skill_description !== null)
                        skill_description.remove();
                    skill_description = Self.createDescription(createSkillDescriptionHTML(skill, false), skill_preview);
                },
                setEmpty: function () {
                    wearing_skill = null;
                    skill_preview.setAttrib('src', '');
                    slot.getChildren('BUTTON').setStyle({ 'display': 'none' });
                },
                isEmpty: function () {
                    return wearing_skill === null;
                },
                onLeft: function (callback) {
                    btn_left.onclick = callback;
                },
                onRight: function (callback) {
                    btn_right.onclick = callback;
                },
                allowDirections: function (left, right) {
                    if (wearing_skill === null)
                        return;
                    btn_left.setStyle({ 'display': left ? 'initial' : 'none' });
                    btn_right.setStyle({ 'display': right ? 'initial' : 'none' });
                },
                domElement: slot
            };
            return skill_slot;
        }
    };
    return Self;
})();
///<reference path="../common/utils.ts"/>
///<reference path="../common/common.ts"/>
///<reference path="../common/gui_widgets_creator.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="stage.ts"/>
// Stage.Popup.SETTINGS = Stage.Popup.SETTINGS || (function() {
var Popup;
///<reference path="../common/utils.ts"/>
///<reference path="../common/common.ts"/>
///<reference path="../common/gui_widgets_creator.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="stage.ts"/>
// Stage.Popup.SETTINGS = Stage.Popup.SETTINGS || (function() {
(function (Popup) {
    const CATEGORIES = ['GAME', 'MENU', 'CHAT'];
    function createSwitcherEntry(text, onSwitch, is_enabled) {
        return $$.create('DIV').addChild($$.create('LABEL').html(text)).addChild((switcher => {
            if (is_enabled)
                switcher.addClass('on');
            return switcher;
        })(COMMON.createSwitcher(onSwitch)));
    }
    class Settings extends Stage.Popup {
        constructor() {
            super();
            console.log('SETTINGS POPUP');
            this.popup_html = $$.create('DIV').addClass('popup_container').addChild(
            //popup window
            $$.create('DIV').addClass('popup').addClass('zoom_in').addChild(//title
            $$.create('DIV').addClass('header')
                .addChild($$.create('SPAN').setStyle({ margin: '0px 50px' }).html('SETTINGS'))
                .addChild($$.create('DIV').addClass('close_btn')
                .addClass('opacity_and_rot_transition')
                .setStyle({ 'float': 'right', marginLeft: '-50px' })
                .on('click', e => this.close()))).addChild($$.create('DIV').addClass('category')).addChild(//side menu
            (() => {
                let menu = $$.create('DIV').addClass('menu');
                CATEGORIES.forEach(cat => {
                    menu.addChild($$.create('DIV').setText(cat)
                        .on('click', () => this.setCategory(cat)));
                });
                return menu;
            })()).addChild(//content
            $$.create('DIV').addClass('main').html('content')) /*.addChild(//horizontal panel with buttons
                $$.create('DIV').addClass('panel').html('apply?')
            )*/).on('click', e => {
                if (e.srcElement === this.popup_html)
                    this.close();
            });
            $$(document.body).addChild(this.popup_html);
            this.setCategory(CATEGORIES[0]);
        }
        close() {
            SETTINGS.save();
            this.popup_html.remove();
            super.close();
        }
        setCategory(category) {
            var index = CATEGORIES.indexOf(category);
            if (index === -1)
                return;
            try {
                $$('.popup').getChildren('.category').setText(category);
                $$('.popup').getChildren('.menu > *').forEach((cat_entry) => {
                    if (cat_entry.innerHTML === category)
                        cat_entry.addClass('current');
                    else
                        cat_entry.removeClass('current');
                });
                //removing current content
                var content = $$('.popup').getChildren('.main');
                content.setText('');
                switch (category) {
                    case 'GAME':
                        this.showGameSettings(content);
                        break;
                    case 'MENU':
                        this.showMenuSettings(content);
                        break;
                    case 'CHAT':
                        this.showChatSettings(content);
                        break;
                }
            }
            catch (e) {
                console.error('cannot change settings category: ', e);
            }
        }
        showGameSettings(div) {
            var createRefreshToApplyHelper = function () {
                let helper = $$.create('SPAN').setClass('help_mark');
                var helper_html = $$.create('DIV').setText('In order to apply this option\'s change\nyou must refresh page.')
                    .setStyle({
                    'text-align': 'justify',
                    'text-justify': 'auto'
                });
                WIDGETS_CREATOR.createDescription(helper_html, helper);
                return helper;
            };
            div.addChild(createSwitcherEntry('Auto hide right panel:', (enabled) => {
                SETTINGS.game_panel_auto_hide = enabled;
            }, SETTINGS.game_panel_auto_hide === true)).addChild($$.create('DIV').addChild($$.create('LABEL').setText('Painter resolution:').addChild(createRefreshToApplyHelper())).addChild(COMMON.createOptionsList(['LOW', 'MEDIUM', 'HIGH'], opt => {
                SETTINGS.painter_resolution = opt;
            }).selectOption(SETTINGS.painter_resolution))).addChild($$.create('DIV').addChild($$.create('LABEL').setText('Shadows type:').addChild(createRefreshToApplyHelper())).addChild($$.create('DIV').setStyle({ 'padding': '7px 0px' }).addChild(COMMON.createOptionsList(['FLAT', 'LONG'], opt => {
                SETTINGS.shadows_type = opt;
            }).selectOption(SETTINGS.shadows_type))));
        }
        showMenuSettings(div) {
            div.addChild(createSwitcherEntry('Background effect:', (enabled) => {
                SETTINGS.menu_background_effect = enabled;
                DustBackground.reload();
            }, SETTINGS.menu_background_effect === true)).addChild(createSwitcherEntry('Click effect:', (enabled) => {
                SETTINGS.menu_click_effect = enabled;
                DustBackground.reload();
            }, SETTINGS.menu_click_effect === true));
        }
        showChatSettings(div) {
            div.addChild(createSwitcherEntry('Auto hide/show chat:', (enabled) => {
                SETTINGS.chat_auto_hide_show = enabled;
            }, SETTINGS.chat_auto_hide_show === true));
        }
    }
    Popup.Settings = Settings;
})(Popup || (Popup = {}));
//})();
///<reference path="../common/utils.ts"/>
///<reference path="../common/common.ts"/>
///<reference path="../common/gui_widgets_creator.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="../chat.ts"/>
///<reference path="stage.ts"/>
///<reference path="shop_popup.ts"/>
///<reference path="../engine/network.ts"/>
///<reference path="../../include/user_info.ts"/>
// Stage.Popup.ACCOUNT = Stage.Popup.ACCOUNT || (function() {
var Popup;
///<reference path="../common/utils.ts"/>
///<reference path="../common/common.ts"/>
///<reference path="../common/gui_widgets_creator.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="../chat.ts"/>
///<reference path="stage.ts"/>
///<reference path="shop_popup.ts"/>
///<reference path="../engine/network.ts"/>
///<reference path="../../include/user_info.ts"/>
// Stage.Popup.ACCOUNT = Stage.Popup.ACCOUNT || (function() {
(function (Popup) {
    function createFriendWidget(friend_data, self) {
        let friend_panel = $$.create('DIV').addChild($$.create('H2')
            .setText(friend_data.nick + (friend_data.online !== true ? ' (offline)' : ''))).addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
            .setText('Open Chat').setStyle({
            'margin': '15px 20px',
            'display': (friend_data.online === true ? 'inline-block' : 'none')
        }).on('click', () => {
            if (Chat.currentInstance === null)
                return;
            let new_bookmark = Chat.currentInstance.addBookmark(friend_data.id, friend_data.nick, false);
            if (new_bookmark)
                Chat.currentInstance.selectBookmark(new_bookmark);
            Chat.currentInstance.setHidden(false);
            // self.exitConfirmation();
            self.close();
        })).addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
            .setText('Delete').setStyle({ 'margin': '15px 20px' }).on('click', () => {
            //TODO - delete friend confirmation
            Network.sendRemoveFriendRequest(friend_data.id);
            self.exitConfirmation();
        })).addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
            .setText('Return').setStyle({ 'margin': '5px 10px' }).on('click', () => {
            self.exitConfirmation();
        })).setStyle({ 'textAlign': 'center', 'min-width': '350px' });
        let widget = $$.create('DIV').setText(friend_data.nick).on('click', () => {
            //if(friend_data.is_online === true)
            self.showConfirmation(friend_panel, 'Friend options');
        });
        if (friend_data.online !== true)
            widget.addClass('offline');
        return widget;
    }
    class Account extends Stage.Popup {
        constructor(prevent_auto_init) {
            super();
            this.slots = []; //skill slots
            this.popup_body = $$.create('DIV').setAttrib('id', 'popup_main')
                .addClass('account_popup_main');
            this.popup_html = $$.create('DIV').addClass('popup_container').addChild(
            //popup window
            $$.create('DIV').addClass('popup').addClass('zoom_in').addChild(//title
            $$.create('DIV').addClass('header')
                .addChild($$.create('SPAN').setStyle({ margin: '0px 50px' })
                .setText('User account').setAttrib('id', 'popup_title'))
                .addChild($$.create('DIV').addClass('close_btn')
                .addClass('opacity_and_rot_transition')
                .setStyle({ 'float': 'right', marginLeft: '-50px' })
                .on('click', e => this.close()))).addChild(this.popup_body).addChild($$.create('DIV').setAttrib('id', 'confirmation_main')
                .addClass('account_popup_main'))).on('click', e => {
                if (e.srcElement === this.popup_html)
                    this.close();
            });
            $$(document.body).addChild(this.popup_html);
            if (prevent_auto_init === true)
                return;
            console.log('ACCOUNT POPUP');
            this.ships_list = $$.create('DIV').addClass('ships_list');
            this.skills_list = $$.create('DIV').addClass('skills_list');
            this.skills_bar = $$.create('DIV').setClass('skills_slots');
            // this.slots = [];
            this.friends_list = $$.create('DIV').addClass('friends_list');
            let rank_info = $$.create('DIV').addClass('account_row').addChild($$.create('SPAN').setAttrib('id', 'account_rank').setStyle({
                'margin': 'auto'
            })).setStyle({ 'textAlign': 'center' });
            let level_info = $$.create('DIV').addClass('account_row').addChild(//level info
            $$.create('SPAN').setAttrib('id', 'account_level')).addChild(//exp widget
            $$.create('SPAN').setClass('exp_widget').addChild(//exp info
            $$.create('DIV').setAttrib('id', 'account_exp')));
            let coins_info = $$.create('DIV').addClass('account_row').addChild(//coins info
            $$.create('SPAN').setAttrib('id', 'account_coins').setStyle({
                'line-height': '35px',
                'marginRight': '15px'
            })) /*.addChild( $$.create('SPAN').setClass('coin_widget') )*/.addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_coin')
                .setText('SPEND').on('click', () => {
                this.close();
                let current_stage = Stage.getCurrent();
                if (current_stage)
                    current_stage.popup(Popup.Shop);
            }));
            this.popup_body.addChild($$.create('DIV').setStyle({ display: 'inline-block' })
                .addChild([rank_info, level_info, coins_info])).addChild([this.ships_list, this.skills_list, this.skills_bar, this.friends_list])
                .addChild(COMMON.createLoader().setAttrib('id', 'account_popup_loader'));
            Network.requestAccountData();
        }
        close() {
            this.popup_html.remove();
            super.close();
        }
        showConfirmation(node_obj, title = '') {
            this.popup_html.getChildren('#popup_main')
                .setStyle({ display: 'none' });
            this.popup_html.getChildren('#confirmation_main')
                .setStyle({ display: 'block' }).html('').addChild(node_obj);
            this.preserved_header = $$('#popup_title').innerHTML;
            $$('#popup_title').setText(title);
        }
        exitConfirmation() {
            this.popup_html.getChildren('#popup_main')
                .setStyle({ display: 'block' });
            this.popup_html.getChildren('#confirmation_main')
                .setStyle({ display: 'none' }).html('');
            $$('#popup_title').setText(this.preserved_header || '');
        }
        onTransactionError(error_detail) {
            //console.log('transaction error:', error_detail);
            var error_message = (code => {
                switch (error_detail) {
                    default:
                        return 'Unknown error';
                    case 'ship_already_avaible':
                        return 'You already have this ship bought';
                    case 'skill_already_avaible':
                        return 'You already have this skill bought';
                    case 'not_enough_coins':
                        return 'Not enough coins';
                    case 'insufficient_level':
                        return 'Level too low';
                }
                throw new Error('Impossible error');
            })(error_detail);
            this.showConfirmation($$.create('DIV').addChild($$.create('DIV').addClass('account_row')
                .html('Transaction failed:&nbsp;<b>' + error_message + '</b>')).addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
                .setText('RETURN').on('click', () => this.exitConfirmation())), 'Transaction');
        }
        fixAccountData(data) {
            data['level'] = data['level'] || 1;
            data['rank'] = data['rank'] || 0;
            data['coins'] = data['coins'] || 0;
            data['ship_type'] = data['ship_type'] || 0;
            data['skills'] = data['skills'] || [];
            data['avaible_ships'] = data['avaible_ships'] || [0];
            data['avaible_skills'] = data['avaible_skills'] || [];
        }
        onAccountData(data, friends) {
            this.exitConfirmation();
            try {
                $$('.description').forEach((d) => d.remove());
            }
            catch (e) { }
            console.log(data, friends);
            data = data || {};
            this.fixAccountData(data);
            let exp_percent = Math.floor((data['exp'] || 0) * 100) + '%';
            this.popup_html.getChildren('#account_exp')
                .setStyle({ width: exp_percent }).setText(exp_percent);
            this.popup_html.getChildren('#account_rank').setText('Rank: ' + Math.floor(data['rank']));
            this.popup_html.getChildren('#account_level').html('Level: <b>' + data['level'] + '</b>');
            this.popup_html.getChildren('#account_coins').html('Coins: <b>' + data['coins'] + '</b>');
            if (this.ships_list === undefined || this.skills_list === undefined)
                throw new Error('No ships_list or skills_list created');
            this.ships_list.html('');
            data['avaible_ships'].forEach(ship => {
                let ship_widget = WIDGETS_CREATOR.createShipWidget(ship, this);
                if (ship === data['ship_type'])
                    ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.IN_USE);
                else
                    ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.NORMAL);
                if (this.ships_list)
                    this.ships_list.addChild(ship_widget.domElement);
            });
            this.skills_list.html('');
            data['avaible_skills'].forEach(skill => {
                var found_skill = Skills.getById(skill);
                if (found_skill === undefined)
                    throw new Error('Cannot find skill with id: ' + skill);
                let skill_widget = WIDGETS_CREATOR.createSkillWidget(found_skill, this, true);
                if (data['skills'].indexOf(skill) === -1) {
                    skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.NORMAL);
                    if (this.skills_list)
                        this.skills_list.addChild(skill_widget.domElement);
                }
            });
            //this.skills_bar.html('');
            while (data['skills'].length > this.slots.length) {
                let slot = WIDGETS_CREATOR.createSkillSlot(this.slots.length + 1);
                this.slots.push(slot);
                if (this.skills_bar)
                    this.skills_bar.addChild(slot.domElement);
            }
            while (data['skills'].length < this.slots.length) {
                let slot = this.slots.pop();
                if (slot)
                    slot.domElement.remove();
            }
            //for(let i=0; i<this.slots.length; i++) {
            this.slots.forEach((slot, i) => {
                slot.setSkill(data['skills'][i]);
                let left = i > 0; // && data['skills'][i-1] === null;
                let right = i + 1 < this.slots.length; // && data['skills'][i+1] === null;
                slot.allowDirections(left, right);
                slot.onLeft(() => {
                    if (left !== true)
                        return;
                    //swapping
                    let temp = data['skills'][i - 1];
                    data['skills'][i - 1] = data['skills'][i];
                    data['skills'][i] = temp;
                    Network.requestSkillsOrder(data['skills']);
                });
                slot.onRight(() => {
                    if (right !== true)
                        return;
                    //swapping
                    let temp = data['skills'][i + 1];
                    data['skills'][i + 1] = data['skills'][i];
                    data['skills'][i] = temp;
                    Network.requestSkillsOrder(data['skills']);
                });
            });
            try {
                //@ts-ignore
                friends = friends || Network.getCurrentUser().friends;
                $$('#account_popup_loader').remove();
            }
            catch (e) { }
            ///////////////////////////////
            if (this.friends_list)
                this.friends_list.html('');
            friends.forEach(f => {
                if (this.friends_list)
                    this.friends_list.addChild(createFriendWidget({
                        id: f.id,
                        nick: COMMON.trimString(f['nick'], 12),
                        online: f['online'] === true
                    }, this));
            });
        }
    }
    Popup.Account = Account;
})(Popup || (Popup = {})); //)();
///<reference path="account_popup.ts"/>
///<reference path="../../include/game/objects/player.ts"/>
// Stage.Popup.SHOP = Stage.Popup.SHOP || (function() {
var Popup;
///<reference path="account_popup.ts"/>
///<reference path="../../include/game/objects/player.ts"/>
// Stage.Popup.SHOP = Stage.Popup.SHOP || (function() {
(function (Popup) {
    class Shop extends Popup.Account {
        constructor() {
            console.log('ACCOUNT POPUP');
            super(true);
            this.popup_html.getChildren('#popup_title').setText('SHOP');
            this.popup_body.addChild(//create account info
            $$.create('DIV').setStyle({ 'display': 'inline-block' }).addChild($$.create('SPAN').setAttrib('id', 'account_level')).addChild($$.create('BR') //separator
            ).addChild($$.create('SPAN').setAttrib('id', 'account_coins')));
            this.ships_list = $$.create('DIV').addClass('ships_list');
            this.skills_list = $$.create('DIV').addClass('skills_list');
            this.popup_body.addChild([this.ships_list, this.skills_list]);
            Network.requestAccountData();
        }
        close() {
            super.close();
        }
        onAccountData(data, friends) {
            super.exitConfirmation();
            try {
                $$('.description').forEach((d) => d.remove());
            }
            catch (e) { }
            data = data || {};
            super.fixAccountData(data);
            this.popup_html.getChildren('#account_level').html('Level: <b>' + data['level'] + '</b>');
            this.popup_html.getChildren('#account_coins').html('Coins: <b>' + data['coins'] + '</b>');
            if (this.ships_list === undefined || this.skills_list === undefined)
                throw new Error('No ships_list or skills_list');
            this.ships_list.html('');
            //@ts-ignore
            Object.keys(Player.TYPES).map(key => Player.TYPES[key]).forEach((type, i) => {
                let ship_widget = WIDGETS_CREATOR.createShipWidget(type, this);
                if (data['level'] >= Player.SHIP_LVL_REQUIREMENTS[i]) {
                    if (data['avaible_ships'].indexOf(i) !== -1) //avaible for user to use
                        ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.BOUGHT);
                    else //user must buy this ship before be able to use it
                        ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.TO_BUY);
                }
                else //ship not avaible for user level
                    ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.LOCKED);
                if (this.ships_list)
                    this.ships_list.addChild(ship_widget.domElement);
            });
            this.skills_list.html('');
            Object.keys(Skills).map(key => Skills[key])
                .filter(s => typeof s === 'object' && s.name).sort((a, b) => {
                return a.lvl_required -
                    b.lvl_required;
            }).forEach((skill) => {
                let skill_widget = WIDGETS_CREATOR.createSkillWidget(skill, this);
                // console.log('skill id:', skill.id);
                if (data['level'] >= skill.lvl_required) {
                    if (data['avaible_skills'].indexOf(skill.id) !== -1) //avaible for user to use
                        skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.BOUGHT);
                    else
                        skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.TO_BUY);
                }
                else
                    skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.LOCKED);
                if (this.skills_list)
                    this.skills_list.addChild(skill_widget.domElement);
            });
        }
    }
    Popup.Shop = Shop;
})(Popup || (Popup = {})); //)();
///<reference path="../common/utils.ts"/>
///<reference path="../chat.ts"/>
///<reference path="../rooms_list.ts"/>
///<reference path="../room_view.ts"/>
///<reference path="../header_notifications.ts"/>
///<reference path="stage.ts"/>
///<reference path="game_stage.ts"/>
///<reference path="settings_popup.ts"/>
///<reference path="shop_popup.ts"/>
///<reference path="account_popup.ts"/>
// LOBBY_STAGE = (function() {
// const TESTING = false;
class LOBBY_STAGE extends Stage {
    constructor() {
        super();
        this.chat = new Chat();
        this.rooms_list = new RoomsList();
        this.room_view = new RoomView();
        this.notifications = new HeaderNotifications();
        console.log('LOBBY_STAGE');
        // this.chat = new Chat();
        // this.rooms_list = new RoomsList();
        // this.room_view = new RoomView();
        // this.notifications = new HeaderNotifications();
        var body_grid = $$.create('DIV').addClass('lobby_stage'), header = $$.create('DIV').addClass('header'), content_l = $$.create('DIV').addClass('content_left'), content_r = $$.create('DIV').addClass('content_center'), chat_widget = this.chat.createWidget();
        $$(document.body).addChild(body_grid.addChild([header, content_l, content_r, chat_widget]));
        content_l.addChild(this.rooms_list.createWidget());
        content_r.addChild(this.room_view.createWidget());
        //header notifications
        header.addChild(this.notifications.widget);
        //account widget
        header.addChild($$.create('DIV').addClass('account_short_info').setStyle({
            // 'float': 'right',
            'padding': '0px 10px',
            'borderRight': '1px solid #556c78'
        }).addChild($$.create('IMG').setStyle({
            'display': 'inline-block',
            'height': '100%',
            'width': '30px',
            'opacity': '0.5'
        }).setAttrib('src', 'img/account.png')).addChild($$.create('DIV').addClass('account_nick').html('offline').setStyle({
            'display': 'inline-block',
            'height': 'auto',
            'padding': '0px 10px',
            'color': '#6e8f9e',
        })).on('click', () => {
            this.popup(Popup.Account);
        }));
        //shop button
        header.addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_coin')
            //@ts-ignore //TODO
            .setStyle({ margin: '0px 20px' }).on('click', () => this.popup(Popup.Shop))
            .html('SHOP'));
        //separator
        header.addChild($$.create('DIV').setStyle({
            'border-right': '1px solid rgb(85, 108, 120)',
            'height': '100%'
        }));
        //settings button
        header.addChild($$.create('BUTTON').addClass('iconic_button').addClass('iconic_settings')
            .setStyle({ margin: '0px 20px' }).on('click', () => this.popup(Popup.Settings))
            .html('SETTINGS'));
        //return button
        header.addChild($$.create('DIV').addClass('close_btn').addClass('opacity_and_rot_transition')
            .on('click', e => {
            // location.href = './'; //TODO - try this (typescript errorfree)
            //@ts-ignore
            location = "./"; //returns to home page
        }));
        this.refreshAccountInfo();
        super.enableBackgroundEffect();
        if (Network.getCurrentRoom() !== null) {
            this.room_view.onRoomJoined();
            this.chat.onRoomJoined();
        }
        if (Network.getCurrentUser() !== null)
            Network.subscribeLobby();
        // this.popup(<PopupDerived><unknown>Popup.Settings);
    }
    refreshAccountInfo() {
        let user = Network.getCurrentUser() || { nick: 'offline', level: '0' };
        $$('.account_short_info').getChildren('.account_nick').html(user.nick);
        $$('.account_short_info').getChildren('.account_level').html(user.level.toString());
    }
    onServerConnected() {
        this.rooms_list.clear();
        if (Network.getCurrentUser() !== null)
            Network.subscribeLobby();
        else
            setTimeout(() => this.onServerConnected(), 300);
    }
    onServerDisconnect() {
        this.rooms_list.clear();
        this.room_view.onRoomLeft();
        this.refreshAccountInfo();
    }
    onServerMessage(data) {
        // console.log(Object.keys(NetworkCodes).find((key,i)=>i===data.type), data);
        try {
            switch (data['type']) {
                case NetworkCodes.PLAYER_ACCOUNT: //account info update
                    this.refreshAccountInfo();
                    break;
                case NetworkCodes.ACCOUNT_DATA:
                    if (this.current_popup instanceof Popup.Account)
                        this.current_popup.onAccountData(data['data'], data['friends']);
                    this.refreshAccountInfo();
                    break;
                case NetworkCodes.TRANSACTION_ERROR:
                    if (this.current_popup instanceof Popup.Account)
                        this.current_popup.onTransactionError(data['error_detail']);
                    break;
                case NetworkCodes.SUBSCRIBE_LOBBY_CONFIRM:
                    var curr_user = Network.getCurrentUser();
                    if (curr_user !== null)
                        curr_user.lobby_subscriber = true;
                    data['rooms'].forEach((room_json) => {
                        this.rooms_list.pushRoomInfo(RoomInfo.fromJSON(room_json));
                    });
                    if (Network.getCurrentRoom() != null)
                        this.rooms_list.onRoomJoined();
                    if (LOBBY_STAGE.TESTING)
                        $$.runAsync(function () {
                            Network.createRoom();
                        }, 100);
                    break;
                case NetworkCodes.ADD_FRIEND_CONFIRM:
                    this.notifications.addNotification('User has been added to your friends list');
                    break;
                case NetworkCodes.REMOVE_FRIEND_CONFIRM:
                    this.notifications.addNotification('User has been removed from your friends list');
                    Network.requestAccountData(); //request updated data
                    break;
                case NetworkCodes.ON_ROOM_CREATED:
                    this.rooms_list.pushRoomInfo(RoomInfo.fromJSON(data['room_info']));
                    break;
                case NetworkCodes.ON_ROOM_REMOVED:
                    this.rooms_list.removeRoomByID(data['room_id']);
                    break;
                case NetworkCodes.ON_ROOM_UPDATE:
                    let updated_room = RoomInfo.fromJSON(data['room_info']);
                    this.rooms_list.onRoomUpdate(updated_room);
                    var curr_room = Network.getCurrentRoom();
                    if (Network.getCurrentRoom() instanceof RoomInfo && curr_room !== null &&
                        curr_room.id === updated_room.id) {
                        this.room_view.updateRoomInfo(Network.getCurrentRoom());
                    }
                    break;
                case NetworkCodes.JOIN_ROOM_CONFIRM:
                    this.room_view.onRoomJoined();
                    this.rooms_list.onRoomJoined();
                    this.chat.onRoomJoined();
                    if (LOBBY_STAGE.TESTING) {
                        $$.runAsync(Network.sendSitRequest, 100);
                        $$.runAsync(Network.sendReadyRequest, 200);
                    }
                    break;
                case NetworkCodes.CHANGE_ROOM_CONFIRM:
                    this.room_view.onRoomLeft();
                    this.rooms_list.onRoomLeft();
                    this.chat.onRoomLeft();
                    this.room_view.onRoomJoined();
                    this.rooms_list.onRoomJoined();
                    this.chat.onRoomJoined();
                    break;
                case NetworkCodes.CREATE_ROOM_CONFIRM:
                    //joining created room
                    Network.joinRoom(JSON.parse(data['room_info'])['id']);
                    break;
                case NetworkCodes.LEAVE_ROOM_CONFIRM:
                    this.room_view.onRoomLeft();
                    this.rooms_list.onRoomLeft();
                    this.chat.onRoomLeft();
                    break;
                case NetworkCodes.USER_JOINED_ROOM:
                    this.room_view.addUser(UserInfo.fromJSON(data['user_info']));
                    break;
                case NetworkCodes.USER_LEFT_ROOM:
                    this.room_view.removeUserByID(data['user_id']);
                    break;
                case NetworkCodes.ON_KICKED:
                    this.room_view.onRoomLeft();
                    this.rooms_list.onRoomLeft();
                    this.chat.onRoomLeft();
                    this.notifications.addNotification('You have been kicked from the room');
                    break;
                case NetworkCodes.RECEIVE_CHAT_MESSAGE:
                    this.chat.onMessage(data);
                    break;
                case NetworkCodes.START_GAME_COUNTDOWN:
                    this.room_view.onCountdown(data['remaining_time']);
                    break;
                case NetworkCodes.START_GAME:
                    this.change(GAME_STAGE);
                    break;
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}
LOBBY_STAGE.TESTING = true;
// })();
// console.log( (s=n=>n==2?2:n*s(--n))(6) );//mystery code
// ¯\_(ツ)_/¯
//[]+(-~(x=>x)-~(x=>x))+(-~(x=>x)-~(x=>x))
///<reference path="common/utils.ts"/>
///<reference path="stages/stage.ts"/>
///<reference path="stages/lobby_stage.ts"/>
$$.load(function () {
    var currentStage = null;
    var changeStage = (StageClass) => {
        $$.assert(typeof StageClass === 'function', 'Argument must be typeof function');
        if (currentStage != null) {
            currentStage.destroy();
        }
        currentStage = new StageClass();
        $$.assert(currentStage instanceof Stage, 'StageClass must be a derived class of Stage');
        currentStage.onchange(NewStageClass => {
            changeStage(NewStageClass);
        });
    };
    try {
        //TODO - try to remove unknown
        changeStage(LOBBY_STAGE); //initial stage LOBBY_STAGE
    }
    catch (e) {
        console.error(e);
    }
});
