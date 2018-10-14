"use strict";
//const HttpServer = (function() {
//	'use strict';
///<reference path="./../../include/game/maps.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
//import fs from 'fs';
//import http from 'http';
const path = require("path");
const pages_1 = require("./pages");
const actions_1 = require("./actions");
const app = express();
// app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const port = process.argv.slice(2)[1] || 1337;
var initialized = false;
const dir = path.join(__dirname, '..', '..', '..');
const Maps = require(path.join(__dirname, '..', '..', 'include', 'game') + '/maps');
// import Maps from './../../include/game/maps';
var list_of_maps = [];
Maps.onLoad(() => list_of_maps = Object.keys(Maps).filter(key => typeof Maps[key] !== 'function'));
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
        //app.use('/admin_page/admin.js', express.static(dir + '/admin_page/admin.js'));
        //allow access to folder with compiled client-side game code
        app.use('/js', express.static(dir + '/compiled'));
        app.use('/' + global.DATE_VERSION + '.js', express.static(dir + '/compiled/game_compiled.js'));
        app.use('/shaders', express.static(dir + '/assets/shaders'));
        app.use('/maps', express.static(dir + '/assets/maps'));
        app.get('/', (req, resp) => {
            actions_1.default.storeVisit(req);
            resp.send(pages_1.default.homepage);
        });
        app.get('/admin', (req, resp) => resp.send(pages_1.default.admin));
        app.get('/forum', (req, resp) => resp.send(pages_1.default.forum));
        app.get('/info', (req, resp) => resp.send(pages_1.default.info));
        app.get('/gallery', (req, resp) => resp.send(pages_1.default.gallery));
        app.get('/ranking', (req, resp) => resp.send(pages_1.default.ranking));
        app.get(/user\/[0-9]+/, (req, resp) => resp.send(pages_1.default.user)); // eg. /user/2674
        app.get(/game\/[0-9]+/, (req, resp) => resp.send(pages_1.default.game)); // eg. /game/69
        app.get('/account', (req, resp) => resp.send(pages_1.default.account));
        app.get('/login', (req, resp) => resp.send(pages_1.default.login));
        app.get('/register', (req, resp) => resp.send(pages_1.default.register));
        app.get('/verify', (req, resp) => {
            actions_1.default.verifyAccount(req.query.code).then(nick => {
                resp.send('Welcome ' + nick + '<br>Your account has been verified.<br>' +
                    '<a href="/">homepage</a>');
                //resp.send(Pages.verify); //<-- TODO
            }).catch(e => {
                resp.send('Verification link is invalid or expired.');
                //TODO resp.send(Pages.verify_error);
            });
        });
        app.get('/play', (req, resp) => resp.send(pages_1.default.play));
        //requests
        app.get('/get_list_of_maps', (req, resp) => {
            resp.send(list_of_maps);
        });
        app.post('/restore_session', actions_1.default.restoreSession);
        //app.post('/search_user', Actions.search_user);
        //app.post('/search_game', Actions.search_game);
        app.post('/ranking_request', actions_1.default.fetch_ranking);
        app.post('/user_info', actions_1.default.get_user_info);
        app.post('/game_info', actions_1.default.get_game_info);
        app.post('/logout_request', actions_1.default.logout_user);
        app.post('/login_request', actions_1.default.login_user);
        app.post('/register_request', actions_1.default.register_account);
        app.post('/resend_verification_link_request', actions_1.default.resend_verification_link);
        app.post('/threads_request', actions_1.default.get_threads);
        app.post('/thread_content_request', actions_1.default.get_thread_content);
        app.post('/submit_answer_request', actions_1.default.submit_answer);
        app.post('/create_thread_request', actions_1.default.create_thread);
        app.post('/latest_news_request', actions_1.default.get_latest_news);
        //admin requests
        app.post('/ban_user_admin_request', actions_1.default.ban_user);
        app.post('/statistics_request', actions_1.default.get_statistics);
        //TODO Page.not_found
        app.get('*', (req, res) => res.status(404).send(pages_1.default.not_found));
        app.listen(port, () => console.log('Listening on:', port));
        initialized = true;
    }
};
// })();
// module.exports = HttpServer;
