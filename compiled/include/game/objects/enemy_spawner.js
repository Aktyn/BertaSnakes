"use strict";
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
