const Object2D = (function(Matrix2D) {
	var instance_id = 0;
	
	return class extends Matrix2D {
		constructor() {
			super();

			//NOTE - clientside only use
			this.timestamp = Date.now();//timestamp of previous object update
			
			this.id = ++instance_id;
			this.expired = false;

			//serverside only use for some types of objects
			this.frames_since_last_update = 0;
		}

		update(delta) {}

		//updateTimestamp(timestamp, delta) {}
	};
})(
	typeof Matrix2D !== 'undefined' ? Matrix2D : require('./../../utils/matrix2d.js')
);

try {//export for NodeJS
	module.exports = Object2D;
}
catch(e) {}