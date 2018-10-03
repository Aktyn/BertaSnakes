const HpBar = (function(Object2D) {
	const SCALE = 0.004;//HEIGHT SCALE
	//const WIDENNESS = 8;//WIDTH = SCALE * WIDENNESS * hp
	const HEIGHT_OFFSET = 1.3;//multiplier

	const ETITY_NAME = 'HEALTH_BAR';

	return class extends Object2D {
		constructor(widenness, regeneration) {
			super();
			super.setScale(widenness, 0);//NOTE - height = 0 initially

			this._hp = 1;
			this.widenness = widenness;
			this.visible = true;

			this.regeneration = regeneration || 0;//auto healing

			if(typeof Entities !== 'undefined')//client side
				Entities.addObject(Entities[ETITY_NAME].id, this);
		}

		destroy() {
			if(typeof Entities !== 'undefined')
				Entities.removeObject(Entities[ETITY_NAME].id, this);
		}

		get hp() {
			return this._hp;
		}

		set hp(value) {
			this._hp = Math.min(1, Math.max(0, value));
			if(this.visible === true && this._hp !== 1)
				super.setScale(this.widenness * this._hp, SCALE);
			else
				super.setScale(0, 0);
		}

		setVisible(visible) {
			if(visible && this._hp !== 1)
				super.setScale(this.widenness * this._hp, SCALE);
			else
				super.setScale(0, 0);
			this.visible = visible;
		}

		update(delta, x, y, height) {
			if(this._hp !== 1) {
				if(this.regeneration !== 0)
					this.hp += this.regeneration * delta;

				if(this.visible === true)
					super.setPos(x, y + height*HEIGHT_OFFSET);
			}
		}
	};
})(
	typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js')
);

try {//export for NodeJS
	module.exports = HpBar;
}
catch(e) {}