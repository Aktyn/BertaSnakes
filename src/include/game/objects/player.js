const Player = (function(Object2D, Movement, Sensor, Painter, Colors, Skills, Effects) {
	const TYPES = {//enum
		TRIANGLE: 0,
		SQUARE: 1,
		PENTAGON: 2
	};

	const SHIP_NAMES = ['Triangle ship', 'Square ship', 'Pentagon ship'];
	const SHIP_LVL_REQUIREMENTS = [1, 3, 6];//level required to be able to use ship
	const SHIP_COSTS = [0, 500, 3000];//coins required to buy ship

	//array of sensor shapes with order corresponding to player TYPES
	const PLAYER_SENSOR_SHAPES = [
		Sensor.SHAPES.TRIANGLE, Sensor.SHAPES.SQUARE, Sensor.SHAPES.PENTAGON
	];

	const PLAYER_BASIC_SKILLS = [Skills.SHOOT1, Skills.SHOOT2, Skills.SHOOT3];

	//initial parameters
	const SCALE = 0.05, THICKNESS = 0.015, MAX_SPEED = 0.4, TURN_SPEED = Math.PI;
	const POISON_STRENGTH = 0.1;

	var s_i, em_i;
	
	//(typeof module === 'undefined' ? Object2DSmooth : Object2D)
	var ExtendClass = (typeof module === 'undefined' ? Object2DSmooth : Object2D);
	return class extends ExtendClass {
		//@type - value from TYPES object, @skills - array of skills indexes
		constructor(type, skills, color) {//@color - color from Colors palette
			super();
			super.setScale(SCALE, SCALE);

			this.user_id = 0;//server-side use
			this.nick = '';
			this.level = 0;
			this.rank = 0;

			this.movement = new Movement();
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
						this.skills.push( Skills.getById(skill_id).create() );
					}
					else
						this.skills.push( null );
				});
			}
			catch(e) {
				console.error(e);
			}

			this.effects = new Effects(this);

			this.emoticons = [];//client-side only

			this._points = 0;
			this.kills = 0;
			this.deaths = 0;

			this.sensor = new Sensor( PLAYER_SENSOR_SHAPES[type] );
			this.painter = new Painter(color, THICKNESS);

			if(typeof Entities !== 'undefined') {
				this.entity_name = Player.entityName(type, color);//clientside only
				Entities.addObject(Entities[this.entity_name].id, this);
			}

			if(typeof Renderer !== 'undefined' && typeof PlayerEmitter !== 'undefined') {//client side
				this.emitter = Renderer.addEmitter( new PlayerEmitter(this) );
				this.poisoning_emitter = null;
			}
		}

		destroy() {
			if(typeof Entities !== 'undefined') {
				console.log('removing player from entities');
				Entities.removeObject(Entities[this.entity_name].id, this);
			}
			if(this.emitter)
				this.emitter.expired = true;
			if(this.poisoning_emitter)
				this.poisoning_emitter.expired = true;
		}

		onPoisoned() {//client-side only use for poisoning particle effect display
			if(this.poisoning_emitter === null)
				this.poisoning_emitter = Renderer.addEmitter( new PoisoningEmitter(this) );
			else
				this.poisoning_emitter.resetTimer();
		}

		//clientside only function
		showEmoticon(name) {//@name: string
			for(em_i=0; em_i<this.emoticons.length; em_i++)
				this.emoticons[em_i].endEffect();
			this.emoticons.push( new Emoticon(name, this) );
		}

		update(delta) {
			this.movement.applyMove(this, delta);

			for(s_i=0; s_i<this.skills.length; s_i++) {
				if(this.skills[s_i] !== null)
					this.skills[s_i].update(delta);
			}

			this.effects.update(delta);
			if(this.effects.isActive(Effects.POISONING))
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
				(this.effects.isActive(Effects.SHIELD) || 
					this.effects.isActive(Effects.SPAWN_IMMUNITY)) ) 
			{
				return;//do not update hp
			}

			this._hp = Math.min(1, Math.max(0, value));
		}

		get energy() {
			return this._energy;
		}

		set energy(value) {
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

		static get TYPES() {
			return TYPES;
		}

		static get SHIP_NAMES() {
			return SHIP_NAMES;
		}

		static get SHIP_COSTS() {
			return SHIP_COSTS;
		}

		static get SHIP_LVL_REQUIREMENTS() {
			return SHIP_LVL_REQUIREMENTS;
		}

		static entityName(type_i, color) {
			return 'PLAYER_' + type_i + '_' + Colors.PLAYERS_COLORS.indexOf(color);
		}
	};
})(
	typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js'),
	typeof Movement !== 'undefined' ? Movement : require('./../common/movement.js'),
	typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor.js'),
	typeof Painter !== 'undefined' ? Painter : require('./../common/painter.js'),
	typeof Colors !== 'undefined' ? Colors : require('./../common/colors.js'),
	typeof Skills !== 'undefined' ? Skills : require('./../common/skills.js'),
	typeof Effects !== 'undefined' ? Effects : require('./../common/effects.js')
);

try {//export for NodeJS
	module.exports = Player;
}
catch(e) {}