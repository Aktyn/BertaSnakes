import Object2D from './object2d';

const SCALE = 0.004;//HEIGHT SCALE
//const WIDENNESS = 8;//WIDTH = SCALE * WIDENNESS * hp
const HEIGHT_OFFSET = 1.3;//multiplier

const ETITY_NAME = 'HEALTH_BAR';

export default class HpBar extends Object2D {
	private _hp: number;
	private widenness: number;
	private visible: boolean;
	private regeneration: number;

	constructor(widenness: number, regeneration = 0) {
		super();
		super.setScale(widenness, 0);//NOTE - height = 0 initially

		this._hp = 1;
		this.widenness = widenness;
		this.visible = true;

		this.regeneration = regeneration;// || 0;//auto healing

		//@ts-ignore
		if(typeof Entities !== 'undefined')//client side
			//@ts-ignore
			Entities.EntitiesBase.addObject(Entities.EntitiesBase[ETITY_NAME].id, this);
	}

	destroy() {
		//@ts-ignore
		if(typeof Entities !== 'undefined')
			//@ts-ignore
			Entities.EntitiesBase.removeObject(Entities.EntitiesBase[ETITY_NAME].id, this);
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

	setVisible(visible: boolean) {
		if(visible && this._hp !== 1)
			super.setScale(this.widenness * this._hp, SCALE);
		else
			super.setScale(0, 0);
		this.visible = visible;
	}


	update_hpbar(delta: number, x: number, y: number, height: number) {
		if(this._hp !== 1) {
			if(this.regeneration !== 0)
				this.hp += this.regeneration * delta;

			if(this.visible === true)
				super.setPos(x, y + height*HEIGHT_OFFSET);
		}
	}
}