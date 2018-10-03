const Shield = (function(Object2D) {
	const SCALE_FACTOR = 1.9;

	const GROWING_TIME = 0.4, SHRINKING_TIME = 2.0;

	var sc;

	return class extends Object2DSmooth {
		constructor(player_handle, duration) {
			super();
			super.setScale(0, 0);
			super.setPos(player_handle.x, player_handle.y, true);//do not smooth initial position

			this.player_handle = player_handle;

			this.color = player_handle.painter.color;//color works as a player signature

			this.target_scale = player_handle.width * SCALE_FACTOR;
			this.duration = duration;
			this.timer = 0;

			if(typeof Entities !== 'undefined') {
				this.entity_name = Shield.entityName(this.color);//clientside only
				Entities.addObject(Entities[this.entity_name].id, this);
			}
		}

		destroy() {
			if(typeof Entities !== 'undefined')
				Entities.removeObject(Entities[this.entity_name].id, this);
		}

		update(delta) {
			if((this.timer += delta) >= this.duration)
				this.expired = true;

			if(this.timer <= GROWING_TIME)
				sc = this.timer / GROWING_TIME * this.target_scale;
			else if(this.duration-this.timer < SHRINKING_TIME)
				sc = Math.pow((this.duration-this.timer) / SHRINKING_TIME, 0.125) * this.target_scale;
			else
				sc = this.target_scale;

			super.setScale(sc, sc);
			super.setPos(this.player_handle.x, this.player_handle.y);

			super.update(delta);
		}

		static entityName(color) {
			return 'SHIELD_' + Object.values(Colors.PLAYERS_COLORS).indexOf(color);
		}
	};
})(
	typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js')
);

try {//export for NodeJS
	module.exports = Shield;
}
catch(e) {}