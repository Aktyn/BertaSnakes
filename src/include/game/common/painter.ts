///<reference path="../../utils/vector.ts"/>
///<reference path="../common/colors.ts"/>

//const Painter = (function() {
namespace GameCommon {
	try {
		var _Vector_: typeof Vector = require('./../../utils/vector');
	}
	catch(e) {
		var _Vector_ = VectorScope.Vector;
	}

	export class Painter {
		private static DEFAULT_THICKNESS = 0.015;

		public lastPos: VectorScope.Vector;
		public color: ColorsScope.ColorI;
		public thickness: number;
		public active = false;

		constructor(color: ColorsScope.ColorI, thickness: number) {
			this.lastPos = new _Vector_.Vec2f(0, 0);//for painting purpouses
			this.color = color;
			this.thickness = thickness || Painter.DEFAULT_THICKNESS;

			// this.active = false;
		}
	}
}

try {//export for NodeJS
	module.exports = GameCommon.Painter;
}
catch(e) {}