import Object2D from './object2d';
import Colors, {ColorI} from './../common/colors';

const SCALE_FACTOR = 1.9;
const GROWING_TIME = 0.4, SHRINKING_TIME = 2.0;

var sc;

export default class Shield extends Object2D {
	private player_handle: Object2D;
	private color: ColorI;

	private target_scale: number;
	private duration: number;
	private timer = 0;

	private entity_name?: string;

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

		//@ts-ignore
		if(typeof Entities !== 'undefined') {
			this.entity_name = Shield.entityName(this.color);//clientside only
			//@ts-ignore
			Entities.EntitiesBase.addObject(Entities.EntitiesBase[this.entity_name].id, this);
		}
	}

	destroy() {
		//@ts-ignore
		if(typeof Entities !== 'undefined')
			//@ts-ignore
			Entities.EntitiesBase.removeObject(Entities.EntitiesBase[this.entity_name].id, this);
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
		return 'SHIELD_' + (<ColorI[]>Colors.PLAYERS_COLORS).indexOf(color);
	}
}