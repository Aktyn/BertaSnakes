import Object2D from './object2d';
import Movement from './../common/movement';
import Sensor from './../common/sensor';
import HpBar from './hp_bar';

const REGENERATION_SPEED = 0.025;
//const ETITY_NAME = 'ENEMY_ROCKET';//ENEMY_ROCKET

export default class Enemy extends Object2D {
	private entity_name: string;
	private movement: Movement;
	public sensor: Sensor;
	public hp_bar: HpBar;

	private _spawning = false;

	public SCALE: number;

	constructor(entity_name: string, sensor_shape: any, SCALE: number, MAX_SPEED: number) {
		super();
		super.setScale(0, 0);

		this.SCALE = SCALE;
		this.entity_name = entity_name;

		this.movement = new Movement();
		this.movement.setOptions({
			maxSpeed: MAX_SPEED,//initial enemy speed
		});

		// this._spawning = false;

		this.sensor = new Sensor( sensor_shape );
		this.hp_bar = new HpBar( SCALE, REGENERATION_SPEED );//needs destroying
		
		//@ts-ignore
		if(typeof Entities !== 'undefined')//client side
			//@ts-ignore
			Entities.EntitiesBase.addObject(Entities.EntitiesBase[entity_name].id, this);

	}

	destroy() {
		//@ts-ignore
		if(typeof Entities !== 'undefined')
			//@ts-ignore
			Entities.EntitiesBase.removeObject(Entities.EntitiesBase[this.entity_name].id, this);
		this.hp_bar.destroy();
	}

	isAlive() {
		return this.hp_bar.hp >= 0.005 || this.expired === true;
	}

	get spawning() {
		return this._spawning;
	}

	set spawning(value) {
		this._spawning = value;
		this.hp_bar.setVisible(!value);
	}

	update(delta: number) {
		this.movement.applyMove(this, delta);
		super.update(delta);

		this.hp_bar.update_hpbar(delta, this.x, this.y, this.height);
	}

	/*static get INITIAL_SCALE() {
		return SCALE;
	}*/
}