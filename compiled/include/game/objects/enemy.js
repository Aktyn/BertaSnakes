"use strict";
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
