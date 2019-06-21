import Object2D from './object2d';
import Movement from './../common/movement';
import PoisonousEnemy from './poisonous_enemy';

declare var _CLIENT_: boolean;
if(_CLIENT_) {
	var EntitiesBase = require('../../../client/game/entities').default;

	var RendererBase = require('../../../client/game/renderer').default;
	var WebGLRenderer = require('../../../client/game/webgl_renderer').default;
	var SpawnerEmitter = require('../../../client/game/emitters/spawner_emitter').default;
}

const SCALE = 0.15, GROWING_TIME = 1, SHRINKING_TIME = 1, ENEMY_GROWING_TIME = 0.5, GAP_TIME = 2.0;
const ETITY_NAME = 'ENEMY_SPAWNER', POISONOUS_ENTITY_NAME = 'POISONOUS_ENEMY_SPAWNER';

export default class EnemySpawner extends Object2D {
	private timer = 0;
	private state = 0;

	private emitter: any;

	private enemy: any;

	private entity_name?: string;

	constructor(enemy: any) {//@enemy - instance of Enemy
		super();

		super.setScale(0, 0);
		super.setPos( enemy.x, enemy.y );

		enemy.spawning = true;
		enemy.setScale(0, 0);//invisible while spawning
		this.enemy = enemy;

		// this.state = 0;
		// this.timer = 0.0;

		//@ts-ignore
		if(typeof EntitiesBase !== 'undefined') {
			this.entity_name = enemy instanceof PoisonousEnemy ? POISONOUS_ENTITY_NAME:ETITY_NAME;
			//@ts-ignore
			EntitiesBase.addObject(EntitiesBase.getEntityId(this.entity_name), this);
		}

		//@ts-ignore
		if(typeof RendererBase !== 'undefined' && typeof SpawnerEmitter !== 'undefined' &&
			//@ts-ignore
			RendererBase.getCurrentInstance() instanceof WebGLRenderer) 
		{//client side
			//@ts-ignore
			this.emitter = WebGLRenderer.addEmitter( 
				//@ts-ignore
				new SpawnerEmitter(enemy instanceof PoisonousEnemy) );
		}
	}

	destroy() {
		//@ts-ignore
		if(typeof EntitiesBase !== 'undefined')
			//@ts-ignore
			EntitiesBase.removeObject(EntitiesBase.getEntityId(this.entity_name), this);

		if(this.enemy) {
			this.enemy.spawning = false;
			this.enemy.movement.set( Movement.FLAGS.UP, true );//enemy moving forward
		}
		if(this.emitter)
			this.emitter.expired = true;
	}

	nextState(curr_state_duration: number) {
		this.state++;
		this.timer -= curr_state_duration;
	}

	update(delta: number) {
		this.timer += delta;

		switch(this.state) {
			case 0: {//popping up ring bariere
				var sc = SCALE * (this.timer / GROWING_TIME);

				if(sc >= SCALE) {
					sc = SCALE;
					this.nextState(GROWING_TIME);
				}
				super.setScale(sc, sc);
			}	break;
			case 1: 
				if(this.timer >= GAP_TIME)
					this.nextState(GAP_TIME);
				break;
			case 2: {//popping up enemy
				var sc2 = this.enemy.SCALE * (this.timer / ENEMY_GROWING_TIME);

				if(sc2 >= this.enemy.SCALE) {
					sc2 = this.enemy.SCALE;
					this.nextState(ENEMY_GROWING_TIME);
				}

				this.enemy.setScale(sc2, sc2);
			}	break;
			case 3: {//shrinking bariere
				var sc3 = SCALE * (1.0 - (this.timer / SHRINKING_TIME));

				if(sc3 <= 0) {
					sc3 = 0;
					this.nextState(SHRINKING_TIME);

					// this.enemy.spawning = false;
					// this.enemy.movement.set( Movement.UP, true );//enemy moving forward
				}
				super.setScale(sc3, sc3);
			}	break;
			case 4:
				this.expired = true;
				this.nextState(0);
				break;
			default: 
				break;
		}
		
		super.update(delta);

		if(this.emitter)
			this.emitter.update(delta, this.x, this.y, this.state >= 3);
	}

	/*static get SCALE() {
		return SCALE;
	}*/
	public static SCALE = SCALE;
}