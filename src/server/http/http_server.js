const HttpServer = (function() {
	'use strict';

	const express = require('express');
	const bodyParser = require('body-parser');
	//const fs = require('fs');
	//const http = require('http');
	const path = require('path');

	const Pages = require('./pages.js');
	const Actions = require('./actions.js');

	const app = express();
	// app.use(bodyParser());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	const port = process.argv.slice(2)[1] || 1337;

	var initialized = false;

	const dir = path.join(__dirname, '..', '..', '..');

	const Maps = require(dir + '/src/include/game/maps.js');
	var list_of_maps = [];
	Maps.onLoad(() => list_of_maps = Object.keys(Maps).filter(key => typeof Maps[key] !== 'function'));

	return {
		init: function() {
			if(initialized === true) {
				console.log('HTTPS Server already initialized');
				return;
			}

			console.log('Initializing HTTP server at port:', port);

			app.use('/css', express.static(dir + '/assets/css'));
			//app.use('/icons', express.static(dir + '/assets/img/icons'));
			app.use('/img', express.static(dir + '/assets/img'));
			app.use('/html', express.static(dir + '/website/html'));
			//js_src - using sources instead of compiled files, js_min - folder with compiled file
			app.use('/webjs', express.static(dir + '/website/js'));
			app.use('/admin_page/admin.js', express.static(dir + '/admin_page/admin.js'));

			//allow access to folder with compiled client-side game code
			app.use('/js', express.static(dir + '/compiled'));

			app.use('/shaders', express.static(dir + '/assets/shaders'));
			app.use('/maps', express.static(dir + '/assets/maps'));

			app.get('/', (req, resp) => {
				Actions.storeVisit(req);
				resp.send(Pages.homepage);
			});
			app.get('/admin', (req, resp) => resp.send(Pages.admin));
			app.get('/forum', (req, resp) => resp.send(Pages.forum));
			app.get('/info', (req, resp) => resp.send(Pages.info));
			app.get('/gallery', (req, resp) => resp.send(Pages.gallery));
			app.get('/ranking', (req, resp) => resp.send(Pages.ranking));
			app.get(/user\/[0-9]+/, (req, resp) => resp.send(Pages.user));// eg. /user/2674
			app.get(/game\/[0-9]+/, (req, resp) => resp.send(Pages.game));// eg. /game/69
			app.get('/account', (req, resp) => resp.send(Pages.account));
			app.get('/login', (req, resp) => resp.send(Pages.login));
			app.get('/register', (req, resp) => resp.send(Pages.register));
			app.get('/verify', (req, resp) => {//account verification
				Actions.verifyAccount( req.query.code ).then(nick => {
					resp.send('Welcome ' + nick + '<br>Your account has been verified.<br>' + 
						'<a href="/">homepage</a>');
					//resp.send(Pages.verify); //<-- TODO
				}).catch(e => {
					resp.send('Verification link is invalid or expired.');
					//TODO resp.send(Pages.verify_error);
				});
			});
			app.get('/play', (req, resp) => resp.send(Pages.play));

			//requests
			app.get('/get_list_of_maps', (req, resp) => {
				// console.log( Maps );
				resp.send(list_of_maps);
			});
			app.post('/restore_session', Actions.restoreSession);
			//app.post('/search_user', Actions.search_user);
			//app.post('/search_game', Actions.search_game);
			app.post('/ranking_request', Actions.fetch_ranking);
			app.post('/user_info', Actions.get_user_info);
			app.post('/game_info', Actions.get_game_info);
			app.post('/logout_request', Actions.logout_user);
			app.post('/login_request', Actions.login_user);
			app.post('/register_request', Actions.register_account);
			app.post('/resend_verification_link_request', Actions.resend_verification_link);

			app.post('/threads_request', Actions.get_threads);
			app.post('/thread_content_request', Actions.get_thread_content);
			app.post('/submit_answer_request', Actions.submit_answer);
			app.post('/create_thread_request', Actions.create_thread);
			app.post('/latest_news_request', Actions.get_latest_news);

			//admin requests
			app.post('/ban_user_admin_request', Actions.ban_user);
			app.post('/statistics_request', Actions.get_statistics);

			//TODO Page.not_found
			app.get('*', (req, res) => res.status(404).send(Pages.not_found));

			app.listen(port, () => console.log('Listening on:', port));

			initialized = true;
				
		}
	};
})();

module.exports = HttpServer;