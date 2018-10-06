"use strict";
//const HttpServer = (function() {
//	'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
//import fs from 'fs';
//import http from 'http';
var path = require("path");
var Pages = require("./pages.js");
var Actions = require("./actions.js");
var app = express();
// app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var port = process.argv.slice(2)[1] || 1337;
var initialized = false;
var dir = path.join(__dirname, '..', '..', '..');
var Maps = require(dir + '/src/include/game/maps.js');
var list_of_maps = [];
Maps.onLoad(function () { return list_of_maps = Object.keys(Maps).filter(function (key) { return typeof Maps[key] !== 'function'; }); });
exports.default = {
    init: function () {
        if (initialized === true) {
            console.log('HTTPS Server already initialized');
            return;
        }
        console.log('Initializing HTTP server at port:', port);
        app.use('/css', express.static(dir + '/assets/css'));
        app.use('/img', express.static(dir + '/assets/img'));
        app.use('/html', express.static(dir + '/website/html'));
        app.use('/webjs', express.static(dir + '/website/js'));
        app.use('/admin_page/admin.js', express.static(dir + '/admin_page/admin.js'));
        //allow access to folder with compiled client-side game code
        app.use('/js', express.static(dir + '/compiled'));
        app.use('/' + global.DATE_VERSION + '.js', express.static(dir + '/compiled/game_compiled.js'));
        app.use('/shaders', express.static(dir + '/assets/shaders'));
        app.use('/maps', express.static(dir + '/assets/maps'));
        app.get('/', function (req, resp) {
            Actions.storeVisit(req);
            resp.send(Pages.homepage);
        });
        app.get('/admin', function (req, resp) { return resp.send(Pages.admin); });
        app.get('/forum', function (req, resp) { return resp.send(Pages.forum); });
        app.get('/info', function (req, resp) { return resp.send(Pages.info); });
        app.get('/gallery', function (req, resp) { return resp.send(Pages.gallery); });
        app.get('/ranking', function (req, resp) { return resp.send(Pages.ranking); });
        app.get(/user\/[0-9]+/, function (req, resp) { return resp.send(Pages.user); }); // eg. /user/2674
        app.get(/game\/[0-9]+/, function (req, resp) { return resp.send(Pages.game); }); // eg. /game/69
        app.get('/account', function (req, resp) { return resp.send(Pages.account); });
        app.get('/login', function (req, resp) { return resp.send(Pages.login); });
        app.get('/register', function (req, resp) { return resp.send(Pages.register); });
        app.get('/verify', function (req, resp) {
            Actions.verifyAccount(req.query.code).then(function (nick) {
                resp.send('Welcome ' + nick + '<br>Your account has been verified.<br>' +
                    '<a href="/">homepage</a>');
                //resp.send(Pages.verify); //<-- TODO
            }).catch(function (e) {
                resp.send('Verification link is invalid or expired.');
                //TODO resp.send(Pages.verify_error);
            });
        });
        app.get('/play', function (req, resp) { return resp.send(Pages.play); });
        //requests
        app.get('/get_list_of_maps', function (req, resp) {
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
        app.get('*', function (req, res) { return res.status(404).send(Pages.not_found); });
        app.listen(port, function () { return console.log('Listening on:', port); });
        initialized = true;
    }
};
// })();
// module.exports = HttpServer;
