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
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const database_utils_1 = require("./../database_utils");
const email_1 = require("./email");
const ROWS_PER_PAGE = 20; //users ranking page
const session_cookie_name = 'user_session';
const INITIAL_CUSTOM_USER_DATA = JSON.stringify({
    level: 1,
    exp: 0,
    coins: 0,
    ship_type: 0,
    avaible_ships: [0]
});
//console.log(INITIAL_CUSTOM_USER_DATA);
const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function randomString(len) {
    let random_str = '';
    for (let i = 0; i < len; i++)
        random_str += chars[(Math.random() * chars.length) | 0];
    return random_str;
}
function validateText(text, max_len = 2048) {
    text = text.trim();
    if (text.length < 3 || text.length > max_len)
        return false;
    return true;
}
var getIP = (req) => req.connection.remoteAddress.replace(/::ffff:/, '');
function getUserSessionKey(req) {
    try {
        let key = getCookie(req.headers.cookie, session_cookie_name);
        let ip = req.connection.remoteAddress.replace(/::ffff:/, '');
        return crypto.createHash('sha256').update(req.headers['user-agent'] + ip + key).digest('base64');
    }
    catch (e) {
        console.error();
        return '';
    }
}
function generateSessionKeys(req) {
    //generating session key
    let useragent = req.headers['user-agent'];
    //console.log('useragent:', useragent);
    //generating user key
    let user_key = randomString(32).toString('base64');
    let session_key = crypto.createHash('sha256').update(useragent + getIP(req) + user_key)
        .digest('base64');
    return {
        sessionkey: session_key,
        userkey: user_key,
    };
}
/* jshint ignore:start */
function isAdmin(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const session_key = getUserSessionKey(req);
        let res = yield database_utils_1.default.checkSession(session_key);
        if (res.length < 1 || res[0].nickname !== 'Admin') //more worthy user's nicknames can be added
            return false;
        return true;
    });
}
/* jshint ignore:end */
function getCookie(cookies, name) {
    try {
        //@ts-ignore
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
exports.default = {
    storeVisit: (req) => {
        database_utils_1.default.addVisitEntry(getIP(req), req.headers['user-agent']);
    },
    fetch_ranking: (req, resp) => {
        let page_nr = req.body.page || 0;
        database_utils_1.default.searchTopRankUsers(page_nr, ROWS_PER_PAGE).then((res) => {
            let response = {
                result: 'SUCCESS',
                user_infos: [] //array to fill with mysql response data
            };
            res.forEach((user_info, index) => {
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
        }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
    },
    /*search_user: (req: any, resp: any) => {
        DatabaseUtils.searchUsers(req.body.username || '').then(res => {
            let response: any = {
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
        }).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
    },
    search_game: (req: any, resp: any) => {
        DatabaseUtils.searchGames(req.body.gamename || '').then(res => {
            let response: any = {
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
        }).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
    },*/
    /* jshint ignore:start */ //ignore async/await statements
    restoreSession(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            const session_key = getUserSessionKey(req);
            let res = yield database_utils_1.default.checkSession(session_key);
            if (res.length < 1)
                return sendResponse(resp, { result: 'NO_SESSION' });
            //silently updating last_seen date and ip information
            database_utils_1.default.updateLastLogin(getIP(req), res[0].id);
            let response = {
                result: 'SUCCESS',
                ID: res[0].id,
                NICK: res[0].nickname,
                REGISTER_DATE: res[0].register_date,
                LAST_SEEN: res[0].last_login,
                EMAIL: res[0].email,
                CUSTOM_DATA: res[0].custom_data,
            };
            if (req.body.fetch_games === 'true' || req.body.fetch_games === true) {
                let page_nr = req.body.page || 0;
                let games = yield database_utils_1.default.getUserGames(res[0].id, page_nr, ROWS_PER_PAGE);
                response.GAMES = [];
                games.forEach((game_info, index) => {
                    if (index === games.length - 1) {
                        response.total_games = game_info.id;
                        response.page = ~~page_nr;
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
            }
            sendResponse(resp, response);
        });
    },
    get_user_info(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            let user_info = yield database_utils_1.default.findUserByID(req.body.id);
            if (user_info === null)
                sendResponse(resp, { result: 'ERROR' });
            else {
                let response = {
                    result: 'SUCCESS',
                    ID: user_info.id,
                    NICK: user_info.nickname,
                    REGISTER_DATE: user_info.register_date,
                    LAST_SEEN: user_info.last_login,
                    CUSTOM_DATA: user_info.custom_data,
                };
                if (req.body.fetch_games === 'true' || req.body.fetch_games === true) {
                    let page_nr = req.body.page || 0;
                    let games = yield database_utils_1.default.getUserGames(user_info.id, page_nr, ROWS_PER_PAGE);
                    response.GAMES = [];
                    games.forEach((game_info, index) => {
                        if (index === games.length - 1) {
                            response.total_games = game_info.id;
                            response.page = ~~page_nr;
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
                }
                sendResponse(resp, response);
            }
        });
    },
    login_user(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            let user_info = yield database_utils_1.default.findUserByNick(req.body.username);
            if (user_info === null) //user not found
                return sendResponse(resp, { result: 'USER_DOES_NOT_EXISTS' });
            let pass = crypto.createHash('sha1').update(req.body.password).digest('base64');
            //checking whether user send correct password
            if (user_info.password !== pass)
                return sendResponse(resp, { result: 'INCORRECT_PASSWORD' });
            if (user_info.register_hash !== 'verified') {
                if (user_info.register_hash === 'banned')
                    return sendResponse(resp, { result: 'ACCOUNT_BANNED' });
                else
                    return sendResponse(resp, { result: 'ACCOUNT_NOT_VERIFIED' });
            }
            let sess_keys = generateSessionKeys(req);
            database_utils_1.default.createUserSession(sess_keys.sessionkey, user_info.id).then(() => {
                //silently updating last_seen date and ip information
                if (user_info === null)
                    throw new Error('user_info variable has become null');
                database_utils_1.default.updateLastLogin(getIP(req), user_info.id);
                sendResponse(resp, {
                    result: 'SUCCESS',
                    user_key: sess_keys.userkey //public session key for logged user
                });
            }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
        });
    },
    register_account(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            let nick = req.body.username;
            let pass = crypto.createHash('sha1').update(req.body.password).digest('base64');
            let email = req.body.email;
            //let ip = req.connection.remoteAddress.replace(/::ffff:/, '');
            if (nick.length < 3)
                return sendResponse(resp, { result: 'USERNAME_TOO_SHORT' });
            else if (pass.length < 8)
                return sendResponse(resp, { result: 'PASSWORD_TOO_SHORT' });
            else if (validateEmail(email) !== true)
                return sendResponse(resp, { result: 'INCORRECT_EMAIL' });
            let user_info = yield database_utils_1.default.findUserByNick(nick);
            if (user_info !== null)
                return sendResponse(resp, { result: 'USER_ALREADY_EXISTS' });
            user_info = yield database_utils_1.default.findUserByEmail(email);
            if (user_info !== null)
                return sendResponse(resp, { result: 'EMAIL_IN_USE' });
            //randomly generated base64 string needed for account verification		
            const register_hash = randomString(20).toString('base64');
            database_utils_1.default.registerAccount(nick, pass, email, register_hash, getIP(req), INITIAL_CUSTOM_USER_DATA).then(() => {
                return email_1.default.sendVerificationCode(register_hash, email);
            }).then(() => sendResponse(resp, { result: 'SUCCESS' }))
                .catch(e => sendResponse(resp, { result: 'EMAIL_SEND_ERROR' }));
        });
    },
    resend_verification_link(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            let nick = req.body.username;
            let pass = crypto.createHash('sha1').update(req.body.password).digest('base64');
            let user_info = yield database_utils_1.default.findUserByNick(nick);
            if (user_info === null)
                return sendResponse(resp, { result: 'USER_DOES_NOT_EXISTS' });
            if (user_info.password !== pass)
                return sendResponse(resp, { result: 'INCORRECT_PASSWORD' });
            if (user_info.register_hash === 'verified')
                return sendResponse(resp, { result: 'ACCOUNT_ALREADY_VERIFIED' });
            email_1.default.sendVerificationCode(user_info.register_hash, user_info.email).then(() => {
                sendResponse(resp, { result: 'SUCCESS' });
            }).catch(e => sendResponse(resp, { result: 'EMAIL_SEND_ERROR' }));
        });
    },
    /* jshint ignore:end */
    get_game_info: function (req, resp) {
        database_utils_1.default.findGameByID(req.body.id).then(res => {
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
        }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
    },
    logout_user: (req, resp) => {
        const session_key = getUserSessionKey(req);
        database_utils_1.default.endUserSession(session_key).then(res => {
            sendResponse(resp, { result: 'SUCCESS' });
        }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
    },
    verifyAccount: (code) => {
        return new Promise((resolve, reject) => {
            console.log('Verifying account using code:', code);
            let query = "SELECT * FROM `users` WHERE `register_hash` = '" + code + "';";
            database_utils_1.default.customQuery(query).then((search_res) => {
                if (search_res.length < 1) {
                    reject();
                    return;
                }
                //verify
                let verify_query = "UPDATE `users` SET `register_hash` = 'verified' \
					WHERE `users`.`register_hash` = '" + code + "';";
                database_utils_1.default.customQuery(verify_query).then(() => {
                    resolve(search_res[0].nickname);
                }).catch(reject);
            }).catch(reject);
        });
    },
    //////////////////////////////////////////////////////////////////////////////////////
    get_threads: (req, resp) => {
        let page_nr = req.body.page || 0;
        database_utils_1.default.getThreads(req.body.category, page_nr, ROWS_PER_PAGE).then(res => {
            let response = {
                result: 'SUCCESS',
                THREADS: []
            };
            res.forEach((thread, index) => {
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
        }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
    },
    get_thread_content: (req, resp) => {
        let page_nr = req.body.page || 0;
        database_utils_1.default.getThreadContent(req.body.thread, page_nr, ROWS_PER_PAGE).then(res => {
            let response = {
                result: 'SUCCESS',
                POSTS: []
            };
            res.forEach((post, index) => {
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
        }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
    },
    /* jshint ignore:start */ //ignore async/await statements
    submit_answer(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (validateText(req.body.content) === false)
                return sendResponse(resp, { result: 'ERROR' });
            //checking if user is logged in
            const session_key = getUserSessionKey(req);
            let user_session = yield database_utils_1.default.checkSession(session_key);
            if (user_session.length < 1)
                return sendResponse(resp, { result: 'NO_SESSION' });
            //incrementing post number in thread record
            database_utils_1.default.onPostCreated((req.body.thread || 0));
            //submitting
            database_utils_1.default.addPost(user_session[0].id, req.body.thread || 0, req.body.content).then(res => {
                sendResponse(resp, { result: 'SUCCESS' });
            }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
        });
    },
    create_thread(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (validateText(req.body.subject, 256) === false || validateText(req.body.content) === false)
                return sendResponse(resp, { result: 'ERROR' });
            //checking if user is logged in
            const session_key = getUserSessionKey(req);
            let user_session = yield database_utils_1.default.checkSession(session_key);
            if (user_session.length < 1)
                return sendResponse(resp, { result: 'NO_SESSION' });
            let new_thread_id = 0;
            //inserting thread record
            database_utils_1.default.addThread(user_session[0].id, req.body.category, req.body.subject).then(res => {
                return database_utils_1.default.customQuery("SELECT LAST_INSERT_ID() as 'last_id';");
            }).then(res => {
                //console.log(res);
                new_thread_id = res[0].last_id;
                //submitting first post
                return database_utils_1.default.addPost(user_session[0].id, new_thread_id, req.body.content);
            }).then(res => {
                sendResponse(resp, { result: 'SUCCESS', ID: new_thread_id });
            }).catch(e => {
                console.error('creating thread error:', e);
                sendResponse(resp, { result: 'ERROR' });
            });
        });
    },
    //admin request
    ban_user(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            let is_admin = yield isAdmin(req);
            if (!is_admin)
                return sendResponse(resp, { result: 'ERROR' });
            let ban_query = "UPDATE `users` SET `register_hash` = 'banned' \
			WHERE `users`.`nickname` = '" + req.body.username + "';";
            database_utils_1.default.customQuery(ban_query).then((res) => {
                if (res.changedRows === 0)
                    sendResponse(resp, { result: 'USER_NOT_FOUND' });
                else
                    sendResponse(resp, { result: 'SUCCESS' });
            }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
        });
    },
    get_statistics(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            let is_admin = yield isAdmin(req);
            if (!is_admin)
                return sendResponse(resp, { result: 'ERROR' });
            //console.log( req.body );
            //custom query - TODO
            let stats_query = "SELECT * FROM `BertaBall`.`visits`\
			WHERE `time` >= '" + req.body.from + "' AND `time` < '" + req.body.to + "'\
			ORDER BY `time` DESC LIMIT 1000;";
            database_utils_1.default.customQuery(stats_query).then((res) => {
                let response = {
                    result: 'SUCCESS',
                    VISITS: []
                };
                res.forEach(_visit => {
                    response.VISITS.push({
                        IP: _visit.ip,
                        TIME: _visit.time
                    });
                });
                sendResponse(resp, response);
            }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
        });
    },
    /* jshint ignore:end */
    get_latest_news: (req, resp) => {
        database_utils_1.default.customQuery("SELECT \
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
			LIMIT 10;").then(res => {
            let response = {
                result: 'SUCCESS',
                NEWS: []
            };
            res.forEach((_new) => {
                response.NEWS.push({
                    THREAD_ID: _new.thread_id,
                    SUBJECT: _new.subject,
                    TIME: _new.time,
                    CONTENT: _new.content
                });
            });
            sendResponse(resp, response);
        }).catch((e) => sendResponse(resp, { result: 'ERROR' }));
    }
};
