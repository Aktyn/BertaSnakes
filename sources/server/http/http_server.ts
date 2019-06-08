////<reference path="./../../include/game/maps.ts"/>
//import Maps from './../../common/game/maps';

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

const port = 1337;

var initialized = false;

const dir = path.join(__dirname, '..', '..', '..');
//const Maps = require(path.join(__dirname, '..', '..', 'include', 'game') + '/maps');

// import Maps from './../../include/game/maps';
//var list_of_maps: string[] = [];
//Maps.onLoad(() => list_of_maps = Object.keys(Maps).filter(key => typeof Maps[key] !== 'function'));

var allowCrossDomain = function(req: any, res: any, next: any) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

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

		if(process.env.NODE_ENV === 'dev')
			app.use(allowCrossDomain);

		/*app.use(`/css`, express.static(dir + '/assets/css'));
		app.use(`/img`, express.static(dir + '/assets/img'));
		app.use(`/avatars`, express.static(dir + '/uploads/user_avatars'));
		app.use(`/sounds`, express.static(dir + '/assets/sounds'));
		app.use(`/html`, express.static(dir + '/website/html'));
		app.use(`/webjs`, express.static(dir + '/website/out'));
		app.use(`/egg`, express.static(dir + '/website/egg'));

		//allow access to folder with compiled client-side game code
		app.use(`/js`, express.static(dir + '/compiled'));
		app.use(`/` + global.APP_VERSION + '.js', 
			express.static(dir + '/compiled/game_compiled.js'));

		app.use(`/shaders`, express.static(dir + '/assets/shaders'));*/
		app.use(`/maps`, express.static(dir + '/sources/assets/maps', {
			setHeaders: function(res, path) {
				res.set("Access-Control-Allow-Origin", "*");
			    //res.set("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
			    //res.set("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
			    //res.set("X-Powered-By",' 3.2.1')
			    //res.type("application/json");
			    //res.type("jpg");
			}
		}));
		
		app.get(`/verify`, (req, resp) => {//account verification
			Actions.verifyAccount( req.query.code ).then(nick => {
				resp.send(`Welcome ${nick}<br>Your account has been verified.<br>
					<a href='/'>homepage</a>`);
				//resp.send(Pages.verify); //<-- TODO
			}).catch(e => {
				resp.send(`Verification link is invalid or expired.<br>
					<a href='/'>homepage</a>`);
				//TODO resp.send(Pages.verify_error);
			});
		});

		//const play_page_html = fs.readFileSync('assets/html/play.html', 'utf8')
			//.replace('{{GAME_SCRIPT}}', global.APP_VERSION + '.js');
			//.replace(/{{homedir}}/gi, global._HOMEPATH_);
		//app.get(`/play`, (req, resp) => resp.send(play_page_html));

		//API requests
		/*app.get(`/get_list_of_maps`, (req, resp) => {
			resp.send(list_of_maps);
		});*/
		app.post(`/restore_session`, Actions.restoreSession);
		app.post(`/fetch_account_games`, Actions.fetch_account_games);
		app.post(`/store_visit`, Actions.storeVisit);


		app.post(`/upload_avatar_request`, (req, resp): any => {
			//@ts-ignore
			if (Object.keys(req.files).length === 0 || req.files.avatar_file === undefined) {
				return resp.status(400).send('No files were uploaded.');
			}

			//@ts-ignore
			var file = req.files.avatar_file;
			console.log('TODO - examine this:', file);
			//@ts-ignore
			if(file.data.length >= 1024*1024*1) {
				try { resp.status(413).send('File too big'); } catch(e) {}
				return;
			}
			
			Actions.upload_avatar(req, resp, file);
		});
		app.post(`/remove_avatar_request`, Actions.remove_avatar);
		
		app.post(`/ranking_request`, Actions.fetch_ranking);
		app.post(`/user_info`, Actions.get_user_info);
		app.post(`/game_info`, Actions.get_game_info);
		app.post(`/logout_request`, Actions.logout_user);
		app.post(`/login_request`, Actions.login_user);
		app.post(`/register_request`, Actions.register_account);
		app.post(`/resend_verification_link_request`, Actions.resend_verification_link);

		app.post(`/threads_request`, Actions.get_threads);
		app.post(`/thread_content_request`, Actions.get_thread_content);
		app.post(`/submit_answer_request`, Actions.submit_answer);
		app.post(`/create_thread_request`, Actions.create_thread);
		app.post(`/latest_news_request`, Actions.get_latest_news);

		//admin requests
		app.post(`/ban_user_admin_request`, Actions.ban_user);
		app.post(`/statistics_request`, Actions.get_statistics);

		/*const website_index_html = fs.readFileSync('website/index.html', 'utf8')
			.replace(/{{homedir}}/gi, global._HOMEPATH_);
		app.get('*', (req, resp) => {
			//Actions.storeVisit(req);
			resp.send(website_index_html);
		});*/
		const client_dir = path.join(__dirname, '..', '..', 'client');
		app.use(express.static(client_dir));

		const index_html = fs.readFileSync(client_dir + '/index.html', 'utf8');
		app.get('*', (req, res) => res.send(index_html));

		app.listen(port, () => console.log('Listening on:', port));

		initialized = true;
			
	}
}