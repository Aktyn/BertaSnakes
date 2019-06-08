import Object2D from './object2d';
import Sensor, {SENSOR_SHAPES} from './../common/sensor';
import Colors, {ColorI} from './../common/colors';

const SCALE = 0.02, DEFAULT_SPEED = 1.0, MAXIMUM_LIFETIME = 20;

const H_PI = Math.PI/2;
const fixAngle = (a: number) => -a + H_PI;

export default class Bullet extends Object2D {
	public bouncing: boolean;
	public parent: Object2D;
	private lifetime: number;
	private speed: number;
	public sensor: Sensor;
	public damage_scale = 1;

	//NOTE - parent must constains a Painter instance as 'painter' property name
	//@parent - instance that 'owns' this bullet
	constructor(x: number, y: number, rot: number, parent: Object2D, is_bouncing = false) {
		super();
		super.setScale(SCALE, SCALE);
		super.setPos(x, y);
		super.setRot(rot);

		this.bouncing = is_bouncing;// || false;

		//this.color = color;//color works as a player signature
		this.parent = parent;

		this.lifetime = MAXIMUM_LIFETIME;
		this.speed = DEFAULT_SPEED;

		this.sensor = new Sensor( SENSOR_SHAPES.BULLET );

		//@ts-ignore
		if(typeof Entities !== 'undefined') {
			// console.log('new bullet', Bullet.entityName(color));
			//@ts-ignore
			this.entity_name = Bullet.entityName(parent.painter.color);//clientside only
			//@ts-ignore
			Entities.EntitiesBase.addObject(Entities.EntitiesBase[this.entity_name].id, this);
		}
	}

	destroy() {
		//@ts-ignore
		if(typeof Entities !== 'undefined')
			//@ts-ignore
			Entities.EntitiesBase.removeObject(Entities.EntitiesBase[this.entity_name].id, this);
	}

	get color() {
		//@ts-ignore
		return this.parent.painter.color;
	}

	update(delta: number) {
		if((this.lifetime -= delta) <= 0)
			this.expired = true;

		super.move( 
			Math.cos(fixAngle(this.rot)) * delta * this.speed, 
			Math.sin(fixAngle(this.rot)) * delta * this.speed);

		super.update(delta);
	}

	static entityName(color: ColorI) {
		return 'BULLET_' + Colors.PLAYERS_COLORS.indexOf(color);
	}
}