"use strict";
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
