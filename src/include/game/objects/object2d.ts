///<reference path="../../utils/matrix2d.ts"/>

//namespace Object2DScope {
// var Object2D = (function(Matrix2D: MatrixScope.Matrix2D) {
	// try {
	// 	var Matrix2D: typeof MatrixScope.Matrix2D = require('./../../utils/matrix2d');
	// } catch(e) {}

	try {
		var _Matrix2D_: typeof Matrix2D = require('./../../utils/matrix2d');
	}
	catch(e) {
		var _Matrix2D_ = Matrix2D;
	}
	
	class Object2D extends _Matrix2D_ {
		private static instance_id = 0;

		public timestamp: number;
		public id: number;
		public expired = false;
		public frames_since_last_update = 0;

		constructor() {
			super();

			//NOTE - clientside only use
			this.timestamp = Date.now();//timestamp of previous object update
			
			this.id = ++Object2D.instance_id;
			// this.expired = false;

			//serverside only use for some types of objects
			// this.frames_since_last_update = 0;
		}

		public destroy(): void {};
		public update(delta: number): void {};

		//updateTimestamp(timestamp, delta) {}
	}

	//return Object2D;
//}
// })(
	// typeof Matrix2D !== 'undefined' ? Matrix2D : require('./../../utils/matrix2d')
// );

//var Object2D = Object2DScope.Object2D;

try {//export for NodeJS
	module.exports = Object2D;
}
catch(e) {}