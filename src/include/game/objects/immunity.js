const Immunity = (function(Object2D) {
	const SCALE_FACTOR = 1.5;

	const GROWING_TIME = 0.4, SHRINKING_TIME = 2.0;
	const ENTITY_NAME = 'IMMUNITY_AUREOLE';

	var sc;

	return class extends Object2DSmooth {
		constructor(player_handle, duration) {
			super();
			super.setScale(0, 0);
			super.setPos(player_handle.x, player_handle.y, true);//do not smooth initial position

			this.player_handle = player_handle;

			this.target_scale = player_handle.width * SCALE_FACTOR;
			this.duration = duration;
			this.timer = 0;

			if(typeof Entities !== 'undefined')
				Entities.addObject(Entities[ENTITY_NAME].id, this);
		}

		destroy() {
			if(typeof Entities !== 'undefined')
				Entities.removeObject(Entities[ENTITY_NAME].id, this);
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
	};
})(
	typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js')
);

try {//export for NodeJS
	module.exports = Immunity;
}
catch(e) {}