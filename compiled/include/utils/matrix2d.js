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
var Matrix2D = (function (Vector) {
    return /** @class */ (function (_super) {
        __extends(class_1, _super);
        function class_1() {
            var _this = _super.call(this, Vector.TYPE.FLOAT, 9) || this;
            _this.setIdentity();
            return _this;
        }
        // SETTERS
        class_1.prototype.setIdentity = function () {
            _super.prototype.set.call(this, 1, 0, 0, 0, 1, 0, 0, 0, 1);
            this._rot = 0;
            this._width = 1; //width
            this._height = 1; //height
            return this;
        };
        class_1.prototype.setPos = function (x, y) {
            this._buffer[6] = x;
            this._buffer[7] = y;
            return this;
        };
        class_1.prototype.move = function (x, y) {
            this._buffer[6] += x;
            this._buffer[7] += y;
            return this;
        };
        class_1.prototype._setRotScale = function (rot, w, h) {
            this._rot = rot;
            this._width = w;
            this._height = h;
            var c = Math.cos(rot);
            var s = Math.sin(rot);
            this._buffer[0] = w * c;
            this._buffer[1] = w * -s;
            this._buffer[3] = h * s;
            this._buffer[4] = h * c;
            return this;
        };
        class_1.prototype.setScale = function (w, h) {
            return this._setRotScale(this._rot, w, h);
        };
        class_1.prototype.setRot = function (rot) {
            return this._setRotScale(rot, this._width, this._height);
        };
        Object.defineProperty(class_1.prototype, "rot", {
            get: function () { return this._rot; },
            set: function (rot) {
                this._setRotScale(rot, this._width, this._height);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "x", {
            //GETTERS (some overrides from vector class)
            get: function () { return this._buffer[6]; },
            set: function (x) { this._buffer[6] = x; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "y", {
            get: function () { return this._buffer[7]; },
            set: function (y) { this._buffer[7] = y; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "width", {
            get: function () { return this._width; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "height", {
            get: function () { return this._height; },
            enumerable: true,
            configurable: true
        });
        return class_1;
    }(Vector));
})(typeof Vector !== 'undefined' ? Vector : require('./../utils/vector.js'));
try { //export for NodeJS
    module.exports = Matrix2D;
}
catch (e) { }
