"use strict";
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
