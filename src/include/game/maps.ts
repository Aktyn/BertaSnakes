/*Loads avaible maps data from files alogn with each map's texture*/
//NOTE - accessable object is of a JSON format with each key name coresponding to map name
/*interface MapDataSchema {
	size: number;
	background_color: number[];
	smooth_texture: boolean;
	use_svg: boolean;
	entities: any;
	weather: string;
}*/
///<reference path="common/colors.ts"/>

interface MapJSON_I {
	name: string;
	//data: MapDataSchema | null;
	//image: HTMLImageElement | null;
	map_size: number;

	walls_image: string;
	walls_texture: HTMLImageElement;
	walls_color: number[];
	smooth_walls: boolean;

	background_image: string;
	background_texture: HTMLImageElement;
	smooth_background: boolean;

	//background_scale: number;
	//background_color: number[];
	//smooth_texture: boolean;
	//use_svg: boolean;
	//entities: any;
	weather: string;
}

interface MapObjectI {
	loaded: () => boolean;
	onLoad: (cb: () => any) => void;
	getByName: (map_name: string) => MapJSON_I | null;
	[index: string]: any;
}

const Maps: MapObjectI = (function() {
	const MAP_FOLDER = typeof module === 'undefined' ? 'maps/' : 'assets/maps/';
	
	var fs: any, Canvas, Image: any, _Colors_: typeof ColorsScope.Colors;
	if(typeof module !== 'undefined') {
		fs = require('fs');
		Canvas = require('canvas');
  		Image = Canvas.Image;
  		_Colors_ = require('./common/colors');
	}
	else
		_Colors_ = ColorsScope.Colors;

	var pending = 1;//currently loading resources (0 means loaded)
	var onLoadCallbacks: Function[] = [];

	var self: MapObjectI = {
		loaded: () => pending === 0,
		onLoad: function(callback) {
			if(typeof callback !== 'function')
				throw new Error('callback must be a function');
			if(this.loaded())
				callback();
			else
				onLoadCallbacks.push( callback );
		},

		getByName: function(map_name) {
			for(let map_i in this) {
				if(typeof this[map_i] !== 'object')
					continue;
				if(this[map_i].name === map_name) {
					return this[map_i];
				}
			}
			return null;
		}
	};

	const printErr: ErrorEventHandler = (e: string | Event) => console.error(e);

	function fixJSON(str: string) {
		str = str.replace(/(\/\/.*)|\n|\s/gi, '');
		str = '{' + str + '}';
		return str
			.replace(/(,|\{)([^,:\{\}]+):/gi, '$1"$2":')
			.replace(/,\}/g, '}');
	}



	function fixMapJSON(map: MapJSON_I, map_name: string) {
		map['name'] = map_name;

		if(typeof map['walls_image'] !== 'string')
			throw "You must set walls_image in " + map['name'] + ".map";
		if(typeof map['background_image'] !== 'string')
			throw "You must set background_image in " + map['name'] + ".map";

		//set not specified values to default
		map['map_size'] = map['map_size'] || 1;
		map['smooth_walls'] = !!map['smooth_walls'];
		map['smooth_background'] = !!map['smooth_background'];
		//map['background_scale'] = map['background_scale'] || 1;
		map['weather'] = map['weather'] || "dust";

		map['walls_color'] = map['walls_color'] || [255, 255, 255];

		//var color_in_use = false;
		for(var col in _Colors_) {
			//@ts-ignore
			if(typeof _Colors_[col] === 'object') {
				//@ts-ignore
				var buff = (<ColorsScope.ColorI>_Colors_[col]).byte_buffer;
				if(buff && _Colors_.compareByteBuffers(buff, map['walls_color'])) {
					throw "The same exact color is already in use. Choose different walls color of change it a little.";
				}
			}
		}
		for(var ii=0; ii<_Colors_.PLAYERS_COLORS.length; ii++) {
			if(_Colors_.compareByteBuffers(map['walls_color'], _Colors_.PLAYERS_COLORS[ii].byte_buffer))
				throw "The same exact color is already in use. Choose different walls color of change it a little.";
		}
	}

	function onMapDataLoadedClient(map: MapJSON_I, map_name: string) {
		fixMapJSON(map, map_name);

		let walls_texture = document.createElement('img');
		let background_texture = document.createElement('img');

		walls_texture.onload = () => {
			map['walls_texture'] = walls_texture;
			
			background_texture.onload = () => {
				map['background_texture'] = background_texture;

				self[map['name']] = map;
				pending--;
			};

			background_texture.setAttribute('src', MAP_FOLDER + map['background_image']);
		};

		walls_texture.onerror = (e: string | Event) => printErr(e);
		background_texture.onerror = (e: string | Event) => printErr(e);

		walls_texture.setAttribute('src', MAP_FOLDER + map['walls_image']);
	}

	//TODO - server-site support for svg

	function onMapDataLoadedServer(map: MapJSON_I, map_name: string) {
		fixMapJSON(map, map_name);

		//server can load only .png (TODO - .svg support)
		let image_path = map.walls_image.replace(/\.svg$/i, '.png');

		fs.readFile(MAP_FOLDER + image_path, function(err: Error, squid: string) {
			if(err) throw err;
			var map_png = new Image();
			
			map_png.onload = () => {
				map.walls_texture = map_png;
			
				self[map.name] = map;
				pending--;
			};
			map_png.onerror = (e: string | Event) => printErr(e);

			map_png.src = squid;
		});
	}

	function loadMaps(maps_names: string[]) {
		maps_names.forEach((map_name, index) => {//for each map
			pending++;

			//loading map data
			if(typeof module === 'undefined') {//client side
				fetch(MAP_FOLDER + map_name + '.map').then(resp => resp.text()).then(map_data => {
					//map.data = <MapDataSchema>JSON.parse(fixJSON(map_data));
					onMapDataLoadedClient( JSON.parse(fixJSON(map_data)), map_name );
				}).catch(printErr);
			}
			else {//server side
				fs.readFile(MAP_FOLDER + map_name + '.map', 'utf8', (err: Error, map_data: string) => {
					if(err) throw err;
					//map.data = <MapDataSchema>JSON.parse(fixJSON(map_data));
					onMapDataLoadedServer( JSON.parse(fixJSON(map_data)), map_name );
				});
			}
		});

		pending--;
	}

	//loading list of files in MAP_FOLDER
	if(typeof module === 'undefined') {
		//client side
		fetch('/get_list_of_maps').then(resp => resp.json())
			.then(loadMaps).catch(printErr);
	}
	else {
		//server side
		fs.readdir(MAP_FOLDER, (err: Error, files: string[]) => {
			if(err) throw err;
			
			loadMaps( files.filter(f => f.endsWith('.map')).map(f => f.split('.')[0]) );
		});
	}

	let checkLoaded = () => {
		if(self.loaded())
			onLoadCallbacks.forEach(cb => cb());
		else
			setTimeout(checkLoaded, 100);
	};
	checkLoaded();

	return self;
})();

try {//export for NodeJS
	module.exports = Maps;
}
catch(e) {}
// if(global._CLIENT_)
	// module.exports = Maps;
// export default Maps;