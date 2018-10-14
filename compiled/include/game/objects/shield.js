"use strict";
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
