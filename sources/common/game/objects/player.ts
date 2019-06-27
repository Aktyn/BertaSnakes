import Colors, {ColorI} from '../common/colors';

import Object2D from './object2d';
import Object2DSmooth from './object2d_smooth';
import Movement from '../common/movement';
import Sensor, {SENSOR_SHAPES} from '../common/sensor';
import Painter from '../common/painter';

import Skills, {SkillData, SkillObject} from '../common/skills';
import Effects, {AVAILABLE_EFFECTS} from '../common/effects';

import Emoticon from './emoticon';

declare var _CLIENT_: boolean;
if(_CLIENT_) {
	//var RendererBase = require('../../../client/game/renderer').default;
	// var WebGLRenderer = require('../../../client/game/webgl_renderer').default;
	//var test = require('../../../client/game/webgl_entities');
	//console.log(test);

	//var EntitiesBase = require('../../../client/game/entities').default;
	
	// noinspection ES6ConvertVarToLetConst
	var PlayerEmitter = require('../../../client/game/emitters/player_emitter').default;
	// noinspection ES6ConvertVarToLetConst
	var PoisoningEmitter = require('../../../client/game/emitters/poisoning_emitter').default;
}

//TYPES
export enum PLAYER_TYPES {//enum (cannot be const since some code iterate over it)
	TRIANGLE = 0,
	SQUARE,
	PENTAGON
}

//array of sensor shapes with order corresponding to player TYPES
const PLAYER_SENSOR_SHAPES: number[][][] = [
	SENSOR_SHAPES.TRIANGLE, SENSOR_SHAPES.SQUARE, SENSOR_SHAPES.PENTAGON
];

const PLAYER_BASIC_SKILLS: SkillData[] = [
	<SkillData>Skills.SHOOT1, 
	<SkillData>Skills.SHOOT2, 
	<SkillData>Skills.SHOOT3
];

//initial parameters
const SCALE = 0.05, THICKNESS = 0.015, MAX_SPEED = 0.4, TURN_SPEED = Math.PI;
const POISON_STRENGTH = 0.1;

let s_i, em_i;

const _ExtendClass_ = _CLIENT_ ? Object2DSmooth : Object2D;//Object2DSmooth client side

export default class Player extends _ExtendClass_ {
	public static SHIP_NAMES = ['Triangle ship', 'Square ship', 'Pentagon ship'];
	public static SHIP_LVL_REQUIREMENTS = [1, 3, 6];//level required to be able to use ship
	public static SHIP_COSTS = [0, 500, 3000];//coins required to buy ship

	//server-side use variables
	public user_id = 0;
	public account_id?: string = undefined;
	public nick = '';
	public avatar: string | null = null;
	public level = 0;
	public rank = 0;
	
	public movement: Movement;
	readonly type: PLAYER_TYPES;
	private _hp: number;
	private _energy: number;
	public skills: (SkillObject | null)[];
	public effects: Effects;
	private emoticons: any[] = [];//NOTE - only client-side used
	private _points: number;
	public kills: number;
	public deaths: number;
	public sensor: Sensor;
	public painter: Painter;

	private readonly entity_name?: string;

	private poisoning_emitter: any;
	private readonly emitter: any;

	public spawning?: boolean;

	private readonly entitiesClass: any;
	private readonly rendererClass: any;
	
	constructor(type: PLAYER_TYPES, skills: (number | null)[], color: ColorI, _entitiesClass?: any,
		_rendererClass?: any) 
	{
		super();
		super.setScale(SCALE, SCALE);

		this.entitiesClass = _entitiesClass;
		this.rendererClass = _rendererClass;

		this.movement = new Movement();
		this.movement.setOptions({
			maxSpeed: MAX_SPEED,//initial player speed
			turnSpeed: TURN_SPEED
		});

		this.type = type;
		this._hp = 1;
		this._energy = 1;

		//list of skills available by player (skills bar)
		this.skills = [ PLAYER_BASIC_SKILLS[type].create() ];//basic skill (space)

		try {
			skills.forEach((skill_id) => {
				if(skill_id !== null) {
					let skill_schema = Skills.getById(skill_id);
					if(skill_schema === undefined)
						throw `Cannot find skill by id: ${skill_id}`;
						
					this.skills.push( skill_schema.create() );
				}
				else
					this.skills.push( null );
			});
		}
		catch(e) {
			console.error(e);
		}

		this.effects = new Effects(this);

		this._points = 0;
		this.kills = 0;
		this.deaths = 0;

		this.sensor = new Sensor( PLAYER_SENSOR_SHAPES[type] );
		this.painter = new Painter(color, THICKNESS);

		if(this.entitiesClass) {
			this.entity_name = Player.entityName(type, color);//client-side only
			this.entitiesClass.addObject(this.entitiesClass.getEntityId(this.entity_name), this);
		}

		if(this.rendererClass) {
			this.emitter = this.rendererClass.addEmitter( new PlayerEmitter(this) );
			this.poisoning_emitter = null;
		}
	}

	destroy() {
		if(this.entitiesClass) {
			this.entitiesClass.removeObject(this.entitiesClass.getEntityId(this.entity_name), this);
		}
		if(this.emitter)
			this.emitter.expired = true;
		if(this.poisoning_emitter)
			this.poisoning_emitter.expired = true;
	}

	onPoisoned() {//client-side only use for poisoning particle effect display
		if(this.poisoning_emitter === null) {
			if(this.rendererClass)
				this.poisoning_emitter = this.rendererClass.addEmitter( new PoisoningEmitter(this) );
		}
		else
			this.poisoning_emitter.resetTimer();
	}

	//client-side only function
	showEmoticon(name: string) {
		for(em_i=0; em_i<this.emoticons.length; em_i++)
			this.emoticons[em_i].endEffect();
		this.emoticons.push( new Emoticon(name, this, this.entitiesClass) );
	}

	update(delta: number) {
		this.movement.applyMove(this, delta);

		for(s_i=0; s_i<this.skills.length; s_i++) {
			if(this.skills[s_i] !== null)
				//@ts-ignore
				this.skills[s_i].update(delta);
		}

		this.effects.update(delta);
		if(this.effects.isActive(AVAILABLE_EFFECTS.POISONING))
			this.hp -= POISON_STRENGTH * delta;

		super.update(delta);

		//update emoticons
		for(em_i=0; em_i<this.emoticons.length; em_i++) {
			if(this.emoticons[em_i].expired === true) {
				this.emoticons[em_i].destroy();
				this.emoticons.splice(em_i, 1);
				em_i--;
			}
			else
				this.emoticons[em_i].update(delta);
		}

		if(this.emitter)
			this.emitter.update(delta);
		if(this.poisoning_emitter) {
			this.poisoning_emitter.update(delta);
			if(this.poisoning_emitter.expired === true)
				this.poisoning_emitter = null;
		}
	}

	isAlive() {
		return this._hp >= 0.005;
	}

	get hp() {
		return this._hp;
	}

	set hp(value) {
		//if hp dropped but SHIELD effect is active
		if( value < this._hp && 
			(this.effects.isActive(AVAILABLE_EFFECTS.SHIELD) || 
				this.effects.isActive(AVAILABLE_EFFECTS.SPAWN_IMMUNITY)) ) 
		{
			return;//do not update hp
		}

		this._hp = Math.min(1, Math.max(0, value));
	}

	public get energy() {
		return this._energy;
	}

	public set energy(value) {
		this._energy = Math.min(1, Math.max(0, value));
	}

	get points() {
		return this._points;
	}

	set points(value) {
		this._points = Math.round( Math.max(0, value) );
	}

	public static readonly INITIAL_SCALE = SCALE;

	public static entityName(type_i: PLAYER_TYPES, color: ColorI) {
		return 'PLAYER_' + type_i + '_' + Colors.PLAYERS_COLORS.indexOf(color);
	}

	/*static get SHIP_NAMES() {
		return SHIP_NAMES;
	}

	static get SHIP_COSTS() {
		return SHIP_COSTS;
	}

	static get SHIP_LVL_REQUIREMENTS() {
		return SHIP_LVL_REQUIREMENTS;
	}*/
}