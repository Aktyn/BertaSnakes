"use strict";
var Painter = (function (Vector) {
    var DEFAULT_THICKNESS = 0.015;
    return /** @class */ (function () {
        function class_1(color, thickness) {
            this.lastPos = new Vector.Vec2f(0, 0); //{x: 0, y: 0};//for painting purpouses
            this.color = color;
            this.thickness = thickness || DEFAULT_THICKNESS;
            this.active = false;
        }
        return class_1;
    }());
})(typeof Vector !== 'undefined' ? Vector : require('./../../utils/vector.js'));
try { //export for NodeJS
    module.exports = Painter;
}
catch (e) { }
