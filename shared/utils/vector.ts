export const enum VECTOR_DATA_TYPES {
	INT32 = 0,
	FLOAT
}

/* once declared variables for performance matter */
let values_sum: number, length_buff: number, it: number;
const pow2 = (a: number) => a*a;//fast square power function
/**************************************************/

interface Point2D_I {
	x: number;
	y: number;
}

export default // noinspection SpellCheckingInspection
class Vector {
	private readonly _vec_size: number;
	protected _buffer: Int32Array | Float32Array;

	constructor(type: VECTOR_DATA_TYPES, size: number) {
		this._vec_size = size;

		switch(type) {
			case VECTOR_DATA_TYPES.INT32:
				this._buffer = new Int32Array(size);
				break;
			case VECTOR_DATA_TYPES.FLOAT:
				this._buffer = new Float32Array(size);
				break;

			default:
				throw new Error('Incorrect vector type');
		}
	}

	get size() {
		return this._vec_size;
	}
	
	// noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
	set size(s) {
		throw new Error('Vector\' size cannot be changed');
	}

	set(...args: number[]) {
		for(let i=0; i<args.length && i<this._vec_size; i++) {
			//if(i >= this._buffer.length)//(deprecated) safety for too many arguments
			//	break;
			this._buffer[i] = args[i];
		}
		return this;
	}

	get buffer() {//returns buffer
		return this._buffer;
	}

	/*XYZW short access functions*/
	get x()  {	return this._buffer[0];	}
	set x(x) {	this._buffer[0] = x;	}

	get y()  {	return this._buffer[1];	}
	set y(y) {	this._buffer[1] = y;	}

	get z()  {	return this._buffer[2];	}
	set z(z) {	this._buffer[2] = z;	}

	get w()  {	return this._buffer[3];	}
	set w(w) {	this._buffer[3] = w;	}

	///////////////////////////////////////////////

	lengthSqrt() {
		values_sum = 0;
		//for(value_it of this._buffer)
		for(let value_i=0; value_i < this._buffer.length; value_i++)
			values_sum += pow2( this._buffer[value_i] );
		return values_sum;
	}

	length() {
		return Math.sqrt( this.lengthSqrt() );
	}

	normalize() {
		length_buff = this.length();
		if(length_buff > 0)	this.scaleBy( 1.0 / length_buff );
		return this;
	}

	dot(in_vec: Vector) {//@in_vec - vector instance of same type and size
		values_sum = 0;
		for(it=0; it<this._vec_size; it++)
			values_sum += this._buffer[it] * in_vec._buffer[it];

		return values_sum;
	}

	scaleBy(factor: number) {
		for(it=0; it<this._vec_size; it++)
			this._buffer[it] *= factor;
	}

	//STATIC METHOD FOR CALCULATIONS

	//returns squared distance between two 2D points
	static distanceSqrt(p1: Point2D_I, p2: Point2D_I) {//@p1 and p2 - objects with x, and y members
		return pow2(p2.x - p1.x) + pow2(p2.y - p1.y);
	}
}

export class Vec2f extends Vector {
	constructor(...args: number[]) {
		super(VECTOR_DATA_TYPES.FLOAT, 2);
		super.set(...args);
	}
}
export class Vec3f extends Vector {
	constructor(...args: number[]) {
		super(VECTOR_DATA_TYPES.FLOAT, 3);
		super.set(...args);
	}
}
/*export class Vec4f extends Vector {
	constructor(...args: number[]) {
		super(VECTOR_DATA_TYPES.FLOAT, 4);
		super.set(...args);
	}
}*/