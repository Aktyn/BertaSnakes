/*Loads avaible maps data from files alogn with each map's texture*/
//NOTE - accessable object is of a JSON format with each key name coresponding to map name
interface MapDataSchema {
	size: number;
	background_color: number[];
	smooth_texture: boolean;
	entities: any;
}

interface MapJSON_I {
	name: string;
	data: MapDataSchema | null;
	image: HTMLImageElement | null;
}

interface MapObjectI {
	loaded: () => boolean;
	onLoad: (cb: () => any) => void;
	getByName: (map_name: string) => MapJSON_I | null;
	[index: string]: any;
}

const Maps: MapObjectI = (function() {
	const MAP_FOLDER = typeof module === 'undefined' ? 'maps/' : 'assets/maps/';
	
	var fs: any, Canvas, Image: any;
	if(typeof module !== 'undefined') {
		fs = require('fs');
		Canvas = require('canvas');
  		Image = Canvas.Image;
	}

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

	function onMapDataLoadedClient(map: MapJSON_I) {
		//loading .png map texture
		let map_png = document.createElement('img');

		map_png.onload = () => {
			map.image = map_png;
			self[map.name] = map;
			pending--;
			//console.log(self);

			/*if(index === maps_names.length-1) {
				console.log('Maps data loaded');
				console.log(self);
			}*/
			
		};
		map_png.onerror = printErr;
		// map_png.src = MAP_FOLDER + map.name + '.png';
		map_png.setAttribute('src', MAP_FOLDER + map.name + '.png');//07.10.2018
	}

	function onMapDataLoadedServer(map: MapJSON_I) {
		fs.readFile(MAP_FOLDER + map.name + '.png', function(err: Error, squid: string) {
			if(err) throw err;
			var map_png = new Image();
			map_png.src = squid;
			//ctx.drawImage(img, 0, 0, img.width / 4, img.height / 4);
			map.image = map_png;
			
			self[map.name] = map;
			pending--;
		});
	}

	function loadMaps(maps_names: string[]) {
		//console.log(maps_names);
		maps_names.forEach((map_name, index) => {//for each map
			pending++;
			//self[map_name] = {};
			//console.log(map_name);
			let map: MapJSON_I = {
				name: map_name,//STRING
				data: null,//JSON object
				image: null//IMG DOM element
			};

			//loading map data
			if(typeof module === 'undefined') {//client side
				fetch(MAP_FOLDER + map_name + '.map').then(resp => resp.text()).then(map_data => {
					map.data = <MapDataSchema>JSON.parse(fixJSON(map_data));
					onMapDataLoadedClient(map);
				}).catch(printErr);
			}
			else {//server side
				fs.readFile(MAP_FOLDER + map_name + '.map', 'utf8', (err: Error, map_data: string) => {
					if(err) throw err;
					map.data = <MapDataSchema>JSON.parse(fixJSON(map_data));
					onMapDataLoadedServer(map);
				});
			}

			//loading map texture
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
			//console.log( files.filter(f => f.endsWith('.map')).map(f => f.split('.')[0]) );
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