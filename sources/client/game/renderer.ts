import Assets from './engine/assets';
import {Vec3f} from '../../common/utils/vector';
import Player from '../../common/game/objects/player';
import GameMap from '../../common/game/game_map';

const CAMERA_SMOOTHING = 3;

let current_instance: RendererBase | null = null;//stores lastly created instance

export default abstract class RendererBase {
	protected map: GameMap;

	public focused: Player | null;

	protected camera: Vec3f;
	private readonly _zoom: number;

	protected constructor(map: GameMap) {
		if(current_instance)
			throw new Error('Only single instance of Renderer is allowed');
		
		if(Assets.loaded() !== true)
			throw new Error('Game assets are not loaded');

		//this.GUI = new ClientGame.GameGUI();

		this.map = map;//handle to map instance
		this.focused = null;//handle to focused player

		this.camera = new Vec3f(0, 0, 1);
		this._zoom = 0.6;//0.8
		
		current_instance = this;
	}

	destroy() {
		current_instance = null;
	}

	abstract getAspect(): number;
	abstract getHeight(): number;

	focusOn(player: Player) {
		this.focused = player;
	}

	withinVisibleArea(x: number, y: number, offset: number) {
		let a = this.getAspect();
		
		return 	x+offset > this.camera.x - a/this.camera.z && 
				x-offset < this.camera.x + a/this.camera.z &&
				y+offset > this.camera.y - 1.0/this.camera.z &&
				y-offset < this.camera.y + 1.0/this.camera.z;
	}

	/*zoom(factor: number) {
		if(this.focused === null)//free camera
			this._zoom = Math.min(1, Math.max(1 / this.map.map_size, this._zoom + factor * 0.1));
	}*/

	freeMoveCamera(pixX: number, pixY: number) {
		let factor = (this.map.map_size - 1) / 2.0 / this.camera.z;
		this.camera.x -= pixX / this.getHeight() * factor;
		this.camera.y += pixY / this.getHeight() * factor;
	}

	updateCamera(delta: number) {
		let a = this.getAspect();
		let sqrtA = this.focused === null ? 1.0 : Math.sqrt(a);
		//console.log(sqrtA);

		if(this._zoom*sqrtA !== this.camera.z) {
			
			this.camera.z += (this._zoom*sqrtA - this.camera.z) * delta * 6.0;

			// if(Math.abs(this.camera.z - this.zoom) < 0.001)
			if(Math.abs(this.camera.z - this._zoom*sqrtA) < 0.001)
				this.camera.z = this._zoom*sqrtA;
		}
		if(this.focused !== null) {
			let dtx = this.focused.x - this.camera.x;
			let dty = this.focused.y - this.camera.y;
			this.camera.x += dtx * delta * CAMERA_SMOOTHING * this.camera.z;
			this.camera.y += dty * delta * CAMERA_SMOOTHING * this.camera.z;
		}
		//else
		///	this.camera.set(this.focused.x, this.focused.y);//camera movement without smoothing

		//clamping to edges
		
		let cam_max = this.map.map_size - 1/this.camera.z;
		let cam_max_a = this.map.map_size - a/this.camera.z;
		if(this.camera.y > cam_max)
			this.camera.y = cam_max;
		else if(this.camera.y < -cam_max)
			this.camera.y = -cam_max;
		
		if(this.camera.z * this.map.map_size > a) {
			if(this.camera.x > cam_max_a)
				this.camera.x = cam_max_a;
			else if(this.camera.x < -cam_max_a)
				this.camera.x = -cam_max_a;
		}
		else
			this.camera.x = 0;
	}

	draw(delta: number) {
		if(delta <= 0.5) {
			//if(this.focused !== null)
			//	this.GUI.update( this.focused, delta );
			this.updateCamera(delta);
		}
	}

	static getCurrentInstance(): RendererBase {
		if(current_instance === null)
			throw "No current instance";
		return current_instance;
	}
}