///<reference path="../../utils/vector.ts"/>
///<reference path="../common/colors.ts"/>

//const Painter = (function() {

	try {
		var __Vector__: typeof Vector = require('./../../utils/vector');
	}
	catch(e) {
		var __Vector__ = Vector;
	}

	try {
		var __Vector__: typeof Vector = require('./../../utils/vector');
	}
	catch(e) {}

	class Painter {
		private static DEFAULT_THICKNESS = 0.015;

		public lastPos: VectorScope.Vector;
		public color: ColorsScope.ColorI;
		public thickness: number;
		public active = false;

		constructor(color: ColorsScope.ColorI, thickness: number) {
			this.lastPos = new __Vector__.Vec2f(0, 0);//for painting purpouses
			this.color = color;
			this.thickness = thickness || Painter.DEFAULT_THICKNESS;

			// this.active = false;
		}
	};
//})();
//	typeof Vector !== 'undefined' ? Vector : require('./../../utils/vector.js')
//);

try {//export for NodeJS
	module.exports = Painter;
}
catch(e) {}