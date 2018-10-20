///<reference path="../common/movement.ts"/>
///<reference path="../common/painter.ts"/>
///<reference path="../common/colors.ts"/>
///<reference path="../common/skills.ts"/>
///<reference path="../common/effects.ts"/>
///<reference path="../common/sensor.ts"/>

///<reference path="object2d_smooth.ts"/>
////<reference path="../../../client/game/entities.ts"/>

///<reference path="emoticon.ts"/>

////<reference path="../../../client/game/emitters/player_emitter.ts"/>
////<reference path="../../../client/game/emitters/poisoning_emitter.ts"/>

var Player = (function(/*Object2D, Movement, Sensor, Painter, Colors, Skills, Effects*/) {
// namespace PlayerScope {

	try {
		//var _Object2D_: typeof Object2D = require('./object2d');
		var _ExtendClass_: typeof Object2D = require('./object2d');
		//var _Object2DSmooth_: typeof Object2DSmooth = require('./object2d_smooth');
		var _Movement_: typeof Movement = require('./../common/movement');
		var _Sensor_: typeof Sensor = require('./../common/sensor');
		var _Painter_: typeof Painter = require('./../common/painter');
		var _Colors_: typeof Colors = require('./../common/colors');
		var _Skills_: typeof Skills = require('./../common/skills');
		var _Effects_: typeof Effects = require('./../common/effects');
	}
	catch(e) {
		//var _Object2D_ = Object2D;
		//@ts-ignore
		var _ExtendClass_ = Object2DSmooth;
		//var _Object2DSmooth_ = Object2DSmooth;
		var _Movement_ = Movement;
		var _Sensor_ = Sensor
		var _Painter_ = Painter;
		var _Colors_ = Colors;
		var _Skills_ = Skills
		var _Effects_ = Effects;
	}

	const TYPES = {//enum
		TRIANGLE: 0,
		SQUARE: 1,
		PENTAGON: 2
	};

	//array of sensor shapes with order corresponding to player TYPES
	const PLAYER_SENSOR_SHAPES: number[][][] = [
		_Sensor_.SHAPES.TRIANGLE, _Sensor_.SHAPES.SQUARE, _Sensor_.SHAPES.PENTAGON
	];

	const PLAYER_BASIC_SKILLS: SkillsScope.SkillData[] = [
		<SkillsScope.SkillData>_Skills_.SHOOT1, 
		<SkillsScope.SkillData>_Skills_.SHOOT2, 
		<SkillsScope.SkillData>_Skills_.SHOOT3
	];

	//initial parameters
	const SCALE = 0.05, THICKNESS = 0.015, MAX_SPEED = 0.4, TURN_SPEED = Math.PI;
	const POISON_STRENGTH = 0.1;

	var s_i, em_i;
	
	//(typeof module !== 'undefined' ? _Object2D_ : _Object2DSmooth_)
	return class Player extends _ExtendClass_ {
		public static SHIP_NAMES = ['Triangle ship', 'Square ship', 'Pentagon ship'];
		public static SHIP_LVL_REQUIREMENTS = [1, 3, 6];//level required to be able to use ship
		public static SHIP_COSTS = [0, 500, 3000];//coins required to buy ship

		public user_id: number;
		public nick: string;
		public level: number;
		public rank: number;
		public movement: MovementScope.Movement;
		readonly type: number;
		private _hp: number;
		private _energy: number;
		public skills: (SkillsScope.SkillObject | null)[];
		public effects: EffectsScope.Effects;
		private emoticons: any[] = [];//NOTE - only clientside used
		private _points: number;
		public kills: number;
		public deaths: number;
		public sensor: Sensor;
		public painter: Painter;

		private entity_name?: string;

		private poisoning_emitter: any;
		private emitter: any;

		public spawning?: boolean;
		
		constructor(type: number, skills: (number | null)[], color: ColorsScope.ColorI) {
			super();
			super.setScale(SCALE, SCALE);

			this.user_id = 0;//server-side use
			this.nick = '';
			this.level = 0;
			this.rank = 0;

			this.movement = new _Movement_();
			this.movement.setOptions({
				maxSpeed: MAX_SPEED,//initial player speed
				turnSpeed: TURN_SPEED
			});

			this.type = type;
			this._hp = 1;
			this._energy = 1;

			//list of skills avaible by player (skills bar)
			this.skills = [ PLAYER_BASIC_SKILLS[type].create() ];//basic skill (space)

			try {
				skills.forEach((skill_id, index) => {
					if(skill_id !== null) {
						let skill_schema = _Skills_.getById(skill_id);
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

			this.effects = new _Effects_(this);

			//this.emoticons = [];//client-side only

			this._points = 0;
			this.kills = 0;
			this.deaths = 0;

			this.sensor = new _Sensor_( PLAYER_SENSOR_SHAPES[type] );
			this.painter = new _Painter_(color, THICKNESS);

			//@ts-ignore
			if(typeof Entities !== 'undefined') {
				this.entity_name = Player.entityName(type, color);//clientside only
				//@ts-ignore
				Entities.addObject(Entities[this.entity_name].id, this);
			}

			//@ts-ignore //client side
			if(typeof Renderer !== 'undefined' && typeof Emitters !== 'undefined') {
				//@ts-ignore
				this.emitter = Renderer.Class.addEmitter( new Emitters.Player(this) );
				this.poisoning_emitter = null;
			}
		}

		destroy() {
			//@ts-ignore
			if(typeof Entities !== 'undefined') {
				console.log('removing player from entities');
				//@ts-ignore
				Entities.removeObject(Entities[this.entity_name].id, this);
			}
			if(this.emitter)
				this.emitter.expired = true;
			if(this.poisoning_emitter)
				this.poisoning_emitter.expired = true;
		}

		onPoisoned() {//client-side only use for poisoning particle effect display
			if(this.poisoning_emitter === null)
				//@ts-ignore
				this.poisoning_emitter = Renderer.Class.addEmitter( new Emitters.Poisoning(this) );
			else
				this.poisoning_emitter.resetTimer();
		}

		//clientside only function
		showEmoticon(name: string) {
			for(em_i=0; em_i<this.emoticons.length; em_i++)
				this.emoticons[em_i].endEffect();
			this.emoticons.push( new Emoticon(name, <Object2D><any>this) );
		}

		update(delta: number) {
			this.movement.applyMove(<Object2D><unknown>this, delta);

			for(s_i=0; s_i<this.skills.length; s_i++) {
				if(this.skills[s_i] !== null)
					//@ts-ignore
					this.skills[s_i].update(delta);
			}

			this.effects.update(delta);
			if(this.effects.isActive(_Effects_.TYPES.POISONING))
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
				(this.effects.isActive(_Effects_.TYPES.SHIELD) || 
					this.effects.isActive(_Effects_.TYPES.SPAWN_IMMUNITY)) ) 
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

		static get INITIAL_SCALE() {
			return SCALE;
		}

		//static get TYPES() {
		//	return TYPES;
		//}
		public static TYPES = TYPES;

		/*static get SHIP_NAMES() {
			return SHIP_NAMES;
		}

		static get SHIP_COSTS() {
			return SHIP_COSTS;
		}

		static get SHIP_LVL_REQUIREMENTS() {
			return SHIP_LVL_REQUIREMENTS;
		}*/

		static entityName(type_i: number, color: ColorsScope.ColorI) {
			return 'PLAYER_' + type_i + '_' + _Colors_.PLAYERS_COLORS.indexOf(color);
		}
	};
})(
	// typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js'),
	// typeof Movement !== 'undefined' ? Movement : require('./../common/movement'),
	// typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor'),
	// typeof Painter !== 'undefined' ? Painter : require('./../common/painter'),
	// typeof Colors !== 'undefined' ? Colors : require('./../common/colors'),
	// typeof Skills !== 'undefined' ? Skills : require('./../common/skills'),
	// typeof Effects !== 'undefined' ? Effects : require('./../common/effects')
);

// var Player = PlayerScope.Player;

try {//export for NodeJS
	module.exports = Player;
}
catch(e) {}