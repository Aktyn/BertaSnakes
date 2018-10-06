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
var Object2D = (function (Matrix2D) {
    var instance_id = 0;
    return /** @class */ (function (_super) {
        __extends(class_1, _super);
        function class_1() {
            var _this = _super.call(this) || this;
            //NOTE - clientside only use
            _this.timestamp = Date.now(); //timestamp of previous object update
            _this.id = ++instance_id;
            _this.expired = false;
            //serverside only use for some types of objects
            _this.frames_since_last_update = 0;
            return _this;
        }
        class_1.prototype.update = function (delta) { };
        return class_1;
    }(Matrix2D));
})(typeof Matrix2D !== 'undefined' ? Matrix2D : require('./../../utils/matrix2d.js'));
try { //export for NodeJS
    module.exports = Object2D;
}
catch (e) { }
