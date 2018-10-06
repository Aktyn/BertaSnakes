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
var Vector = (function () {
    var AVAIBLE_TYPES = {
        INT32: 0,
        FLOAT: 0,
    };
    var j = 0; //auto numering
    for (var i in AVAIBLE_TYPES)
        AVAIBLE_TYPES[i] = j++;
    /* once declared variables for performance matter */
    var values_sum, value_it, length_buff, it;
    var pow2 = function (a) { return a * a; }; //fast square power function
    /**************************************************/
    var self = /** @class */ (function () {
        function class_1(type, size) {
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
        Object.defineProperty(class_1.prototype, "size", {
            get: function () {
                return this._vec_size;
            },
            set: function (s) {
                throw new Error('Vector size cannot be changed after it is created');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1, "TYPE", {
            get: function () {
                return AVAIBLE_TYPES;
            },
            enumerable: true,
            configurable: true
        });
        class_1.prototype.set = function () {
            for (var i_1 in arguments) {
                if (i_1 >= this._buffer.length) //safety for too many arguments
                    break;
                this._buffer[i_1] = arguments[i_1];
            }
            return this;
        };
        Object.defineProperty(class_1.prototype, "buffer", {
            get: function () {
                return this._buffer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "x", {
            /*XYZW short access functions*/
            get: function () { return this._buffer[0]; },
            set: function (x) { this._buffer[0] = x; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "y", {
            get: function () { return this._buffer[1]; },
            set: function (y) { this._buffer[1] = y; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "z", {
            get: function () { return this._buffer[2]; },
            set: function (z) { this._buffer[2] = z; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "w", {
            get: function () { return this._buffer[3]; },
            set: function (w) { this._buffer[3] = w; },
            enumerable: true,
            configurable: true
        });
        ///////////////////////////////////////////////
        class_1.prototype.lengthSqrt = function () {
            values_sum = 0;
            for (var _i = 0, _a = this._buffer; _i < _a.length; _i++) {
                value_it = _a[_i];
                values_sum += value_it * value_it;
            }
            return values_sum;
        };
        class_1.prototype.length = function () {
            return Math.sqrt(this.lengthSqrt());
        };
        class_1.prototype.normalize = function () {
            length_buff = this.length();
            if (length_buff > 0)
                this.scaleBy(1.0 / length_buff);
            return this;
        };
        class_1.prototype.dot = function (in_vec) {
            values_sum = 0;
            for (it = 0; it < this._vec_size; it++)
                values_sum += this._buffer[it] * in_vec._buffer[it];
            return values_sum;
        };
        class_1.prototype.scaleBy = function (factor) {
            for (it = 0; it < this._vec_size; it++)
                this._buffer[it] *= factor;
        };
        //STATIC METHOD FOR CALCULATIONS
        //returns squared distance between two points
        class_1.distanceSqrt = function (p1, p2) {
            return pow2(p2.x - p1.x) + pow2(p2.y - p1.y);
        };
        return class_1;
    }());
    self.Vec2f = /** @class */ (function (_super) {
        __extends(Vec2f, _super);
        function Vec2f() {
            var _this = _super.call(this, AVAIBLE_TYPES.FLOAT, 2) || this;
            _super.prototype.set.apply(_this, arguments);
            return _this;
        }
        return Vec2f;
    }(self));
    self.Vec3f = /** @class */ (function (_super) {
        __extends(Vec3f, _super);
        function Vec3f() {
            var _this = _super.call(this, AVAIBLE_TYPES.FLOAT, 3) || this;
            _super.prototype.set.apply(_this, arguments);
            return _this;
        }
        return Vec3f;
    }(self));
    self.Vec4f = /** @class */ (function (_super) {
        __extends(Vec4f, _super);
        function Vec4f() {
            var _this = _super.call(this, AVAIBLE_TYPES.FLOAT, 4) || this;
            _super.prototype.set.apply(_this, arguments);
            return _this;
        }
        return Vec4f;
    }(self));
    return self;
})();
try { //export for NodeJS
    module.exports = Vector;
}
catch (e) { }
