//const HttpServer = (function() {
//	'use strict';
///<reference path="./../../include/game/maps.ts"/>

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
//import http from 'http';
import * as path from 'path';

// import Pages from './pages';
import Actions from './actions';

const fileUpload = require('express-fileupload');
const app = express();
// app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port = process.argv.slice(2)[0] || 1337;

var initialized = false;

const dir = path.join(__dirname, '..', '..', '..');
const Maps = require(path.join(__dirname, '..', '..', 'include', 'game') + '/maps');

// import Maps from './../../include/game/maps';
var list_of_maps: string[] = [];
Maps.onLoad(() => list_of_maps = Object.keys(Maps).filter(key => typeof Maps[key] !== 'function'));

export default {
	init: function() {
		if(initialized === true) {
			console.log('HTTPS Server already initialized');
			return;
		}

		console.log('Initializing HTTP server at port:', port);

		app.use(fileUpload({
			limits: { 
				fileSize: 1 * 1024 * 1024,//1 MB
				files: 1
			},
			abortOnLimit: true
		}));

		app.use(`${global._HOMEPATH_}css`, express.static(dir + '/assets/css'));
		app.use(`${global._HOMEPATH_}img`, express.static(dir + '/assets/img'));
		app.use(`${global._HOMEPATH_}avatars`, express.static(dir + '/uploads/user_avatars'));
		app.use(`${global._HOMEPATH_}sounds`, express.static(dir + '/assets/sounds'));
		app.use(`${global._HOMEPATH_}html`, express.static(dir + '/website/html'));
		app.use(`${global._HOMEPATH_}webjs`, express.static(dir + '/website/out'));
		app.use(`${global._HOMEPATH_}egg`, express.static(dir + '/website/egg'));

		//allow access to folder with compiled client-side game code
		app.use(`${global._HOMEPATH_}js`, express.static(dir + '/compiled'));
		app.use(`${global._HOMEPATH_}` + global.APP_VERSION + '.js', 
			express.static(dir + '/compiled/game_compiled.js'));

		app.use(`${global._HOMEPATH_}shaders`, express.static(dir + '/assets/shaders'));
		app.use(`${global._HOMEPATH_}maps`, express.static(dir + '/assets/maps'));
		
		app.get(`${global._HOMEPATH_}verify`, (req, resp) => {//account verification
			Actions.verifyAccount( req.query.code ).then(nick => {
				resp.send(`Welcome ${nick}<br>Your account has been verified.<br>
					<a href='${global._HOMEPATH_}'>homepage</a>`);
				//resp.send(Pages.verify); //<-- TODO
			}).catch(e => {
				resp.send(`Verification link is invalid or expired.<br>
					<a href='${global._HOMEPATH_}'>homepage</a>`);
				//TODO resp.send(Pages.verify_error);
			});
		});

		const play_page_html = fs.readFileSync('assets/html/play.html', 'utf8')
			.replace('{{GAME_SCRIPT}}', global.APP_VERSION + '.js')
			.replace(/{{homedir}}/gi, global._HOMEPATH_);
		app.get(`${global._HOMEPATH_}play`, (req, resp) => resp.send(play_page_html));

		//API requests
		app.get(`${global._HOMEPATH_}get_list_of_maps`, (req, resp) => {
			resp.send(list_of_maps);
		});
		app.post(`${global._HOMEPATH_}restore_session`, Actions.restoreSession);
		app.post(`${global._HOMEPATH_}fetch_account_games`, Actions.fetch_account_games);
		app.post(`${global._HOMEPATH_}store_visit`, Actions.storeVisit);


		app.post(`${global._HOMEPATH_}upload_avatar_request`, (req, resp): any => {
			//@ts-ignore
			if (Object.keys(req.files).length === 0 || req.files.avatar_file === undefined) {
				return resp.status(400).send('No files were uploaded.');
			}

			//@ts-ignore
			var file = req.files.avatar_file;
			if(file.data.length >= 1024*1024*1) {
				try { resp.status(413).send('File to big'); } catch(e) {}
				return;
			}
			
			Actions.upload_avatar(req, resp, file);
		});
		app.post(`${global._HOMEPATH_}remove_avatar_request`, Actions.remove_avatar);
		
		app.post(`${global._HOMEPATH_}ranking_request`, Actions.fetch_ranking);
		app.post(`${global._HOMEPATH_}user_info`, Actions.get_user_info);
		app.post(`${global._HOMEPATH_}game_info`, Actions.get_game_info);
		app.post(`${global._HOMEPATH_}logout_request`, Actions.logout_user);
		app.post(`${global._HOMEPATH_}login_request`, Actions.login_user);
		app.post(`${global._HOMEPATH_}register_request`, Actions.register_account);
		app.post(`${global._HOMEPATH_}resend_verification_link_request`, Actions.resend_verification_link);

		app.post(`${global._HOMEPATH_}threads_request`, Actions.get_threads);
		app.post(`${global._HOMEPATH_}thread_content_request`, Actions.get_thread_content);
		app.post(`${global._HOMEPATH_}submit_answer_request`, Actions.submit_answer);
		app.post(`${global._HOMEPATH_}create_thread_request`, Actions.create_thread);
		app.post(`${global._HOMEPATH_}latest_news_request`, Actions.get_latest_news);

		//admin requests
		app.post(`${global._HOMEPATH_}ban_user_admin_request`, Actions.ban_user);
		app.post(`${global._HOMEPATH_}statistics_request`, Actions.get_statistics);

		const website_index_html = fs.readFileSync('website/index.html', 'utf8')
			.replace(/{{homedir}}/gi, global._HOMEPATH_);
		app.get('*', (req, resp) => {
			//Actions.storeVisit(req);
			resp.send(website_index_html);
		});

		app.listen(port, () => console.log('Listening on:', port));

		initialized = true;
			
	}
};
// })();

// module.exports = HttpServer;