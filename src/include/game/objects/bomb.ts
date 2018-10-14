///<reference path="../objects/object2d.ts"/>
///<reference path="../common/colors.ts"/>
////<reference path="../../../client/game/entities.ts"/>

const Bomb = (function() {
	try {
		var _Object2D_: typeof Object2D = require('./object2d');
	}
	catch(e) {
		var _Object2D_ = Object2D;
	}

	const SCALE = 0.075, GROW_SCALE = 0.075, SHAKING_RADIUS = 0.02;
	const DELAY_TIME = 2, SHAKING_TIME = 2;

	var shake_factor, rand_a, sc;
	
	return class Bomb extends _Object2D_ {
		public parent: typeof Player.prototype;
		private initial_x: number;
		private initial_y: number;
		private timer: number;

		//NOTE - parent must constains a Painter instance as 'painter' property name
		//@parent - instance that 'owns' this bullet
		constructor(x: number, y: number, parent: typeof Player.prototype) {
			super();
			super.setPos(x, y);
			super.setScale(SCALE, SCALE);

			//this.color = color;//color works as a player signature
			this.parent = parent;

			this.initial_x = x;
			this.initial_y = y;

			this.timer = 0;

			//@ts-ignore
			if(typeof Entities !== 'undefined') {
				//@ts-ignore
				this.entity_name = Bomb.entityName(parent.painter.color);//clientside only
				//@ts-ignore
				Entities.addObject(Entities[this.entity_name].id, this);
			}
		}

		destroy() {
			//@ts-ignore
			if(typeof Entities !== 'undefined')
				//@ts-ignore
				Entities.removeObject(Entities[this.entity_name].id, this);
			
		}

		update(delta: number) {
			if( (this.timer+=delta) >= DELAY_TIME + SHAKING_TIME ) {
				this.expired = true;
				return;
			}

			if(this.timer > DELAY_TIME) {
				shake_factor = (this.timer - DELAY_TIME) / SHAKING_TIME;

				rand_a = Math.random() * Math.PI * 2.0;
				super.setPos(
					this.initial_x + Math.cos(rand_a) * SHAKING_RADIUS * shake_factor,
					this.initial_y + Math.sin(rand_a) * SHAKING_RADIUS * shake_factor
				);

				super.setRot( (Math.random() * 2.0 - 1.0) * Math.PI * shake_factor * 0.25 );

				sc = SCALE + GROW_SCALE * Math.pow(shake_factor, 4);
				super.setScale(sc, sc);
			}
			
		}

		static entityName(color: ColorsScope.ColorI) {
			return 'BOMB_' + Colors.PLAYERS_COLORS.indexOf(color);
			//return 'BOMB';
		}
	};
})();

try {//export for NodeJS
	module.exports = Bomb;
}
catch(e) {}