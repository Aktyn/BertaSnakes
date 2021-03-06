import {Emitter} from '../engine/graphics';
import Object2D from '../../../common/game/objects/object2d';
	
const PARTICLES = 100;
const vals = Emitter.VALUES_PER_PARTICLE;

//NOTE - scale is Player.INITIAL_SCALE*0.8
const SCALE = 0.05*0.8, /*SPEED = 0.1,*/ ALPHA = 0.2;
const GROW_LENGTH = 0.9, SHRINK_LENGTH = 0.2;//range 0 to 1
const PRECALCULATED_PROPORTION = 0.5 * ( 1.0 / (1.0 - GROW_LENGTH) );

let i: number, alpha_l: number;

// noinspection JSUnusedGlobalSymbols
export default class PlayerEmitter extends Emitter {
	private player: Object2D;
	private alphas: Float32Array;

	constructor(_player: Object2D) {
		super('fusion_particle', PARTICLES, true);

		this.player = _player;
		//@ts-ignore
		let col: Float32Array = this.player.painter.color.buffer;

		this.alphas = new Float32Array(PARTICLES);

		for(i=0; i<PARTICLES; i++) {
			this.data[i*vals + 0] = NaN;//(Math.random() * 2.0 - 1.0) * Graphics.getAspect();//x
			this.data[i*vals + 1] = NaN;//Math.random() * 2.0 - 1.0;//yy
			this.data[i*vals + 2] = 0;//0.05 * Math.random() + 0.025;

			this.alphas[i] = i/PARTICLES;

			this.data[i*vals + 3] = col[0];//r
			this.data[i*vals + 4] = col[1];//g
			this.data[i*vals + 5] = col[2];//b
			this.data[i*vals + 6] = ALPHA * (i / PARTICLES);//Math.random();
		}
	}

	destroy() {
		//@ts-ignore
		this.alphas = null;
		super.destroy();
	}

	update(delta: number) {
		for(i=0; i<PARTICLES; i++) {
			//if( (this.data[i*vals + 6] -= delta * 0.1) <= 0 ) {
			if( (this.alphas[i] -= delta * 0.666) <= 0 ) {
				this.alphas[i] += 1.0;

				// this.data[i*vals + 6] = this.alphas[i] * ALPHA;

				this.data[i*vals + 0] = this.player.x + 
					Math.cos(-this.player.rot - Math.PI/2.0) * this.player.width;
				this.data[i*vals + 1] = this.player.y + 
					Math.sin(-this.player.rot - Math.PI/2.0) * this.player.width;
				// this.data[i*vals + 0] = this.player.x;
				// this.data[i*vals + 1] = this.player.y;
			}

			//alpha_l = this.data[i*vals + 6] / ALPHA;
			alpha_l = this.alphas[i];
			this.data[i*vals + 6] = alpha_l * ALPHA * 
				//@ts-ignore
				this.player.movement.speed / this.player.movement.maxSpeed;

			this.data[i*vals + 2] = alpha_l > GROW_LENGTH ? 
				(SCALE * ( 0.5 + PRECALCULATED_PROPORTION * (1.0 - alpha_l) ) ) :
				( alpha_l < SHRINK_LENGTH ? (SCALE * (alpha_l / SHRINK_LENGTH)) : 
					SCALE);
		}
	}
}