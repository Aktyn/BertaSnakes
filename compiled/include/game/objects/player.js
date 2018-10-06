"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Player = (function (Object2D, Movement, Sensor, Painter, Colors, Skills, Effects) {
    var TYPES = {
        TRIANGLE: 0,
        SQUARE: 1,
        PENTAGON: 2
    };
    var SHIP_NAMES = ['Triangle ship', 'Square ship', 'Pentagon ship'];
    var SHIP_LVL_REQUIREMENTS = [1, 3, 6]; //level required to be able to use ship
    var SHIP_COSTS = [0, 500, 3000]; //coins required to buy ship
    //array of sensor shapes with order corresponding to player TYPES
    var PLAYER_SENSOR_SHAPES = [
        Sensor.SHAPES.TRIANGLE, Sensor.SHAPES.SQUARE, Sensor.SHAPES.PENTAGON
    ];
    var PLAYER_BASIC_SKILLS = [Skills.SHOOT1, Skills.SHOOT2, Skills.SHOOT3];
    //initial parameters
    var SCALE = 0.05, THICKNESS = 0.015, MAX_SPEED = 0.4, TURN_SPEED = Math.PI;
    var POISON_STRENGTH = 0.1;
    var s_i, em_i;
    //(typeof module === 'undefined' ? Object2DSmooth : Object2D)
    var ExtendClass = (typeof module === 'undefined' ? Object2DSmooth : Object2D);
    return /** @class */ (function (_super) {
        __extends(class_1, _super);
        //@type - value from TYPES object, @skills - array of skills indexes
        function class_1(type, skills, color) {
            var _this = _super.call(this) || this;
            _super.prototype.setScale.call(_this, SCALE, SCALE);
            _this.user_id = 0; //server-side use
            _this.nick = '';
            _this.level = 0;
            _this.rank = 0;
            _this.movement = new Movement();
            _this.movement.setOptions({
                maxSpeed: MAX_SPEED,
                turnSpeed: TURN_SPEED
            });
            _this.type = type;
            _this._hp = 1;
            _this._energy = 1;
            //list of skills avaible by player (skills bar)
            _this.skills = [PLAYER_BASIC_SKILLS[type].create()]; //basic skill (space)
            try {
                skills.forEach(function (skill_id, index) {
                    if (skill_id !== null) {
                        _this.skills.push(Skills.getById(skill_id).create());
                    }
                    else
                        _this.skills.push(null);
                });
            }
            catch (e) {
                console.error(e);
            }
            _this.effects = new Effects(_this);
            _this.emoticons = []; //client-side only
            _this._points = 0;
            _this.kills = 0;
            _this.deaths = 0;
            _this.sensor = new Sensor(PLAYER_SENSOR_SHAPES[type]);
            _this.painter = new Painter(color, THICKNESS);
            if (typeof Entities !== 'undefined') {
                _this.entity_name = Player.entityName(type, color); //clientside only
                Entities.addObject(Entities[_this.entity_name].id, _this);
            }
            if (typeof Renderer !== 'undefined' && typeof PlayerEmitter !== 'undefined') { //client side
                _this.emitter = Renderer.addEmitter(new PlayerEmitter(_this));
                _this.poisoning_emitter = null;
            }
            return _this;
        }
        class_1.prototype.destroy = function () {
            if (typeof Entities !== 'undefined') {
                console.log('removing player from entities');
                Entities.removeObject(Entities[this.entity_name].id, this);
            }
            if (this.emitter)
                this.emitter.expired = true;
            if (this.poisoning_emitter)
                this.poisoning_emitter.expired = true;
        };
        class_1.prototype.onPoisoned = function () {
            if (this.poisoning_emitter === null)
                this.poisoning_emitter = Renderer.addEmitter(new PoisoningEmitter(this));
            else
                this.poisoning_emitter.resetTimer();
        };
        //clientside only function
        class_1.prototype.showEmoticon = function (name) {
            for (em_i = 0; em_i < this.emoticons.length; em_i++)
                this.emoticons[em_i].endEffect();
            this.emoticons.push(new Emoticon(name, this));
        };
        class_1.prototype.update = function (delta) {
            this.movement.applyMove(this, delta);
            for (s_i = 0; s_i < this.skills.length; s_i++) {
                if (this.skills[s_i] !== null)
                    this.skills[s_i].update(delta);
            }
            this.effects.update(delta);
            if (this.effects.isActive(Effects.POISONING))
                this.hp -= POISON_STRENGTH * delta;
            _super.prototype.update.call(this, delta);
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
        };
        class_1.prototype.isAlive = function () {
            return this._hp >= 0.005;
        };
        Object.defineProperty(class_1.prototype, "hp", {
            get: function () {
                return this._hp;
            },
            set: function (value) {
                //if hp dropped but SHIELD effect is active
                if (value < this._hp &&
                    (this.effects.isActive(Effects.SHIELD) ||
                        this.effects.isActive(Effects.SPAWN_IMMUNITY))) {
                    return; //do not update hp
                }
                this._hp = Math.min(1, Math.max(0, value));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "energy", {
            get: function () {
                return this._energy;
            },
            set: function (value) {
                this._energy = Math.min(1, Math.max(0, value));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "points", {
            get: function () {
                return this._points;
            },
            set: function (value) {
                this._points = Math.round(Math.max(0, value));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1, "INITIAL_SCALE", {
            get: function () {
                return SCALE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1, "TYPES", {
            get: function () {
                return TYPES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1, "SHIP_NAMES", {
            get: function () {
                return SHIP_NAMES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1, "SHIP_COSTS", {
            get: function () {
                return SHIP_COSTS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1, "SHIP_LVL_REQUIREMENTS", {
            get: function () {
                return SHIP_LVL_REQUIREMENTS;
            },
            enumerable: true,
            configurable: true
        });
        class_1.entityName = function (type_i, color) {
            return 'PLAYER_' + type_i + '_' + Colors.PLAYERS_COLORS.indexOf(color);
        };
        return class_1;
    }(ExtendClass));
})(typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js'), typeof Movement !== 'undefined' ? Movement : require('./../common/movement.js'), typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor.js'), typeof Painter !== 'undefined' ? Painter : require('./../common/painter.js'), typeof Colors !== 'undefined' ? Colors : require('./../common/colors.js'), typeof Skills !== 'undefined' ? Skills : require('./../common/skills.js'), typeof Effects !== 'undefined' ? Effects : require('./../common/effects.js'));
try { //export for NodeJS
    module.exports = Player;
}
catch (e) { }
