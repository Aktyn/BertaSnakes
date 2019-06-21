import Settings from './settings';

import Emoticon, {EMOTS} from '../../../common/game/objects/emoticon';
import Colors from '../../../common/game/common/colors';
import Player, {PLAYER_TYPES} from '../../../common/game/objects/player';

interface ShaderSourceI {
	vertex_source: string;
	fragment_source: string;
}

const SHADERS_PATH = require.context('../../shaders');
const TEXTURES_PATH = require.context('../../img/textures');
// const EMOTS_PATH = require.context('../../img/textures/emoticons');

var shaders: {[index:string]: ShaderSourceI} = {};
var textures: {[index:string]: HTMLCanvasElement | HTMLImageElement} = {};

var pending = 1;//currently loading resources (0 means loaded)
var onLoadCallbacks: (() => void)[] = [];

const printError = (e: Error | string | Event) => console.error(e);
const notFound = (name: string) => { throw new Error('Resource not found: ' + name); };

function loadAssets() {
	// IMAGES //
	
	//items
	loadImage('health_item', 		'items/health.png');
	loadImage('energy_item', 		'items/energy.png');
	loadImage('speed_item', 		'items/acceleration.png');

	//skills icons
	// loadImage('basic_shot_skill', TEXTURES_PATH + 'skills_icons/basic_shot.png');
	// loadImage('bariere_skill', TEXTURES_PATH + 'skills_icons/bariere.png');
	loadImage('shot1_skill', 		'skills_icons/shot1.png');
	loadImage('shot2_skill', 		'skills_icons/shot2.png');
	loadImage('shot3_skill', 		'skills_icons/shot3.png');
	loadImage('shield_skill', 		'skills_icons/shield.png');
	loadImage('bounce_shot_skill', 	'skills_icons/bounce_shot.png');
	loadImage('energy_blast_skill', 'skills_icons/energy_blast.png');
	loadImage('heal_skill', 		'skills_icons/heal.png');
	loadImage('speed_skill', 		'skills_icons/speed.png');
	loadImage('bomb_skill', 		'skills_icons/bomb.png');

	//loadImage('background_test', TEXTURES_PATH + 'background1.png');
	//console.log( EMOTS );
	EMOTS.forEach(emot => {
		loadImage(Emoticon.entityName(emot.file_name), 
			'emoticons/' + emot.file_name,
			loaded_image => {//fix for .svg => set resolution
				//loaded_image.setAttrib('width', 256);
				//loaded_image.setAttrib('height', 256);
				// loaded_image.width = 128;
				// loaded_image.height = 128;
			});
	});

	//streak for emoticons
	loadImage('streak', 'emoticons/streak.png');

	// PARTICLES
	loadImage('fussion_particle', 	'particles/fussion.png');
	loadImage('cloud_particle', 	'particles/cloud.png');
	loadImage('snow_particle', 		'particles/snowflake.png');
	loadImage('plus', 				'particles/plus.png');
	loadImage('ring', 				'ring.png');
	loadImage('ring_thick', 		'ring_thick.png');

	//others
	//loadImage('hexagon', 	'hexagon.png');
	loadImage('pixel', 			'pixel.png');
	loadImage('enemy_rocket', 	'enemies/rocket.png');
	loadImage('enemy_poisonous','enemies/poisonous.png');
	loadImage('bullet', 		'bullets/bullet.png');
	loadImage('bomb', 			'bomb.png');

	// SHADERS //
	loadShaderSource('main_shader', 'main.vs', 'main.fs');
	if(Settings.getValue('shadows_type') === 'FLAT')
		loadShaderSource('post_shader', 'post_gui.vs', 'post_game_flat.fs');
	else
		loadShaderSource('post_shader', 'post_gui.vs', 'post_game_long.fs');
	loadShaderSource('particles_shader', 'particles.vs', 'particles.fs');
}

function loadShaderSource(name: string, vertex_file_path: string, fragment_file_path: string) {
	pending++;

	if( !vertex_file_path.startsWith('./') )
		vertex_file_path = './' + vertex_file_path;
	if( !fragment_file_path.startsWith('./') )
		fragment_file_path = './' + fragment_file_path;

	let vss: {default: string} = SHADERS_PATH(vertex_file_path);
	if( !vss || typeof vss.default !== 'string' )
		throw new Error('Cannot load file (' + vss + ')');

	let fss: {default: string} = SHADERS_PATH(fragment_file_path);
	if( !fss || typeof fss.default !== 'string' )
		throw new Error('Cannot load file (' + fss + ')');

	shaders[name] = {
		vertex_source: vss.default,
		fragment_source: fss.default
	};
	pending--;
}

function loadImage(name: string, path: string, onLoad?: (arg: HTMLImageElement) => void) {
	pending++;

	//new version of this method
	let img = document.createElement('img');
	img.onload = function() {
		textures[name] = img;

		if(onLoad)
			onLoad(img);

		pending--;
		//this.off('load', onload);
		img.onload = null;
	};
	img.onerror = e => printError(e);
	
	//console.log('loading image:', path);

	if( !path.startsWith('./') )
		path = './' + path;
	img.src = TEXTURES_PATH(path);
}

function generatePlayersTextures() {
	//@ts-ignore
	let player_types = Object.keys(PLAYER_TYPES).map(key => PLAYER_TYPES[key])
		.filter(type_i => typeof type_i === 'number');
	for(let type_i of player_types) {
		pending++;

		let img = document.createElement('img');
		img.onload = function() {
			let player_texture = img;
			// console.log(this);

			Colors.PLAYERS_COLORS.forEach((color) => {
				pending++;

				let player_canv = document.createElement('canvas');
				player_canv.width = img.naturalWidth;
				player_canv.height = img.naturalHeight;

				let player_ctx = 
					<CanvasRenderingContext2D>player_canv.getContext('2d', {antialias: true});
				player_ctx.drawImage(<CanvasImageSource><unknown>player_texture, 0, 0);

				let canvasData = player_ctx.getImageData(0, 0, 
						player_canv.width, player_canv.height),
			     	pix = canvasData.data;

			    for(var i=0, n=pix.length, j=0; i<n; i+=4) {
			        for(j=0; j<3; j++)
			        	pix[i+j] = Math.min(255, pix[i+j] + color.byte_buffer[j]);
			    }

			    player_ctx.putImageData(canvasData, 0, 0);

			    textures[ Player.entityName(type_i, color) ] = player_canv;
			    pending--;
				// $$(document.body).append(player_canv);
			});

			pending--;
			img.onload = null;
		};
		img.onerror = e => printError(e);
		
		img.src = TEXTURES_PATH('./players/type_' + (type_i+1) + '.png');
	}
}

var Assets = {
	load() {//LOADS GAME RESOURCES ASYNCHRONOUSLY
		if(Assets.loaded()) {
			console.log('Assets already loaded');
			return;
		}
		console.log('Loading assets');
		try {
			loadAssets();
		}
		catch(e) {
			console.error('Cannot load assets:', e);
		}

		//generating players textures
		try {
			generatePlayersTextures();
		}
		catch(e) {
			console.error('Cannot generate player textures:', e);
		}

		pending--;

		let checkLoaded = () => {
			if( Assets.loaded() ) {
				console.log('Assets loaded');
				onLoadCallbacks.forEach(cb => cb());
			}
			else
				setTimeout(checkLoaded, 100);
		};
		checkLoaded();
	},
	loaded() {
		return pending === 0;
	},
	onload(callback: () => void) {
		if(Assets.loaded())
			callback();
		else
			onLoadCallbacks.push( callback );
	},
	getShaderSources(name: string) {
		return shaders[name] || notFound(name);
	},
	getTexture(name: string) {
		return textures[name] || notFound(name);
	}
};

export default Assets;