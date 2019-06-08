declare var _CLIENT_: boolean;

import * as path from 'path';

//server side only use
var MAP_FOLDER = path.join(__dirname, '..', '..', '..', 'sources', 'assets', 'maps');
var on_load_listeners: Array<()=>void> = [];

var pending = 0;

if(!_CLIENT_) {
	var fs = require('fs');
	var Canvas = require('canvas');
	var ServerImage = Canvas.Image;
}

export interface MapJSON_I {
	//name: string;
	//data: MapDataSchema | null;
	//image: HTMLImageElement | null;
	map_size: number;

	//walls_image: string;
	walls_texture: HTMLImageElement;
	walls_color: number[];
	smooth_walls: boolean;

	//background_image: string;
	background_texture: HTMLImageElement;
	smooth_background: boolean;

	//background_scale: number;
	//background_color: number[];
	//smooth_texture: boolean;
	//use_svg: boolean;
	//entities: any;
	weather: string;
}

function loadImage(path: string | null) {
	pending++;
	let img = _CLIENT_ ? new Image() : new ServerImage();

	if(path === null)
		return img;

	img.onerror = console.error;

	img.onload = () => {
		pending--;
		if(pending === 0)
			on_load_listeners.forEach(l => l());
		//console.log(path, 'loaded');
	};

	if(_CLIENT_) {
		img.src = path;
	}
	else {
		//@ts-ignore
		fs.readFile(path, function(err, squid) {
			if(err) throw err;
			//var map_png = new Image();	
			//map_png.onerror = (e: string | Event) => printErr(e);*/

			img.src = squid;
		});
	}

	return img;
}

export function isReady() {
	return pending === 0;
}

export function onMapsLoaded(callback: ()=>void) {
	if(isReady())
		callback();
	else
		on_load_listeners.push(callback);
}

var self: {[index: string]: MapJSON_I} = {
	'Empty': {
		map_size: 5,
		walls_color: [156, 185, 237],//TODO - generate color object
		smooth_walls: false,
		smooth_background: false,
		weather: "dust",//TODO - enum this

		background_texture: loadImage(_CLIENT_ ? require('../maps/bg_flat.png') : null),
		walls_texture: loadImage(_CLIENT_ ? 
			require('../maps/Empty.png') : path.join(MAP_FOLDER, 'Empty.png'))
	},
	'Open Maze': {
		map_size: 5,
		walls_color: [156, 185, 237],//TODO - generate color object
		smooth_walls: true,
		smooth_background: true,
		weather: "dust",//TODO - enum this

		background_texture: loadImage(_CLIENT_ ? require('../maps/bg2.png') : null),
		walls_texture: loadImage(_CLIENT_ ? 
			require('../maps/OpenMaze.svg') : path.join(MAP_FOLDER, 'OpenMaze.png'))
	},
	'Simple Maze': {
		map_size: 5,
		walls_color: [128, 203, 196],//TODO - generate color object
		smooth_walls: false,
		smooth_background: false,
		weather: "clouds",//TODO - enum this

		background_texture: loadImage(_CLIENT_ ? require('../maps/bg3.png') : null),
		walls_texture: loadImage(_CLIENT_ ? 
			require('../maps/SimpleMaze.png') : path.join(MAP_FOLDER, 'SimpleMaze.png'))
	},
	'Snowflake': {
		map_size: 5,
		walls_color: [178, 235, 242],//TODO - generate color object
		smooth_walls: true,
		smooth_background: true,
		weather: "snow",//TODO - enum this

		background_texture: loadImage(_CLIENT_ ? require('../maps/bg1.png') : null),
		walls_texture: loadImage(_CLIENT_ ? 
			require('../maps/Snowflake.svg') : path.join(MAP_FOLDER, 'Snowflake.png'))
	}
};

export default self;