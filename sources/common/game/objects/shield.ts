import Object2D from './object2d';
import Colors, {ColorI} from './../common/colors';

declare var _CLIENT_: boolean;
if(_CLIENT_)
	{ // noinspection ES6ConvertVarToLetConst
		var EntitiesBase = require('../../../client/game/entities').default;
	}

const SCALE_FACTOR = 1.9;
const GROWING_TIME = 0.4, SHRINKING_TIME = 2.0;

let sc;

export default class Shield extends Object2D {
	private player_handle: Object2D;
	private readonly color: ColorI;

	private readonly target_scale: number;
	private readonly duration: number;
	private timer = 0;

	private readonly entity_name?: string;

	constructor(player_handle: Object2D, duration: number) {
		super();

		super.setScale(0, 0);
		super.setPos(player_handle.x, player_handle.y/*, true*/);//do not smooth initial position

		this.player_handle = player_handle;

		//@ts-ignore
		this.color = player_handle.painter.color;//color works as a player signature

		this.target_scale = player_handle.width * SCALE_FACTOR;
		this.duration = duration;
		//this.timer = 0;

		if(_CLIENT_) {
			EntitiesBase = require('../../../client/game/entities').default;
			if(typeof EntitiesBase !== 'undefined') {
				this.entity_name = Shield.entityName(this.color);//client-side only
				//@ts-ignore
				EntitiesBase.addObject(EntitiesBase.getEntityId(this.entity_name), this);
			}
		}
	}

	destroy() {
		//@ts-ignore
		if(typeof EntitiesBase !== 'undefined')
			//@ts-ignore
			EntitiesBase.removeObject(EntitiesBase.getEntityId(this.entity_name as string), this);
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

	static entityName(color: ColorI) {
		return 'SHIELD_' + Colors.PLAYERS_COLORS.indexOf(color);
	}
}