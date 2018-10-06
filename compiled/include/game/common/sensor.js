"use strict";
var Sensor = (function () {
    var SHAPES = {
        TRIANGLE: [[0.0, 1.0], [-1.0, -1.0], [1.0, -1.0], [-0.5, 0.0], [0.5, 0.0]],
        SQUARE: [[0.0, 1.0], [-1.0, -1.0], [1.0, -1.0], [-0.5, 0.0], [0.5, 0.0]],
        PENTAGON: [
            [0.0, 1.0], [-0.5, 1.0], [0.5, 1.0], [-0.5, -1.0], [0.5, -1.0], [-1.0, -0.5], [1.0, -0.5]
        ],
        ROCKET: [[0.0, 1.0], [-1.0, -0.9], [1.0, -0.9], [-0.5, 0.5], [0.5, 0.5]],
        CIRCLE: new Array(8).fill(0).map(function (_, index, arr) {
            var a = Math.PI * 2.0 * (index / arr.length) + Math.PI / 2;
            return [Math.cos(a), Math.sin(a)].map(function (v) { return Math.abs(v) < 1e-10 ? 0 : v; });
        }),
        BULLET: [[0.0, 1.0], [0.0, -1.0], [-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]]
    };
    return /** @class */ (function () {
        function class_1(shape) {
            this.shape = shape || SHAPES.TRIANGLE; //default shape
        }
        Object.defineProperty(class_1, "SHAPES", {
            get: function () {
                return SHAPES;
            },
            enumerable: true,
            configurable: true
        });
        return class_1;
    }());
})();
try { //export for NodeJS
    module.exports = Sensor;
}
catch (e) { }
