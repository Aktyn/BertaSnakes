import Vector from './vector';

export default class Matrix2D extends Vector {
	protected _rot = 0;
	private _width = 1;
	private _height = 1;

	constructor() {
		super(Vector.TYPE.FLOAT, 9);
		this.setIdentity();
	}

	// SETTERS
	setIdentity() {
		super.set(	1, 0, 0, 
					0, 1, 0, 
					0, 0, 1);
		this._rot = 0;
		this._width = 1;//width
		this._height = 1;//height

		return this;
	}

	setPos(x: number, y: number) {
		this._buffer[6] = x;
		this._buffer[7] = y;
		return this;
	}

	move(x: number, y: number) {
		this._buffer[6] += x;
		this._buffer[7] += y;
		return this;
	}

	_setRotScale(rot: number, w: number, h: number) {
		this._rot = rot;
		this._width = w;
		this._height = h;

		let c = Math.cos(rot);
		let s = Math.sin(rot);

		this._buffer[0] = w * c;
		this._buffer[1] = w * -s;

		this._buffer[3] = h * s;
		this._buffer[4] = h * c;

		return this;
	}

	setScale(w: number, h: number) {
		return this._setRotScale(this._rot, w, h);
	}

	setRot(rot: number) {
		return this._setRotScale(rot, this._width, this._height);
	}
	set rot(rot: number) {
		this._setRotScale(rot, this._width, this._height);
	}

	//GETTERS (some overrides from vector class)
	get x()  {	return this._buffer[6];	}
	set x(x: number) {	this._buffer[6] = x;	}

	get y()  {	return this._buffer[7];	}
	set y(y: number) {	this._buffer[7] = y;	}

	get rot() {	return this._rot;	}

	get width() 	{	return this._width;	}
	get height() 	{	return this._height;}
}