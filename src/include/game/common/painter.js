const Painter = (function(Vector) {
	const DEFAULT_THICKNESS = 0.015;

	return class {
		constructor(color, thickness) {
			this.lastPos = new Vector.Vec2f(0, 0);//{x: 0, y: 0};//for painting purpouses
			this.color = color;
			this.thickness = thickness || DEFAULT_THICKNESS;

			this.active = false;
		}
	};
})(
	typeof Vector !== 'undefined' ? Vector : require('./../../utils/vector.js')
);

try {//export for NodeJS
	module.exports = Painter;
}
catch(e) {}