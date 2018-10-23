//const Sensor = (function() {

interface ShapeI {
	[index: string]: number[][]
}

class Sensor {
	static SHAPES: ShapeI = {
		TRIANGLE: 	[[0.0, 1.0], [-1.0, -1.0], [1.0, -1.0], [-0.5, 0.0], [0.5, 0.0]],
		SQUARE: 	[[0.0, 1.0], [-1.0, -1.0], [1.0, -1.0], [-0.5, 0.0], [0.5, 0.0]],
		PENTAGON: 	[
			[0.0, 1.0], [-0.5, 1.0], [0.5, 1.0], [-0.5, -1.0], [0.5, -1.0], [-1.0, -0.5], [1.0, -0.5]
		],

		ROCKET: [[0.0, 1.0], [-1.0, -0.9], [1.0, -0.9], [-0.5, 0.5], [0.5, 0.5]],
		CIRCLE:	new Array(8).fill(0).map((_, index, arr) => {
			var a = Math.PI * 2.0 * (index / arr.length) + Math.PI / 2;
			return [Math.cos(a), Math.sin(a)].map(v => Math.abs(v) < 1e-10 ? 0 : v);
		}),
		BULLET: [[0.0, 1.0], [0.0, -1.0], [-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]]
	};

	public shape: number[][];

	constructor(shape: number[][]) {
		this.shape = shape || Sensor.SHAPES.TRIANGLE;//default shape
	}

	//static get SHAPES() {
	//	return SHAPES;
	//
}
//})();

try {//export for NodeJS
	module.exports = Sensor;
}
catch(e) {}