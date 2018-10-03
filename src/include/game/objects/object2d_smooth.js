const Object2DSmooth = (function(Object2D) {
	const SMOOTHNESS = 20, POS_SMOOTHNESS = 20, PI_2 = Math.PI * 2.0;

	var x_dt, y_dt, rot_dt;
	
	return class extends Object2D {
		constructor() {
			super();
			//console.log('smooth object2d');

			this.actual_x = 0;
			this.actual_y = 0;
			this.actual_rot = 0;
		}

		setPos(x, y, do_not_smooth) {
			this.actual_x = x;
			this.actual_y = y;
			if(do_not_smooth === true)
				super.setPos(x, y);
			return this;
		}

		move(x, y, do_not_smooth) {
			this.actual_x += x;
			this.actual_y += y;
			if(do_not_smooth === true)
				super.move(x, y);
			return this;
		}

		setRot(rot, do_not_smooth) {
			this.actual_rot = rot;
			if(do_not_smooth === true)
				super.setRot(rot);
			return this;
		}
		set rot(rot) {
			this.actual_rot = rot;
		}

		//GETTERS (some overrides from vector class)
		get x()  {	return this.actual_x;	}
		set x(x) {	this.actual_x = x;	}

		get y()  {	return this.actual_y;	}
		set y(y) {	this.actual_y = y;	}

		get rot() {	return this.actual_rot;	}

		update(delta) {
			x_dt = this.actual_x - this._buffer[6];
			y_dt = this.actual_y - this._buffer[7];

			super.setPos(
				this._buffer[6] + x_dt * delta * POS_SMOOTHNESS,
				this._buffer[7] + y_dt * delta * POS_SMOOTHNESS);

			///////////////////////////////////////////////////////
			rot_dt = this.actual_rot - this._rot;

			if(rot_dt > Math.PI)
				rot_dt -= Math.PI * 2.0;
			else if(rot_dt < -Math.PI)
				rot_dt += Math.PI * 2.0;
			
			super.setRot( this._rot + rot_dt * delta*SMOOTHNESS * (Math.abs(rot_dt / 0.5)) );
			while(this._rot < 0)
				super.setRot( this._rot + PI_2 );
			while(this._rot > PI_2)
				super.setRot( this._rot - PI_2 );

			super.update(delta);//Object2D
		}
	};
})(
	typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js')
);

try {//export for NodeJS
	module.exports = Object2DSmooth;
}
catch(e) {}