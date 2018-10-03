const Vector = (function() {
	const AVAIBLE_TYPES = {
		INT32: 0,
		FLOAT: 0,
	};
	var j = 0;//auto numering
	for(var i in AVAIBLE_TYPES)
		AVAIBLE_TYPES[i] = j++;

	/* once declared variables for performance matter */
	var values_sum, value_it, length_buff, it;
	const pow2 = a => a*a;//fast square power function
	/**************************************************/

	const self = class {
		constructor(type, size) {
			this._vec_size = size;

			switch(type) {
				case AVAIBLE_TYPES.INT32:
					this._buffer = new Int32Array(size);
					break;
				case AVAIBLE_TYPES.FLOAT:
					this._buffer = new Float32Array(size);
					break;

				default:
					throw new Error('Incorrect vector type');
			}
		}

		get size() {
			return this._vec_size;
		}

		set size(s) {
			throw new Error('Vector size cannot be changed after it is created');
		}

		static get TYPE() {
			return AVAIBLE_TYPES;
		}

		set() {
			for(let i in arguments) {
				if(i >= this._buffer.length)//safety for too many arguments
					break;
				this._buffer[i] = arguments[i];
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
			for(value_it of this._buffer)
				values_sum += value_it*value_it;
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

		dot(in_vec) {//@in_vec - vector instance of same type and size
			values_sum = 0;
			for(it=0; it<this._vec_size; it++)
				values_sum += this._buffer[it] * in_vec._buffer[it];

			return values_sum;
		}

		scaleBy(factor) {
			for(it=0; it<this._vec_size; it++)
				this._buffer[it] *= factor;
		}

		//STATIC METHOD FOR CALCULATIONS

		//returns squared distance between two points
		static distanceSqrt(p1, p2) {//@p1 and p2 - objects with x, and y members
			return pow2(p2.x - p1.x) + pow2(p2.y - p1.y);
		}
	};

	self.Vec2f = class extends self {
		constructor() {
			super(AVAIBLE_TYPES.FLOAT, 2);
			super.set(...arguments);
		}
	};

	self.Vec3f = class extends self {
		constructor() {
			super(AVAIBLE_TYPES.FLOAT, 3);
			super.set(...arguments);
		}
	};

	self.Vec4f = class extends self {/*used mostly for colors*/
		constructor() {
			super(AVAIBLE_TYPES.FLOAT, 4);
			super.set(...arguments);
		}
	};

	return self;
})();

try {//export for NodeJS
	module.exports =  Vector;
}
catch(e) {}