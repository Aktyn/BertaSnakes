import Object2D from './object2d';

const SCALE = 0.07, DURATION = 2, FADING_DURATION = 0.5;//durations in seconds
const OFFSET_ANGLE = Math.PI / 4.0, PARENT_OFFSET = 0.15;

let sc = 0;

export const EMOTS = [//NOTE - use uppercase letters for key values
	{	file_name: 'hand.png', 		key: 'Q'	},
	{	file_name: 'happy.svg', 	key: 'E'	},
	{	file_name: 'sad.svg', 		key: 'R'	},
	{	file_name: 'laugh.svg', 	key: 'T'	},
	{	file_name: 'angry.svg', 	key: 'Y'	},
	{	file_name: 'shocked.svg',	key: 'U'	},
	{	file_name: 'inlove.svg',	key: 'I'	},
	{	file_name: 'dead.svg',		key: 'O'	},
];

export default class Emoticon extends Object2D {
	private readonly name: string;
	private parent: Object2D;
	private factor = 0;
	private timer = 0;
	private readonly streak: Object2D;

	private readonly entitiesClass: any;

	constructor(name: string, parent: Object2D, _entitiesClass?: any) {
		super();
		super.setScale(0, 0);

		this.entitiesClass = _entitiesClass;
		
		this.name = name;
		this.parent = parent;

		// this.factor = 0;
		// this.timer = 0;

		this.streak = new Object2D();
		this.streak.setRot( OFFSET_ANGLE );

		if(this.entitiesClass) {
			this.entitiesClass.addObject(this.entitiesClass.getEntityId('STREAK'), this.streak);
			this.entitiesClass.addObject(
				this.entitiesClass.getEntityId(Emoticon.entityName(this.name)), this);
		}
	}

	destroy() {
		if(this.entitiesClass) {
			this.entitiesClass.removeObject(this.entitiesClass.getEntityId('STREAK'), this.streak);
			this.entitiesClass.removeObject(
				this.entitiesClass.getEntityId(Emoticon.entityName(this.name)), this);
		}
	}

	endEffect() {//force end
		this.timer = Math.max(this.timer, DURATION - FADING_DURATION);
	}

	update(delta: number) {
		if( (this.timer += delta) > DURATION )
			this.expired = true;

		if(this.factor < 1) {//showing up factor
			if( (this.factor += delta*3.0) > 1 )
				this.factor = 1;
		}

		if(DURATION-this.timer < FADING_DURATION)
			sc = Math.pow((DURATION-this.timer) / FADING_DURATION, 2) * SCALE;
		else
			sc = Math.pow(this.factor, 2) * SCALE;

		super.setPos(
			this.parent.x + Math.cos(OFFSET_ANGLE) * Math.pow(this.factor, 2) * PARENT_OFFSET, 
			this.parent.y + Math.sin(OFFSET_ANGLE) * Math.pow(this.factor, 2) * PARENT_OFFSET
		);
		this.streak.setPos(
			(this.x + this.parent.x) / 2,
			(this.y + this.parent.y) / 2
		);
		

		this.streak.setScale(sc, PARENT_OFFSET*0.5 * Math.pow(this.factor, 2));

		super.setScale(sc, sc);
		
	}

	public static entityName(emoticon_name: string) {
		return 'EMOT_' + emoticon_name.replace(/\.[a-zA-Z]+/gi, '');//NOTE: removes extension
	}
}