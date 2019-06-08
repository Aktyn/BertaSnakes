import Object2D from './object2d';

export default class Object2DSmooth extends Object2D {
	private static SMOOTHNESS = 20;
	private static POS_SMOOTHNESS = 20;
	private static PI_2 = Math.PI * 2.0;

	private actual_x = 0;
	private actual_y = 0;
	private actual_rot = 0;

	constructor() {
		super();
		//console.log('smooth object2d');
	}

	//@ts-ignore
	setPos(x: number, y: number, do_not_smooth = false) {
		this.actual_x = x;
		this.actual_y = y;
		if(do_not_smooth === true)
			super.setPos(x, y);
		return this;
	}

	move(x: number, y: number, do_not_smooth = false) {
		this.actual_x += x;
		this.actual_y += y;
		if(do_not_smooth === true)
			super.move(x, y);
		return this;
	}

	//@ts-ignore
	setRot(rot: number, do_not_smooth = false) {
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

	update(delta: number) {
		var x_dt, y_dt, rot_dt;
		x_dt = this.actual_x - this._buffer[6];
		y_dt = this.actual_y - this._buffer[7];

		super.setPos(
			this._buffer[6] + x_dt * delta * Object2DSmooth.POS_SMOOTHNESS,
			this._buffer[7] + y_dt * delta * Object2DSmooth.POS_SMOOTHNESS);

		///////////////////////////////////////////////////////
		rot_dt = this.actual_rot - this._rot;

		if(rot_dt > Math.PI)
			rot_dt -= Math.PI * 2.0;
		else if(rot_dt < -Math.PI)
			rot_dt += Math.PI * 2.0;
		
		super.setRot( this._rot + rot_dt * delta*Object2DSmooth.SMOOTHNESS * 
			(Math.abs(rot_dt*2.0)) );
		while(this._rot < 0)
			super.setRot( this._rot + Object2DSmooth.PI_2 );
		while(this._rot > Object2DSmooth.PI_2)
			super.setRot( this._rot - Object2DSmooth.PI_2 );

		//super.update(delta);//Object2D
	}
}