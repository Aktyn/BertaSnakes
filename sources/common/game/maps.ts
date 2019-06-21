declare var _CLIENT_: boolean;

import * as path from 'path';

//server side only use
var MAP_FOLDER = path.join(__dirname, '..', '..', '..', 'sources', 'common', 'maps');
var on_load_listeners: Array<()=>void> = [];

var pending = 0;

if( !_CLIENT_ ) {
	var fs = require('fs');
	var Canvas = require('canvas');
	var ServerImage = Canvas.Image;
}

export const enum WEATHER_TYPE {
	DUST = 0,
	SNOW,
	CLOUDS
}

export interface MapJSON_I {
	map_size: number;

	walls_texture: HTMLImageElement;
	walls_color: number[];
	smooth_walls: boolean;

	background_texture: HTMLImageElement;
	smooth_background: boolean;

	weather: WEATHER_TYPE;
}

function loadImage(path: string | null) {
	let img = _CLIENT_ ? new Image() : new ServerImage();

	if(path === null)
		return img;

	img.onerror = console.error;

	pending++;
	img.onload = () => {
		pending--;
		if( isReady() )
			on_load_listeners.forEach(l => l());
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
	if( isReady() )
		callback();
	else
		on_load_listeners.push(callback);
}

function extendType<T>(maps_literal: T): T & {[index: string]: MapJSON_I} {
	return maps_literal as T & {[index: string]: MapJSON_I};
}

// const self = {
export default extendType({
	'Empty': {
		map_size: 5,
		walls_color: [156, 185, 237],//TODO - generate SERIALIZABLE color object
		smooth_walls: false,
		smooth_background: false,
		weather: WEATHER_TYPE.DUST,

		background_texture: loadImage(_CLIENT_ ? require('../maps/bg_flat.jpg') : null),
		walls_texture: loadImage(_CLIENT_ ? 
			require('../maps/Empty.png') : path.join(MAP_FOLDER, 'Empty.png'))
	} as MapJSON_I,
	'Open Maze': {
		map_size: 5,
		walls_color: [156, 185, 237],
		smooth_walls: true,
		smooth_background: true,
		weather: WEATHER_TYPE.DUST,

		background_texture: loadImage(_CLIENT_ ? require('../maps/bg2.jpg') : null),
		walls_texture: loadImage(_CLIENT_ ? 
			require('../maps/OpenMaze.svg') : path.join(MAP_FOLDER, 'OpenMaze.png'))
	} as MapJSON_I,
	'Simple Maze': {
		map_size: 5,
		walls_color: [128, 203, 196],
		smooth_walls: false,
		smooth_background: false,
		weather: WEATHER_TYPE.CLOUDS,

		background_texture: loadImage(_CLIENT_ ? require('../maps/bg3.png') : null),
		walls_texture: loadImage(_CLIENT_ ? 
			require('../maps/SimpleMaze.png') : path.join(MAP_FOLDER, 'SimpleMaze.png'))
	} as MapJSON_I,
	'Snowflake': {
		map_size: 5,
		walls_color: [178, 235, 242],
		smooth_walls: true,
		smooth_background: true,
		weather: WEATHER_TYPE.SNOW,

		background_texture: loadImage(_CLIENT_ ? require('../maps/bg1.jpg') : null),
		walls_texture: loadImage(_CLIENT_ ? 
			require('../maps/Snowflake.svg') : path.join(MAP_FOLDER, 'Snowflake.png'))
	} as MapJSON_I
});

// export default extendType(self);