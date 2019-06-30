import Object2D from './object2d';

declare var _CLIENT_: boolean;
if(_CLIENT_)
	var EntitiesBase = require('../../../client/game/entities').default;

const SCALE_FACTOR = 1.5;

const GROWING_TIME = 0.4, SHRINKING_TIME = 2.0;
const ENTITY_NAME = 'IMMUNITY_AUREOLE';

var sc;

export default class Immunity extends /*Object2DSmooth*/Object2D {
	private player_handle: Object2D;//NOTE - it doesn't have to be a Player class
	private readonly target_scale: number;
	private readonly duration: number;
	private timer: number;

	constructor(player_handle: Object2D, duration: number) {
		super();
		super.setScale(0, 0);
		super.setPos(player_handle.x, player_handle.y/*, true*/);//do not smooth initial position

		this.player_handle = player_handle;

		this.target_scale = player_handle.width * SCALE_FACTOR;
		this.duration = duration;
		this.timer = 0;

		//@ts-ignore
		if(typeof EntitiesBase !== 'undefined') {
			//@ts-ignore
			EntitiesBase.addObject(EntitiesBase.getEntityId(ENTITY_NAME), this);
		}
	}

	destroy() {
		//@ts-ignore
		if(typeof EntitiesBase !== 'undefined')
			//@ts-ignore
			EntitiesBase.removeObject(EntitiesBase.getEntityId(ENTITY_NAME), this);
	}

	update(delta: number) {
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
}