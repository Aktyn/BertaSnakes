"use strict";
/* jshint multistr:true */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var crypto = require('crypto');
var DatabaseUtils = require('./../database_utils.js');
var Email = require('./email.js');
var ROWS_PER_PAGE = 20; //users ranking page
var session_cookie_name = 'user_session';
var INITIAL_CUSTOM_USER_DATA = JSON.stringify({
    level: 1,
    exp: 0,
    coins: 0,
    ship_type: 0,
    avaible_ships: [0]
});
//console.log(INITIAL_CUSTOM_USER_DATA);
var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function randomString(len) {
    var random_str = '';
    for (var i = 0; i < len; i++)
        random_str += chars[(Math.random() * chars.length) | 0];
    return random_str;
}
function validateText(text, max_len) {
    text = text.trim();
    if (text.length < 3 || text.length > (max_len || 2048))
        return false;
    return true;
}
var getIP = function (req) { return req.connection.remoteAddress.replace(/::ffff:/, ''); };
function getUserSessionKey(req) {
    try {
        var key = getCookie(req.headers.cookie, session_cookie_name);
        var ip = req.connection.remoteAddress.replace(/::ffff:/, '');
        return crypto.createHash('sha256').update(req.headers['user-agent'] + ip + key).digest('base64');
    }
    catch (e) {
        console.error();
        return '';
    }
}
function generateSessionKeys(req) {
    //generating session key
    var useragent = req.headers['user-agent'];
    //console.log('useragent:', useragent);
    //generating user key
    var user_key = randomString(32).toString('base64');
    var session_key = crypto.createHash('sha256').update(useragent + getIP(req) + user_key)
        .digest('base64');
    return {
        sessionkey: session_key,
        userkey: user_key,
    };
}
/* jshint ignore:start */
function isAdmin(req) {
    return __awaiter(this, void 0, void 0, function () {
        var session_key, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    session_key = getUserSessionKey(req);
                    return [4 /*yield*/, DatabaseUtils.checkSession(session_key)];
                case 1:
                    res = _a.sent();
                    if (res.length < 1 || res[0].nickname !== 'Admin') //more worthy user's nicknames can be added
                        return [2 /*return*/, false];
                    return [2 /*return*/, true];
            }
        });
    });
}
/* jshint ignore:end */
function getCookie(cookies, name) {
    try {
        return cookies.match(new RegExp('.*' + name + '=([^;]*)', 'i'))[1]
            .replace(/%3D/gi, '='); //escape '=' chars
    }
    catch (e) { //cookie not found
        return null;
    }
}
function validateEmail(email) {
    return email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) !== null;
}
function sendResponse(resp, data) {
    // resp.end( JSON.stringify(data) );
    resp.json(data);
}
module.exports = {
    storeVisit: function (req) {
        DatabaseUtils.addVisitEntry(getIP(req), req.headers['user-agent']);
    },
    fetch_ranking: function (req, resp) {
        var page_nr = req.body.page || 0;
        DatabaseUtils.searchTopRankUsers(page_nr, ROWS_PER_PAGE).then(function (res) {
            var response = {
                result: 'SUCCESS',
                user_infos: [] //array to fill with mysql response data
            };
            res.forEach(function (user_info, index) {
                if (index === res.length - 1) {
                    response.total_users = user_info.id;
                    response.page = ~~page_nr;
                    response.rows_per_page = ROWS_PER_PAGE;
                }
                else {
                    response.user_infos.push({
                        ID: user_info.id,
                        NICK: user_info.nickname,
                        RANK: user_info.rank
                    });
                }
            });
            sendResponse(resp, response);
        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
    },
    /*search_user: (req, resp) => {
        DatabaseUtils.searchUsers(req.body.username || '').then(res => {
            let response = {
                result: 'SUCCESS',
                user_infos: []//array to fill with mysql response data
            };
            res.forEach(user_info => response.user_infos.push({
                ID: 			user_info.id,
                NICK: 			user_info.nickname,
                REGISTER_DATE: 	user_info.register_date,
                LAST_SEEN: 		user_info.last_login,
                CUSTOM_DATA: 	user_info.custom_data,
            }));
            
            sendResponse(resp, response);
        }).catch(e => sendResponse(resp, {result: 'ERROR'}));
    },
    search_game: (req, resp) => {
        DatabaseUtils.searchGames(req.body.gamename || '').then(res => {
            let response = {
                result: 'SUCCESS',
                game_infos: []
            };
            res.forEach(game_info => response.game_infos.push({
                ID: 		game_info.id,
                NAME: 		game_info.name,
                MAP: 		game_info.map,
                TIME: 		game_info.time,
                DURATION: 	game_info.duration,
                GAME_RESULT:game_info.result
            }));
            
            sendResponse(resp, response);
        }).catch(e => sendResponse(resp, {result: 'ERROR'}));
    },*/
    /* jshint ignore:start */ //ignore async/await statements
    restoreSession: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var session_key, res, response, page_nr_1, games_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        session_key = getUserSessionKey(req);
                        return [4 /*yield*/, DatabaseUtils.checkSession(session_key)];
                    case 1:
                        res = _a.sent();
                        if (res.length < 1)
                            return [2 /*return*/, sendResponse(resp, { result: 'NO_SESSION' })];
                        //silently updating last_seen date and ip information
                        DatabaseUtils.updateLastLogin(getIP(req), res[0].id);
                        response = {
                            result: 'SUCCESS',
                            ID: res[0].id,
                            NICK: res[0].nickname,
                            REGISTER_DATE: res[0].register_date,
                            LAST_SEEN: res[0].last_login,
                            EMAIL: res[0].email,
                            CUSTOM_DATA: res[0].custom_data,
                        };
                        if (!(req.body.fetch_games === 'true' || req.body.fetch_games === true)) return [3 /*break*/, 3];
                        page_nr_1 = req.body.page || 0;
                        return [4 /*yield*/, DatabaseUtils.getUserGames(res[0].id, page_nr_1, ROWS_PER_PAGE)];
                    case 2:
                        games_1 = _a.sent();
                        response.GAMES = [];
                        games_1.forEach(function (game_info, index) {
                            if (index === games_1.length - 1) {
                                response.total_games = game_info.id;
                                response.page = ~~page_nr_1;
                                response.rows_per_page = ROWS_PER_PAGE;
                            }
                            else {
                                response.GAMES.push({
                                    ID: game_info.id,
                                    NAME: game_info.name,
                                    MAP: game_info.map,
                                    GAMEMODE: game_info.gamemode,
                                    DURATION: game_info.duration,
                                    TIME: game_info.time,
                                    RESULT: game_info.result
                                });
                            }
                        });
                        _a.label = 3;
                    case 3:
                        sendResponse(resp, response);
                        return [2 /*return*/];
                }
            });
        });
    },
    get_user_info: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var user_info, response_1, page_nr_2, games_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user_info = null;
                        return [4 /*yield*/, DatabaseUtils.findUserByID(req.body.id)];
                    case 1:
                        user_info = _a.sent();
                        if (!(user_info === null)) return [3 /*break*/, 2];
                        sendResponse(resp, { result: 'ERROR' });
                        return [3 /*break*/, 5];
                    case 2:
                        response_1 = {
                            result: 'SUCCESS',
                            ID: user_info.id,
                            NICK: user_info.nickname,
                            REGISTER_DATE: user_info.register_date,
                            LAST_SEEN: user_info.last_login,
                            CUSTOM_DATA: user_info.custom_data,
                        };
                        if (!(req.body.fetch_games === 'true' || req.body.fetch_games === true)) return [3 /*break*/, 4];
                        page_nr_2 = req.body.page || 0;
                        return [4 /*yield*/, DatabaseUtils.getUserGames(user_info.id, page_nr_2, ROWS_PER_PAGE)];
                    case 3:
                        games_2 = _a.sent();
                        response_1.GAMES = [];
                        games_2.forEach(function (game_info, index) {
                            if (index === games_2.length - 1) {
                                response_1.total_games = game_info.id;
                                response_1.page = ~~page_nr_2;
                                response_1.rows_per_page = ROWS_PER_PAGE;
                            }
                            else {
                                response_1.GAMES.push({
                                    ID: game_info.id,
                                    NAME: game_info.name,
                                    MAP: game_info.map,
                                    GAMEMODE: game_info.gamemode,
                                    DURATION: game_info.duration,
                                    TIME: game_info.time,
                                    RESULT: game_info.result
                                });
                            }
                        });
                        _a.label = 4;
                    case 4:
                        sendResponse(resp, response_1);
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    },
    login_user: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var user_info, pass, sess_keys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, DatabaseUtils.findUserByNick(req.body.username)];
                    case 1:
                        user_info = _a.sent();
                        if (user_info === null) //user not found
                            return [2 /*return*/, sendResponse(resp, { result: 'USER_DOES_NOT_EXISTS' })];
                        pass = crypto.createHash('sha1').update(req.body.password).digest('base64');
                        //checking whether user send correct password
                        if (user_info.password !== pass)
                            return [2 /*return*/, sendResponse(resp, { result: 'INCORRECT_PASSWORD' })];
                        if (user_info.register_hash !== 'verified') {
                            if (user_info.register_hash === 'banned')
                                return [2 /*return*/, sendResponse(resp, { result: 'ACCOUNT_BANNED' })];
                            else
                                return [2 /*return*/, sendResponse(resp, { result: 'ACCOUNT_NOT_VERIFIED' })];
                        }
                        sess_keys = generateSessionKeys(req);
                        DatabaseUtils.createUserSession(sess_keys.sessionkey, user_info.id).then(function () {
                            //silently updating last_seen date and ip information
                            DatabaseUtils.updateLastLogin(getIP(req), user_info.id);
                            sendResponse(resp, {
                                result: 'SUCCESS',
                                user_key: sess_keys.userkey //public session key for logged user
                            });
                        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
                        return [2 /*return*/];
                }
            });
        });
    },
    register_account: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var nick, pass, email, user_info, register_hash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nick = req.body.username;
                        pass = crypto.createHash('sha1').update(req.body.password).digest('base64');
                        email = req.body.email;
                        //let ip = req.connection.remoteAddress.replace(/::ffff:/, '');
                        if (nick.length < 3)
                            return [2 /*return*/, sendResponse(resp, { result: 'USERNAME_TOO_SHORT' })];
                        else if (pass.length < 8)
                            return [2 /*return*/, sendResponse(resp, { result: 'PASSWORD_TOO_SHORT' })];
                        else if (validateEmail(email) !== true)
                            return [2 /*return*/, sendResponse(resp, { result: 'INCORRECT_EMAIL' })];
                        return [4 /*yield*/, DatabaseUtils.findUserByNick(nick)];
                    case 1:
                        user_info = _a.sent();
                        if (user_info !== null)
                            return [2 /*return*/, sendResponse(resp, { result: 'USER_ALREADY_EXISTS' })];
                        return [4 /*yield*/, DatabaseUtils.findUserByEmail(email)];
                    case 2:
                        user_info = _a.sent();
                        if (user_info !== null)
                            return [2 /*return*/, sendResponse(resp, { result: 'EMAIL_IN_USE' })];
                        register_hash = randomString(20).toString('base64');
                        DatabaseUtils.registerAccount(nick, pass, email, register_hash, getIP(req), INITIAL_CUSTOM_USER_DATA).then(function () {
                            return Email.sendVerificationCode(register_hash, email);
                        }).then(function () { return sendResponse(resp, { result: 'SUCCESS' }); })
                            .catch(function (e) { return sendResponse(resp, { result: 'EMAIL_SEND_ERROR' }); });
                        return [2 /*return*/];
                }
            });
        });
    },
    resend_verification_link: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var nick, pass, user_info;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nick = req.body.username;
                        pass = crypto.createHash('sha1').update(req.body.password).digest('base64');
                        return [4 /*yield*/, DatabaseUtils.findUserByNick(nick)];
                    case 1:
                        user_info = _a.sent();
                        if (user_info === null)
                            return [2 /*return*/, sendResponse(resp, { result: 'USER_DOES_NOT_EXISTS' })];
                        if (user_info.password !== pass)
                            return [2 /*return*/, sendResponse(resp, { result: 'INCORRECT_PASSWORD' })];
                        if (user_info.register_hash === 'verified')
                            return [2 /*return*/, sendResponse(resp, { result: 'ACCOUNT_ALREADY_VERIFIED' })];
                        Email.sendVerificationCode(user_info.register_hash, user_info.email).then(function () {
                            sendResponse(resp, { result: 'SUCCESS' });
                        }).catch(function (e) { return sendResponse(resp, { result: 'EMAIL_SEND_ERROR' }); });
                        return [2 /*return*/];
                }
            });
        });
    },
    /* jshint ignore:end */
    get_game_info: function (req, resp) {
        DatabaseUtils.findGameByID(req.body.id).then(function (res) {
            if (res === null)
                return sendResponse(resp, { result: 'ERROR' });
            sendResponse(resp, {
                result: 'SUCCESS',
                ID: res.id,
                NAME: res.name,
                MAP: res.map,
                GAMEMODE: res.gamemode,
                DURATION: res.duration,
                TIME: res.time,
                RESULT: res.result
            });
        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
    },
    logout_user: function (req, resp) {
        var session_key = getUserSessionKey(req);
        DatabaseUtils.endUserSession(session_key).then(function (res) {
            sendResponse(resp, { result: 'SUCCESS' });
        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
    },
    verifyAccount: function (code) {
        return new Promise(function (resolve, reject) {
            console.log('Verifying account using code:', code);
            var query = "SELECT * FROM `users` WHERE `register_hash` = '" + code + "';";
            DatabaseUtils.customQuery(query).then(function (search_res) {
                if (search_res.length < 1) {
                    reject();
                    return;
                }
                //verify
                var verify_query = "UPDATE `users` SET `register_hash` = 'verified' \
					WHERE `users`.`register_hash` = '" + code + "';";
                DatabaseUtils.customQuery(verify_query).then(function () {
                    resolve(search_res[0].nickname);
                }).catch(reject);
            }).catch(reject);
        });
    },
    //////////////////////////////////////////////////////////////////////////////////////
    get_threads: function (req, resp) {
        var page_nr = req.body.page || 0;
        DatabaseUtils.getThreads(req.body.category, page_nr, ROWS_PER_PAGE).then(function (res) {
            var response = {
                result: 'SUCCESS',
                THREADS: []
            };
            res.forEach(function (thread, index) {
                if (index === res.length - 1) {
                    response.total_threads = thread.id;
                    response.page = ~~page_nr;
                    response.rows_per_page = ROWS_PER_PAGE;
                }
                else {
                    response.THREADS.push({
                        ID: thread.id,
                        AUTHOR_ID: thread.author_id,
                        AUTHOR_NICK: thread.nickname,
                        SUBJECT: thread.subject,
                        TIME: thread.time,
                        LAST_POST: thread.last_post_time,
                        TOTAL_POSTS: thread.total_posts
                    });
                }
            });
            sendResponse(resp, response);
        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
    },
    get_thread_content: function (req, resp) {
        var page_nr = req.body.page || 0;
        DatabaseUtils.getThreadContent(req.body.thread, page_nr, ROWS_PER_PAGE).then(function (res) {
            var response = {
                result: 'SUCCESS',
                POSTS: []
            };
            //console.log(res);
            res.forEach(function (post, index) {
                if (index === res.length - 1) {
                    response.total_posts = post.id | 0;
                    response.page = ~~page_nr;
                    response.rows_per_page = ROWS_PER_PAGE;
                }
                else if (index === res.length - 2) {
                    response.SUBJECT = post.id;
                }
                else {
                    response.POSTS.push({
                        ID: post.id,
                        AUTHOR_ID: post.author_id,
                        AUTHOR_NICK: post.nickname,
                        CONTENT: post.content,
                        TIME: post.time
                    });
                }
            });
            sendResponse(resp, response);
        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
    },
    /* jshint ignore:start */ //ignore async/await statements
    submit_answer: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var session_key, user_session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (validateText(req.body.content) === false)
                            return [2 /*return*/, sendResponse(resp, { result: 'ERROR' })];
                        session_key = getUserSessionKey(req);
                        return [4 /*yield*/, DatabaseUtils.checkSession(session_key)];
                    case 1:
                        user_session = _a.sent();
                        if (user_session.length < 1)
                            return [2 /*return*/, sendResponse(resp, { result: 'NO_SESSION' })];
                        //incrementing post number in thread record
                        DatabaseUtils.onPostCreated((req.body.thread || 0));
                        //submitting
                        DatabaseUtils.addPost(user_session[0].id, req.body.thread || 0, req.body.content).then(function (res) {
                            sendResponse(resp, { result: 'SUCCESS' });
                        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
                        return [2 /*return*/];
                }
            });
        });
    },
    create_thread: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var session_key, user_session, new_thread_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (validateText(req.body.subject, 256) === false || validateText(req.body.content) === false)
                            return [2 /*return*/, sendResponse(resp, { result: 'ERROR' })];
                        session_key = getUserSessionKey(req);
                        return [4 /*yield*/, DatabaseUtils.checkSession(session_key)];
                    case 1:
                        user_session = _a.sent();
                        if (user_session.length < 1)
                            return [2 /*return*/, sendResponse(resp, { result: 'NO_SESSION' })];
                        new_thread_id = 0;
                        //inserting thread record
                        DatabaseUtils.addThread(user_session[0].id, req.body.category, req.body.subject).then(function (res) {
                            return DatabaseUtils.customQuery("SELECT LAST_INSERT_ID() as 'last_id';");
                        }).then(function (res) {
                            //console.log(res);
                            new_thread_id = res[0].last_id;
                            //submitting first post
                            return DatabaseUtils.addPost(user_session[0].id, new_thread_id, req.body.content);
                        }).then(function (res) {
                            sendResponse(resp, { result: 'SUCCESS', ID: new_thread_id });
                        }).catch(function (e) {
                            console.error('creating thread error:', e);
                            sendResponse(resp, { result: 'ERROR' });
                        });
                        return [2 /*return*/];
                }
            });
        });
    },
    //admin request
    ban_user: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var is_admin, ban_query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, isAdmin(req)];
                    case 1:
                        is_admin = _a.sent();
                        if (!is_admin)
                            return [2 /*return*/, sendResponse(resp, { result: 'ERROR' })];
                        ban_query = "UPDATE `users` SET `register_hash` = 'banned' \
			WHERE `users`.`nickname` = '" + req.body.username + "';";
                        DatabaseUtils.customQuery(ban_query).then(function (res) {
                            if (res.changedRows === 0)
                                sendResponse(resp, { result: 'USER_NOT_FOUND' });
                            else
                                sendResponse(resp, { result: 'SUCCESS' });
                        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
                        return [2 /*return*/];
                }
            });
        });
    },
    get_statistics: function (req, resp) {
        return __awaiter(this, void 0, void 0, function () {
            var is_admin, stats_query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, isAdmin(req)];
                    case 1:
                        is_admin = _a.sent();
                        if (!is_admin)
                            return [2 /*return*/, sendResponse(resp, { result: 'ERROR' })];
                        stats_query = "SELECT * FROM `BertaBall`.`visits`\
			WHERE `time` >= '" + req.body.from + "' AND `time` < '" + req.body.to + "'\
			ORDER BY `time` DESC LIMIT 1000;";
                        DatabaseUtils.customQuery(stats_query).then(function (res) {
                            var response = {
                                result: 'SUCCESS',
                                VISITS: []
                            };
                            res.forEach(function (_visit) {
                                response.VISITS.push({
                                    IP: _visit.ip,
                                    TIME: _visit.time
                                });
                            });
                            sendResponse(resp, response);
                        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
                        return [2 /*return*/];
                }
            });
        });
    },
    /* jshint ignore:end */
    get_latest_news: function (req, resp) {
        DatabaseUtils.customQuery("SELECT \
			    `threads`.`id` AS `thread_id`, `threads`.`subject`, `threads`.`time`, `posts`.`content`\
			FROM\
			    `BertaBall`.`threads`\
			        JOIN\
			    `BertaBall`.`posts` ON `posts`.`id` = (SELECT \
			            `posts`.`id`\
			        FROM\
			            `BertaBall`.`posts`\
			        WHERE\
			            `posts`.`thread_id` = `threads`.`id`\
			        ORDER BY `posts`.`id` ASC\
			        LIMIT 1)\
			WHERE\
			    `category` = 1\
			ORDER BY \
				`threads`.`time` DESC\
			LIMIT 10;").then(function (res) {
            var response = {
                result: 'SUCCESS',
                NEWS: []
            };
            res.forEach(function (_new) {
                response.NEWS.push({
                    THREAD_ID: _new.thread_id,
                    SUBJECT: _new.subject,
                    TIME: _new.time,
                    CONTENT: _new.content
                });
            });
            sendResponse(resp, response);
        }).catch(function (e) { return sendResponse(resp, { result: 'ERROR' }); });
    }
};
