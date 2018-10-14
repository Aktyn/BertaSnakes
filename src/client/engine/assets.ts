///<reference path="../engine/settings.ts"/>
///<reference path="../game/in_game_gui.ts"/>
///<reference path="../../include/game/objects/emoticon.ts"/>
///<reference path="../../include/game/common/colors.ts"/>

interface ShaderSourceI {
	vertex_source: string;
	fragment_source: string;
}

interface AssetsMethods {
	loaded(): boolean;
	onload(callback: () => void): void;
	getShaderSources(name: string): ShaderSourceI;
	getTexture(name: string): $_face;
}

const ASSETS = (function() {
	const SHADERS_PATH = 'shaders/';
	const TEXTURES_PATH = 'img/textures/';

	var shaders: {[index:string]: ShaderSourceI} = {};
	var textures: {[index:string]: $_face} = {};

	var pending = 1;//currently loading resources (0 means loaded)
	var onLoadCallbacks: (() => void)[] = [];

	const printError = (e: Error) => console.error(e);
	const notFound = (name: string) => { throw new Error('Resource not found: ' + name); };

	function loadAssets() {
		// IMAGES //
		
		//items
		loadImage('health_item', TEXTURES_PATH + 'items/health.png');
		loadImage('energy_item', TEXTURES_PATH + 'items/energy.png');
		loadImage('speed_item', TEXTURES_PATH + 'items/speed.png');

		//skills icons
		// loadImage('basic_shot_skill', TEXTURES_PATH + 'skills_icons/basic_shot.png');
		// loadImage('bariere_skill', TEXTURES_PATH + 'skills_icons/bariere.png');
		loadImage('shot1_skill', TEXTURES_PATH + 'skills_icons/shot1.png');
		loadImage('shot2_skill', TEXTURES_PATH + 'skills_icons/shot2.png');
		loadImage('shot3_skill', TEXTURES_PATH + 'skills_icons/shot3.png');
		loadImage('shield_skill', TEXTURES_PATH + 'skills_icons/shield.png');
		loadImage('bounce_shot_skill', TEXTURES_PATH + 'skills_icons/bounce_shot.png');
		loadImage('energy_blast_skill', TEXTURES_PATH + 'skills_icons/energy_blast.png');
		loadImage('heal_skill', TEXTURES_PATH + 'skills_icons/heal.png');
		loadImage('speed_skill', TEXTURES_PATH + 'skills_icons/speed.png');
		loadImage('bomb_skill', TEXTURES_PATH + 'skills_icons/bomb.png');

		//emoticons
		InGameGUI.EMOTS.forEach(emot => {
			loadImage(Emoticon.entityName(emot.file_name), 
				InGameGUI.EMOTS_FOLDER + emot.file_name,
				loaded_image => {//fix for .svg => set resolution
					//loaded_image.setAttrib('width', 256);
					//loaded_image.setAttrib('height', 256);
					loaded_image.width = 128;
					loaded_image.height = 128;
				});
		});

		//streak for emoticons
		loadImage('streak', InGameGUI.EMOTS_FOLDER + 'streak.png');

		// PARTICLES
		loadImage('fussion_particle', TEXTURES_PATH + 'particles/fussion.png');
		loadImage('cloud_particle', TEXTURES_PATH + 'particles/cloud.png');
		loadImage('plus', TEXTURES_PATH + 'particles/plus.png');
		loadImage('ring', TEXTURES_PATH + 'ring.png');
		loadImage('ring_thick', TEXTURES_PATH + 'ring_thick.png');

		//others
		//loadImage('hexagon', TEXTURES_PATH + 'hexagon.png');
		loadImage('pixel', TEXTURES_PATH + 'pixel.png');
		loadImage('enemy_rocket', TEXTURES_PATH + 'enemies/rocket.png');
		loadImage('enemy_poisonous', TEXTURES_PATH + 'enemies/poisonous.png');
		loadImage('bullet', TEXTURES_PATH + 'bullets/bullet.png');
		loadImage('bomb', TEXTURES_PATH + 'bomb.png');

		// SHADERS //
		loadShaderSource('main_shader', SHADERS_PATH + 'main.vs', SHADERS_PATH + 'main.fs');
		if(SETTINGS.shadows_type === 'FLAT') {
			loadShaderSource('post_shader', SHADERS_PATH+'post_gui.vs', 
				SHADERS_PATH+'post_game_flat.fs');
		}
		else {
			loadShaderSource('post_shader', SHADERS_PATH+'post_gui.vs', 
				SHADERS_PATH+'post_game_long.fs');
		}
		loadShaderSource('particles_shader', 
			SHADERS_PATH+'particles.vs', SHADERS_PATH+'particles.fs');
	}

	var self: AssetsMethods = {
		loaded: () => pending === 0,
		onload: function(callback) {
			if(this.loaded())
				callback();
			else
				onLoadCallbacks.push( callback );
		},
		getShaderSources: name => shaders[name] || notFound(name),
		getTexture: name => textures[name] || notFound(name)
	};

	function loadShaderSource(name: string, vertex_file_path: string, fragment_file_path: string) {
		pending++;

		$$.loadFile(vertex_file_path, (vss) => {
			if(vss === undefined)
				throw new Error('Cannot load file (' + vertex_file_path + ')');
			else {
				$$.loadFile(fragment_file_path, (fss) => {
					if(fss === undefined)
						throw new Error('Cannot load file (' + vertex_file_path + ')');
					else
						shaders[name] = <ShaderSourceI>{
							vertex_source: vss,
							fragment_source: fss
						};
						pending--;
				});
			}
		});
	}

	function loadImage(name: string, path: string, onLoad?: (arg: $_face) => void) {
		pending++;

		//new version of this method
		$$.create('IMG').on('load', function() {
			textures[name] = this;

			if(onLoad)
				onLoad(this);

			pending--;
		}).on('error', e => printError(<Error><unknown>e)).setAttrib('src', path);
	}

	function generatePlayersTextures() {
		//pending++;
		//@ts-ignore
		Object.keys(Player.TYPES).map(key => Player.TYPES[key]).forEach((type_i: number) => {
			pending++;

			$$.create('IMG').on('load', function() {
				var player_texture = this;
				// console.log(this);

				(<ColorsScope.ColorI[]>Colors.PLAYERS_COLORS).forEach((color) => {
					pending++;

					let player_canv = $$.create('CANVAS');//document.createElement('CANVAS');
					player_canv.width = this.naturalWidth;
					player_canv.height = this.naturalHeight;

					let player_ctx: CanvasRenderingContext2D = 
						player_canv.getContext('2d', {antialias: true});
					player_ctx.drawImage(<CanvasImageSource><unknown>player_texture, 0, 0);

					var canvasData = player_ctx.getImageData(0, 0, 
							player_canv.width, player_canv.height),
				     	pix = canvasData.data;

				    for(var i=0, n=pix.length, j=0; i<n; i+=4) {
				        for(j=0; j<3; j++)
				        	pix[i+j] = Math.min(255, pix[i+j] + color.byte_buffer[j]);//cbuff[0];
				    }

				    player_ctx.putImageData(canvasData, 0, 0);



				    textures[ Player.entityName(type_i, color) ] = player_canv;
				    pending--;
					// $$(document.body).append(player_canv);
				});

				pending--;
			}).on('error', e => printError(<Error><unknown>e))
				.setAttrib('src', TEXTURES_PATH + 'players/type_' + (type_i+1) + '.png');
		});
	}
	
	//LOADING GAME RESOURCES ASYNCHRONOUSLY
	$$.runAsync(() => {
		loadAssets();

		//generating players textures
		generatePlayersTextures();

		pending--;

		let checkLoaded = () => {
			if(self.loaded())
				onLoadCallbacks.forEach(cb => cb());
			else
				setTimeout(checkLoaded, 100);
		};
		checkLoaded();
	});

	return self;
})();