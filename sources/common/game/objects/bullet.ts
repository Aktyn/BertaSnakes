import Object2D from './object2d';
import Sensor, {SENSOR_SHAPES} from './../common/sensor';
import Colors, {ColorI} from './../common/colors';

/*declare var _CLIENT_: boolean;
if(_CLIENT_)
	var EntitiesBase = require('../../../client/game/entities').default;*/

const SCALE = 0.02, DEFAULT_SPEED = 1.0, MAXIMUM_LIFETIME = 20;

const H_PI = Math.PI/2;
const fixAngle = (a: number) => -a + H_PI;

export const enum BULLET_TYPE {
	NORMAL = 0,
	BOUNCING
}

export default class Bullet extends Object2D {
	//public bouncing: boolean;
	public type: BULLET_TYPE;
	public parent: Object2D;
	private lifetime: number;
	private readonly speed: number;
	public sensor: Sensor;
	public damage_scale = 1;

	private readonly entity_name?: string;
	private readonly entitiesClass: any;

	//NOTE - parent must constains a Painter instance as 'painter' property name
	//@parent - instance that 'owns' this bullet
	constructor(x: number, y: number, rot: number, parent: Object2D, _type = BULLET_TYPE.NORMAL,
		_entitiesClass?: any) 
	{
		super();
		super.setScale(SCALE, SCALE);
		super.setPos(x, y);
		super.setRot(rot);

		this.entitiesClass = _entitiesClass;

		//this.bouncing = is_bouncing;// || false;
		this.type = _type;

		//this.color = color;//color works as a player signature
		this.parent = parent;

		this.lifetime = MAXIMUM_LIFETIME;
		this.speed = DEFAULT_SPEED;

		this.sensor = new Sensor( SENSOR_SHAPES.BULLET );

		if(this.entitiesClass) {
			// console.log('new bullet', Bullet.entityName(color));
			//@ts-ignore
			this.entity_name = Bullet.entityName(parent.painter.color);//clientside only
			this.entitiesClass.addObject(this.entitiesClass.getEntityId(this.entity_name), this);
		}
	}

	destroy() {
		if(this.entitiesClass)
			this.entitiesClass.removeObject(this.entitiesClass.getEntityId(this.entity_name), this);
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