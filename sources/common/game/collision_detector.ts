/* directed towards performance calculations */

import Vector, {Vec2f} from '../utils/vector';
import {GAME_MODES} from '../room_info';
import Object2D from './objects/object2d';

interface PainterCollisionListener {
	(object: Object2D, pixel_buffer: Uint8Array): void;
}
interface ObjectCollisionListener {
	(obj1: Object2D, obj2: Object2D): void;
}

// noinspection JSUnusedLocalSymbols
const abstractFunc_painter: PainterCollisionListener =
	function(object: Object2D, pixel_buffer: Uint8Array) {};
// noinspection JSUnusedLocalSymbols
const abstractFunc_object_to_object: ObjectCollisionListener =
	function(arg1: Object2D, arg2: Object2D) {};

const PUSH_STEPS = 4;

let cm_i;
const colorsMatch = (c1: Uint8Array, c2: Uint8Array) => {//@c1, c2 - Uint8Array buffers of size 4
	for(cm_i=0; cm_i < 4; cm_i++) {
		if(c1[cm_i] != c2[cm_i])
			return false;
	}
	return true;
};

const randRange = (min: number, max: number) => min + Math.random()*(max-min);
const pow2 = (a: number) => a*a;
//const distanceSqrt = (p1x, p1y, p2x, p2y) => 5;

//collision detecting variables
let p_i: number, e_i: number, b_i: number, i_i: number, es_i: number, coords: number[][],
	c_i: number, s: number, c: number, xx: number, yy: number, 
	pixel_buffer = new Uint8Array(4);

//random spot finding variables
let find_trials, up_i, obj_i, obj_it, temp_arr, overlap_ray_steps,
	overlap_ray_color = new Uint8Array(4), o_rr, o_angle, o_a_s, o_dx, o_dy, o_r_s;
const OVERLAP_ANGLE_STEPS = 16;
const OVERLAP_ANGLE_SHIFT = Math.PI*2.0 / OVERLAP_ANGLE_STEPS;

//bouncing variables
let current_vec = new Vec2f(),
	bounce_vec: Vector = new Vec2f(), dot, 
	ray_color = new Uint8Array(4), b_radius, b_angle, found, safety, b_product, 
	r_i, ray_steps, r_s, rr, b_dx, b_dy;
const RAYS = 32;
const ANGLE_SHIFT = Math.PI*2.0 / RAYS;
const COLLISION_PUSH_FACTOR = 0.01;//0.01

function getBounceVec(object: Object2D, color: Uint8Array, map: any, 
	out_vec: Vector | null) 
{
	//vec4b ray_color;

	b_radius = object.width;
	//every nth pixel
	ray_steps = 3;//((PaintLayer.CHUNK_RES * b_radius / PaintLayer.CHUNK_SIZE) / 3) | 0;
	b_angle = 0;

	found = false;

	for(r_i=0; r_i<RAYS; r_i++) {
		//console.log("ray steps:", ray_steps);

		for(r_s=ray_steps; r_s>0; r_s--) {
			rr = b_radius * ( r_s / ray_steps );
			b_dx = Math.cos(b_angle) * rr;
			b_dy = Math.sin(b_angle) * rr;

			map.getPixelColor(object.x + b_dx, object.y + b_dy, ray_color);

			if( colorsMatch(ray_color, color) ) {
				if(out_vec !== null) {
					out_vec.x -= b_dx;
					out_vec.y -= b_dy;
				}

				/*if(true) {
					map.color = "#fff";
					map.drawLine(object.x, object.y, 
						object.x + b_dx, object.y + b_dy, 0.002);
				}*/

				found = true;
				break;
			}
		}

		b_angle += ANGLE_SHIFT;
	}
	return found;
}

function bounceOutOfColor(object: Object2D, color: Uint8Array, map: any, 
	out_bounce_vec: Vector) 
{
	bounce_vec.set(0, 0);
	if(!getBounceVec(object, color, map, bounce_vec))//no collision detected
		return false;

	bounce_vec.normalize();

	if(out_bounce_vec != null)
		out_bounce_vec.set(bounce_vec.x, bounce_vec.y);

	//pushing object out of collision area
	safety = PUSH_STEPS;//16
	do {
		object.setPos(
			object.x + bounce_vec.x * COLLISION_PUSH_FACTOR,
			object.y + bounce_vec.y * COLLISION_PUSH_FACTOR
		);
	} while(getBounceVec(object, color, map, null) && --safety > 0);

	//no need to normalize
	current_vec.set(Math.cos(-object.rot+Math.PI/2.0), Math.sin(-object.rot+Math.PI/2.0));

	/*if(true) {//test
		map.color = "#0f0";
		map.drawLine(object.x, object.y, 
			object.x + bounce_vec.x, object.y + bounce_vec.y, 0.003);

		map.color = "#ff0";
		map.drawLine(object.x, object.y, 
			object.x - current_vec.x, object.y - current_vec.y, 0.003);
	}*/

	b_product = current_vec.dot(bounce_vec);
	if(b_product > 0.0)
		return true;/*NOTE - changed from false*/
	//bounce_vec = current_vec - (bounce_vec * b_product * 2.0);
	bounce_vec.x = current_vec.x - (bounce_vec.x * b_product * 2.0);
	bounce_vec.y = current_vec.y - (bounce_vec.y * b_product * 2.0);

	object.rot = -Math.atan2( bounce_vec.y, bounce_vec.x ) + Math.PI/2.0;
	// object.rot = Math.atan2( bounce_vec.y, bounce_vec.x );

	/*if(true) {
		bounce_vec.normalize();
		map.color = "#000";
		map.drawLine(object.x, object.y, 
			object.x + bounce_vec.x, object.y + bounce_vec.y, 0.003);
	}*/

	return true;
}

//bounces obj1 from obj2 (circle interpolation)
function bounceOneObjectFromAnother(obj1: Object2D, obj2: Object2D) {
	current_vec.set(Math.cos(-obj1.rot+Math.PI/2.0), Math.sin(-obj1.rot+Math.PI/2.0)).normalize();
	bounce_vec.set(obj1.x - obj2.x, obj1.y - obj2.y).normalize();
	
	safety = 16;
	do {
		obj1.setPos(
			obj1.x + bounce_vec.x * COLLISION_PUSH_FACTOR,
			obj1.y + bounce_vec.y * COLLISION_PUSH_FACTOR
		);
	} while( twoObjectsIntersect(obj1, obj2) && --safety > 0 );

	dot = current_vec.dot(bounce_vec);

	if(dot > 0.0)
		return true;

	bounce_vec.x = current_vec.x - (bounce_vec.x * dot * 2.0);
	bounce_vec.y = current_vec.y - (bounce_vec.y * dot * 2.0);

	obj1.rot = -Math.atan2( bounce_vec.y, bounce_vec.x ) + Math.PI/2.0;
	return false;
}

//just for searching random empty spot
function objectOverlap(map: any, in_vec: Vector, _radius: number) {
	//assumption - the object radius is its width
	for(up_i=0; up_i<map.updatables.length; up_i++) {
		temp_arr = map.updatables[up_i];
		for(obj_i=0; obj_i<temp_arr.length; obj_i++) {
			obj_it = temp_arr[obj_i];
			if( Vector.distanceSqrt(in_vec, obj_it) <= pow2(obj_it.width + _radius) )
					return true;
		}
	}
	return false;
}

function paintOverlap(map: any, in_vec: Vector, _radius: number) {
	overlap_ray_steps = _radius / 0.015;//2;

	for(o_r_s=overlap_ray_steps; o_r_s>0; o_r_s--) {
		o_rr = _radius * (o_r_s / overlap_ray_steps);

		o_angle = 0;
		for(o_a_s=0; o_a_s<OVERLAP_ANGLE_STEPS; o_a_s++) {
			o_dx = Math.cos(o_angle) * o_rr;
			o_dy = Math.sin(o_angle) * o_rr;
			//ChunkedCanvas::getPixelColor(in_vec.x() + dx, in_vec.y() + dy, overlap_ray_color);
			map.getPixelColor(in_vec.x + o_dx, in_vec.y + o_dy, overlap_ray_color);

			if(overlap_ray_color[3] > 0)//pixel is not invisible => overlap
				return true;

			o_angle += OVERLAP_ANGLE_SHIFT;
		}
	}
	return false;
}

const twoObjectsIntersect = (obj1: Object2D, obj2: Object2D) => 
	Vector.distanceSqrt(obj1, obj2) <= pow2(obj1.width + obj2.width);

export default {//ABSTRACT CLASS INTERFACE
	detectCollisions: function(map: any, gamemode: any) {
		
		for(p_i=0; p_i<map.players.length; p_i++) {//for each player
			//player to painter collision
			this.detectSensorToPainterCollision( 
				map, map.players[p_i], this.onPlayerPainterCollision );

			//player to enemy collision
			for(e_i=0; e_i<map.enemies.length; e_i++) {
				if( twoObjectsIntersect(map.players[p_i], map.enemies[e_i]) )
					this.onPlayerEnemyCollision( map.players[p_i], map.enemies[e_i] );
			}

			//player to enemy spawner collision
			for(es_i=0; es_i<map.enemy_spawners.length; es_i++) {
				if( twoObjectsIntersect(map.players[p_i], map.enemy_spawners[es_i]) )
					this.onPlayerEnemySpawnerCollision(map.players[p_i], map.enemy_spawners[es_i]);
			}

			//player to item collision
			for(i_i=0; i_i<map.items.length; i_i++) {
				if( twoObjectsIntersect(map.players[p_i], map.items[i_i]) )
					this.onPlayerItemCollision(map.players[p_i], map.items[i_i]);
			}

			//player to bullet collision (only competition mode)
			if(gamemode === GAME_MODES.COMPETITITON) {
				for(b_i=0; b_i<map.bullets.length; b_i++) {
					if( twoObjectsIntersect(map.players[p_i], map.bullets[b_i]) )
						this.onPlayerBulletCollision(map.players[p_i], map.bullets[b_i]);
				}
			}
		}

		for(e_i=0; e_i<map.enemies.length; e_i++) {//for each enemy
			//enemy to painter collision
			this.detectSensorToPainterCollision( 
				map, map.enemies[e_i], this.onEnemyPainterCollision );

			if(map.enemies[e_i].spawning === false) {//only spawned enemies

				//enemy to enemy spawner collision
				for(es_i=0; es_i<map.enemy_spawners.length; es_i++) {
					if( twoObjectsIntersect(map.enemies[e_i], map.enemy_spawners[es_i]) )
						this.onEnemyEnemySpawnerCollision(map.enemies[e_i], 
							map.enemy_spawners[es_i]);
				}

				//enemy to bullet collision
				for(b_i=0; b_i<map.bullets.length; b_i++) {
					if( twoObjectsIntersect(map.enemies[e_i], map.bullets[b_i]) )
						this.onEnemyBulletCollision(map.enemies[e_i], map.bullets[b_i]);
				}

			}
		}

		//bullet to painter collision, NOTE - should be after testing collisions with objects
		for(b_i=0; b_i<map.bullets.length; b_i++) {//for each bullet
			this.detectSensorToPainterCollision( 
				map, map.bullets[b_i], this.onBulletPainterCollision );
		}

	},
	detectSensorToPainterCollision: function(map: any, object: Object2D, 
		onCollide: PainterCollisionListener) 
	{
		//@ts-ignore
		if(object.sensor === undefined)
			console.log(object);
		//@ts-ignore
		coords = (<Sensor>object.sensor).shape;

		for(c_i=0; c_i < coords.length; c_i++) {
			s = Math.sin(-object.rot);
			c = Math.cos(-object.rot);

			xx = (coords[c_i][0] * c - coords[c_i][1] * s) * object.width  + object.x;
			yy = (coords[c_i][0] * s + coords[c_i][1] * c) * object.height + object.y;

			map.getPixelColor(xx, yy, pixel_buffer);
			
			if(pixel_buffer[3] === 255) {
				//this.onPlayerPainterCollision(object, pixel_buffer);
				onCollide.call(this, object, pixel_buffer);
			}
		}
	},
	
	//TODO - try GameMap type
	findRandomEmptySpot: function(map: any, _radius: number, out_vec: Vector) {
		find_trials = 0;

		const sc = map.map_size;
		const wall_margin = map.walls_thickness * 2.0 + _radius;
		while(find_trials++ < 16) {//maximum trials for performance matter
			out_vec.set( randRange(-sc, sc), randRange(-sc, sc) );
			
			if(/*distanceSqrt(out_vec.x(), out_vec.y(), 0, 0) //TODO - check distance to safe area
				> pow2f(SAFE_AREA_RADIUS+_radius)
				&&*/ out_vec.x > -sc+wall_margin && out_vec.x < sc-wall_margin && 
				out_vec.y > -sc+wall_margin && out_vec.y < sc-wall_margin && 
				objectOverlap(map, out_vec, _radius) === false && 
				paintOverlap(map, out_vec, _radius) === false)
					return true;
		}

		return false;
	},

	bounceOneObjectFromAnother: bounceOneObjectFromAnother,

	//@color - Uint8Array buffer (color to bounce of), @out_bounce_vec - Vec2f
	bounceOutOfColor: bounceOutOfColor,

	//abstract functions
	onPlayerPainterCollision: abstractFunc_painter,
	onEnemyPainterCollision: abstractFunc_painter,
	onBulletPainterCollision: abstractFunc_painter,
	
	onPlayerItemCollision: abstractFunc_object_to_object,
	onPlayerEnemyCollision: abstractFunc_object_to_object,
	onPlayerEnemySpawnerCollision: abstractFunc_object_to_object,
	onPlayerBulletCollision: abstractFunc_object_to_object,
	onEnemyEnemySpawnerCollision: abstractFunc_object_to_object,
	onEnemyBulletCollision: abstractFunc_object_to_object
};