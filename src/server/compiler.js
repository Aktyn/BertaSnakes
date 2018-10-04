const path = require('path');
const fs = require('fs');
const watchTree = require("fs-watch-tree").watchTree;
const request = require('request');

const closure_compiler_url = 'https://closure-compiler.appspot.com/compile';

const dir = path.join(__dirname, '..', '..');

const client_path = dir + '/src/client/';
const include_path = dir + '/src/include/';

const sources = [
	[//INCLUDES
		'utils/vector.js',
		'utils/matrix2d.js',

		'room_info.js',
		'user_info.js',
		'network_codes.js',

		'game/common/colors.js',
		'game/common/movement.js',//movement must be before effects.js
		'game/common/effects.js',
		'game/common/skills.js',
		'game/common/painter.js',
		'game/common/sensor.js',

		'game/objects/object2d.js',//object2d must be before object2d_smooth
		'game/objects/object2d_smooth.js',
		'game/objects/hp_bar.js',
		'game/objects/immunity.js',
		'game/objects/shield.js',
		'game/objects/bullet.js',
		'game/objects/bomb.js',
		'game/objects/enemy.js',
		'game/objects/poisonous_enemy.js',
		'game/objects/rocket_enemy.js',
		'game/objects/enemy_spawner.js',
		'game/objects/item.js',
		'game/objects/emoticon.js',
		'game/objects/player.js',
		
		'game/maps.js',
		'game/paint_layer.js',
		'game/game_map.js',
		'game/collision_detector.js',
		'game/game_core.js',
		'game/game_result.js'
	].map(src => include_path + src).join(','),

	dir + '/website/js/utilsV2.js',//utils file (source)

	[//CLIENT SOURCES
		//'/../../res/js/utilsV2.js',//utils files comes first
		'common/common.js',
		'common/gui_widgets_creator.js',

		'engine/network.js',
		'engine/settings.js',
		'engine/assets.js',
		'engine/graphics.js',

		'bg_dust.js',
		'header_notifications.js',

		'stages/stage.js',
		'stages/settings_popup.js',
		'stages/account_popup.js',
		'stages/shop_popup.js',
		'stages/lobby_stage.js',
		'stages/game_stage.js',

		'session_widget.js',
		'chat.js',
		'game_panel.js',
		'rooms_list.js',
		'room_view.js',

		'game/emitters/dust_emitter.js',
		'game/emitters/explosion_emitter.js',
		'game/emitters/instant_heal_emitter.js',
		'game/emitters/shadow_emitter.js',
		'game/emitters/spawner_emitter.js',
		'game/emitters/fussion_emitter.js',
		'game/emitters/poisoning_emitter.js',
		'game/emitters/player_emitter.js',
		'game/emitters/hit_emitter.js',
		'game/emitters/energy_blast_emitter.js',
		'game/emitters/experience_emitter.js',
		'game/in_game_gui.js',
		'game/entities.js',
		'game/renderer.js',
		'game/client_game.js',

		'main.js'//main should be last
	].map(src => {
		return src.startsWith('/') ? src.substring(1, src.length) : (client_path + src);
	}).join(',')
].join(',').split(',');

const compileGame = function(options) {
	options = options || {};

	return new Promise((resolve, reject) => {
		
		let onFinish = (code) => {
			if(typeof options.target_file === 'string') {
				//saving code to file
				try {
					fs.writeFileSync(options.target_file, code, 'utf8');
				}
				catch(e) {
					reject(e);
				}
			}
			console.log('Client-side game code compiled (' + (new Date().toLocaleString()) + ')');
			resolve();
		};
		
		//console.log('Compiling client game code', options);

		let combined_code = '';

		//reading each source file content
		sources.forEach(src => {
			try {
				let content = fs.readFileSync(src, 'utf8');

				combined_code += "\n//--- " + src.replace(dir, '') + " ---\\\\\n" + content + "\n";
			}
			catch(e) {
				reject(e);
			}
		});

		//wrapping combined sources into closure function with additional 'global' code
		combined_code = "(function(){//last change: " + (new Date().toLocaleString()) + 
			"\n'use strict';\nconst _CLIENT_ = true;" + combined_code + "\n})();";

		if(options.remove_logs === true) {
			combined_code = combined_code.replace(/else\n[^a-zA-Z]*console\.log\(.*\);[$|\n]/g, '')
				.replace(/console\.log\(.*\);[$|\n]/g, '\n');
		}

		if(options.closure === true) {
			console.log('Closure compiling client-side game code');
			
			let data = {
				//'SIMPLE_OPTIMIZATIONS', 'ADVANCED_OPTIMIZATIONS', 'WHITESPACE_ONLY',
				compilation_level: 'ADVANCED_OPTIMIZATIONS',
				js_code: combined_code,
				output_format: 'text',
				output_info: 'compiled_code',
				//TODO - try compile to older language version and 
				//	check compatibility with older browsers
				language_out: 'ECMASCRIPT6_STRICT'//ES6
			};

			request.post({
				url: closure_compiler_url, form: data
			}, (err, response, body) => {
				if(err)
					reject(err);
				else
					onFinish(body);//saveResult(body);
			} );
		}
		else 
			onFinish(combined_code);//saveResult(combined_code);
	});
};

const compilePage = function() {
	const page_sources_folder = 'assets/js_src/';
	const page_compiled_folder = 'assets/js_min/';

	return new Promise((resolve, reject) => {
		fs.readdir(page_sources_folder, (err, files) => {
			if(err) reject(err);
			
			const page_jobs = files.filter(f => f.endsWith('.js')).map(page_file_src => {
				return new Promise((resolve_file, reject_file) => {
					try {
						const content = fs.readFileSync(page_sources_folder + page_file_src, 'utf8');

						//compile....
						let data = {
							//'SIMPLE_OPTIMIZATIONS', 'ADVANCED_OPTIMIZATIONS', 'WHITESPACE_ONLY',
							compilation_level: 'SIMPLE_OPTIMIZATIONS',
							js_code: content,
							output_format: 'text',
							output_info: 'compiled_code',
							language_out: 'ES6'
						};

						request.post({
							url: closure_compiler_url, form: data
						}, (err, response, body) => {
							if(err)
								reject_file(err);
							else {
								fs.writeFileSync(page_compiled_folder + page_file_src, body, 'utf8');
								resolve_file(page_file_src);//saveResult(body);
							}
						} );
					}
					catch(e) {
						reject_file(e);
					}
				});
			});

			Promise.all( page_jobs ).then(resolve).catch(reject);
		});
	});
};

module.exports = {
	compileGameSources: compileGame,
	compilePageSources: compilePage,
	recompileOnGameSourceFileChange: function(options) {
		//console.log('Watching files changes in', 
		//	client_path.replace(dir, ''), include_path.replace(dir, ''), 'directories for changes');
		var is_processing = null;
		var setWatcher = function(path) {
			watchTree(path, function (event) {
			    // See description of event below
			    if(is_processing === null) {
				    if(event.isModify()) {
				   		compileGame(options);//recompile
				    }
				   	is_processing = setTimeout(() => is_processing = null, 100);
				}
			});
		};

		setWatcher(client_path);
		setWatcher(include_path);
	}
};