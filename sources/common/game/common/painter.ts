import {ColorI} from './../common/colors';
import Vector from './../../utils/vector';

export default class Painter {
	private static DEFAULT_THICKNESS = 0.015;

	public lastPos: Vector;
	public color: ColorI;
	public thickness: number;
	public active = false;

	constructor(color: ColorI, thickness: number) {
		this.lastPos = new Vector.Vec2f(0, 0);//for painting purpouses
		this.color = color;
		this.thickness = thickness || Painter.DEFAULT_THICKNESS;

		// this.active = false;
	}
}