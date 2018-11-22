/* jshint multistr:true */

import * as crypto from 'crypto';
import * as path from 'path';
const Canvas = require('canvas');
const Image = Canvas.Image;
import * as fs from 'fs';
import Email from './email';
import DatabaseUtils, {UserInfoI, THREAD_CATEGORY} from './../database_utils';

import Cache from './cache';

const ROWS_PER_PAGE = 20;//(20) users ranking page

const session_cookie_name = 'user_session';
const INITIAL_CUSTOM_USER_DATA = JSON.stringify({//user's custom_data assigned during account creation
	level: 1,//integer
	exp: 0,//0 => 1, where 1 means level up
	coins: 0,//integer

	ship_type: 0,//number corresponding to value in Player.TYPES
	avaible_ships: [0]
});

var cached_buffer;

function convertImage(file_path: string) {//crop and rescale user's avatar image
	return new Promise(async (resolve, reject) => {
		//@ts-ignore
		fs.readFile(file_path, function(err: Error, squid: string) {
			if(err) throw err;
			var image = new Image();
			
			image.onload = () => {
				const canvas = new Canvas(128, 128);
	  			const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

	  			var aspect = image.width / image.height;
	  			if(image.width >= image.height)
		  			ctx.drawImage(image, 64 - 64*aspect, 0, 128 * aspect, 128);
		  		else
		  			ctx.drawImage(image, 0, 64 - 64/aspect, 128, 128/aspect);
			 
			 	var new_path = file_path.replace(/\..+$/i, '.png');
		  		var out = fs.createWriteStream( new_path ), 
		    		stream = canvas.pngStream();
				 
				stream.on('data', function(chunk: any) {
				 	out.write(chunk);
				});
				 
				stream.on('end', function() {
				 	resolve(new_path);
				});
			};
			image.onerror = (e: string | Event) => reject(e);

			image.src = squid;
		});
	});
}

const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function randomString(len: number) {
    let random_str = '';
    for(let i=0; i<len; i++)
    	random_str += chars[ (Math.random() * chars.length)|0 ];
    return random_str;
}

function validateText(text: string, max_len = 2048) {//@bool
	text = text.trim();
	if(text.length < 3 || text.length > max_len)
		return false;
	return true;
}

var getIP = (req: any) => req.connection.remoteAddress.replace(/::ffff:/, '');

function getUserSessionKey(req: any) {
	try {
		let key = getCookie(req.headers.cookie, session_cookie_name);
		//let ip = req.connection.remoteAddress.replace(/::ffff:/, '');
		return crypto.createHash('sha256').update(req.headers['user-agent'] + /*ip + */key)
			.digest('base64');
	}
	catch(e) {
		console.error();
		return '';
	}
}

function generateSessionKeys(req: any) {
	//generating session key
	let useragent = req.headers['user-agent'];
	//console.log('useragent:', useragent);

	//generating user key
	let user_key: string = (<any>randomString(32)).toString('base64');
	
	let session_key = crypto.createHash('sha256').update(useragent + /*getIP(req) + */user_key)
		.digest('base64');
	return {
		sessionkey: session_key, 
		userkey: user_key,
	};
}

/* jshint ignore:start */
async function isAdmin(req: any) {
	const session_key = getUserSessionKey(req);
	let res = await DatabaseUtils.checkSession(session_key);

	if(res.length < 1 || res[0].nickname !== 'Admin')//more worthy user's nicknames can be added
		return false;
	return true;
}
/* jshint ignore:end */

function getCookie(cookies: string, name: string) {
	try {
		//@ts-ignore
		return cookies.match(new RegExp('.*' + name + '=([^;]*)', 'i'))[1]
			.replace(/%3D/gi, '=');//escape '=' chars
	} catch(e) {//cookie not found
		return null;
	}
}

function validateEmail(email: string) {
	return email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) !== null;
}

function sendResponse(resp: any, data: any) {
	// resp.end( JSON.stringify(data) );
	resp.json( data );
}

export default {//Actions
	storeVisit: (req: any, resp: any) => {
		DatabaseUtils.addVisitEntry(getIP(req), req.headers['user-agent'], null);
		resp.end();
	},

	fetch_ranking: (req: any, resp: any) => {
		let page_nr = req.body.page || 0;

		if(page_nr == 0) {//very often requested page
			if( (cached_buffer = Cache.getCache('ranking_first_page')) ) {
				sendResponse(resp, cached_buffer.data);
				return;
			}
		}

		DatabaseUtils.searchTopRankUsers(page_nr, ROWS_PER_PAGE).then((res) => {
			let response: any = {
				result: 'SUCCESS',
				user_infos: []//array to fill with mysql response data
			};
			res.forEach((user_info, index: number) => {
				if(index === res.length-1) {
					response.total_users = user_info.id;
					response.page = ~~page_nr;
					response.rows_per_page = ROWS_PER_PAGE;
				}
				else {
					response.user_infos.push({
						ID: 	user_info.id,
						NICK: 	user_info.nickname,
						RANK: 	user_info.rank
					});
				}
			});
			
			sendResponse(resp, response);
			if(page_nr == 0)
				Cache.createCache('ranking_first_page', 1000 * 60 * 10, response);//10 minutes
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	async restoreSession(req: any, resp: any) {
		const session_key = getUserSessionKey(req);
		let res = await DatabaseUtils.checkSession(session_key);

		if(req.body.store === true || req.body.store === 'true') {
			DatabaseUtils.addVisitEntry(getIP(req), req.headers['user-agent'], 
				res.length > 0 ? res[0].id : null);
		}

		if(res.length < 1)
			return sendResponse(resp, {result: 'NO_SESSION'});

		//silently updating last_seen date and ip information
		DatabaseUtils.updateLastLogin( getIP(req), res[0].id );

		//var nickBase64 = Buffer.from(res[0].nickname).toString('base64');
		//console.log(nickBase64, res[0].avatar);

		let response: any = {
			result: 		'SUCCESS',
			ID: 			res[0].id,
			NICK: 			res[0].nickname,
			EMAIL: 			res[0].email,
			AVATAR: 		res[0].avatar,
			REGISTER_DATE: 	res[0].register_date,
			LAST_SEEN: 		res[0].last_login,
			CUSTOM_DATA: 	res[0].custom_data,
		};

		if(req.body.fetch_games === 'true' || req.body.fetch_games === true) {
			let page_nr = req.body.page || 0;

			let games = await DatabaseUtils.getUserGames(res[0].id, page_nr, ROWS_PER_PAGE);

			response.GAMES = [];

			games.forEach((game_info, index: number) => {
				if(index === games.length-1) {
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
	},

	async fetch_account_games(req: any, resp: any) {
		let page_nr = req.body.page || 0;

		const session_key = getUserSessionKey(req);
		let res = await DatabaseUtils.checkSession(session_key);
		if(res.length < 1)
			return sendResponse(resp, {result: 'NO_SESSION'});

		let games = await DatabaseUtils.getUserGames(res[0].id, page_nr, ROWS_PER_PAGE);

		let response: any = {
			result: 'SUCCESS',
			GAMES: []
		};

		games.forEach((game_info, index: number) => {
			if(index === games.length-1) {
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

		sendResponse(resp, response);
	},

	async get_user_info(req: any, resp: any) {
		let user_info = await DatabaseUtils.findUserByID( req.body.id );

		if(user_info === null)
			sendResponse(resp, {result: 'ERROR'});
		else {
			let response: any = {
				result: 		'SUCCESS',
				ID: 			user_info.id,
				NICK: 			user_info.nickname,
				REGISTER_DATE: 	user_info.register_date,
				LAST_SEEN: 		user_info.last_login,
				CUSTOM_DATA: 	user_info.custom_data,
			};
			if(req.body.fetch_games === 'true' || req.body.fetch_games === true) {
				let page_nr = req.body.page || 0;

				let games = await DatabaseUtils.getUserGames(user_info.id, page_nr, ROWS_PER_PAGE);

				response.GAMES = [];

				games.forEach((game_info, index) => {
					if(index === games.length-1) {
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
	},
	
	async login_user(req: any, resp: any) {
		let user_info = await DatabaseUtils.findUserByNick( req.body.username );
		if(user_info === null)//user not found
			return sendResponse(resp, {result: 'USER_DOES_NOT_EXISTS'});

		let pass = crypto.createHash('sha256').update(req.body.password).digest('base64');

		//checking whether user send correct password
		if(user_info.password !== pass)
			return sendResponse(resp, {result: 'INCORRECT_PASSWORD'});
		if(user_info.register_hash !== 'verified') {
			if(user_info.register_hash === 'banned')
				return sendResponse(resp, {result: 'ACCOUNT_BANNED'});
			else
				return sendResponse(resp, {result: 'ACCOUNT_NOT_VERIFIED'});
		}
		let sess_keys = generateSessionKeys(req);

		DatabaseUtils.createUserSession(sess_keys.sessionkey, user_info.id).then(() => {
			//silently updating last_seen date and ip information
			if(user_info === null)
				throw new Error('user_info variable has become null');
			DatabaseUtils.updateLastLogin( getIP(req), user_info.id );

			DatabaseUtils.addVisitEntry(getIP(req), req.headers['user-agent'], user_info.id);

			sendResponse(resp, {
				result: 'SUCCESS',
				user_key: sess_keys.userkey//public session key for logged user
			});
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	async register_account(req: any, resp: any) {
		let nick = req.body.username;
		let pass = crypto.createHash('sha256').update(req.body.password).digest('base64');
		let email = req.body.email;
		//let ip = req.connection.remoteAddress.replace(/::ffff:/, '');

		if(nick.length < 3)
			return sendResponse(resp, {result: 'USERNAME_TOO_SHORT'});
		else if(pass.length < 8)
			return sendResponse(resp, {result: 'PASSWORD_TOO_SHORT'});
		else if(validateEmail(email) !== true)
			return sendResponse(resp, {result: 'INCORRECT_EMAIL'});

		let user_info = await DatabaseUtils.findUserByNick( nick );
		if(user_info !== null)
			return sendResponse(resp, {result: 'USER_ALREADY_EXISTS'});

		user_info = await DatabaseUtils.findUserByEmail( email );
		if(user_info !== null)
			return sendResponse(resp, {result: 'EMAIL_IN_USE'});
		
		//randomly generated base64 string needed for account verification		
		const register_hash: string = (<any>randomString(20)).toString('base64');

		DatabaseUtils.registerAccount(nick, pass, email, register_hash, getIP(req), INITIAL_CUSTOM_USER_DATA).then(() => {

			return Email.sendVerificationCode( register_hash, email );
		}).then(() => sendResponse(resp, {result: 'SUCCESS'}))
		.catch(e => sendResponse(resp, {result: 'EMAIL_SEND_ERROR'}));
	},

	async resend_verification_link(req: any, resp: any) {
		let nick = req.body.username;
		let pass = crypto.createHash('sha256').update(req.body.password).digest('base64');

		let user_info = await DatabaseUtils.findUserByNick( nick );
		if(user_info === null)
			return sendResponse(resp, {result: 'USER_DOES_NOT_EXISTS'});

		if(user_info.password !== pass)
			return sendResponse(resp, {result: 'INCORRECT_PASSWORD'});

		if(user_info.register_hash === 'verified')
			return sendResponse(resp, {result: 'ACCOUNT_ALREADY_VERIFIED'});
		
		Email.sendVerificationCode(user_info.register_hash, user_info.email).then(() => {
			sendResponse(resp, {result: 'SUCCESS'});
		}).catch(e => sendResponse(resp, {result: 'EMAIL_SEND_ERROR'}));
	},

	get_game_info: function(req: any, resp: any) {
		DatabaseUtils.findGameByID( req.body.id ).then(res => {
			if(res === null)
				return sendResponse(resp, {result: 'ERROR'});

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
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	logout_user: (req: any, resp: any) => {
		const session_key = getUserSessionKey(req);
		DatabaseUtils.endUserSession(session_key).then(res => {
			sendResponse(resp, {result: 'SUCCESS'});
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	verifyAccount: (code: string) => {//@code - verification code
		return new Promise((resolve, reject) => {
			console.log('Verifying account using code:', code);

			let query = "SELECT * FROM `users` WHERE `register_hash` = '" + code + "';";
			DatabaseUtils.customQuery(query).then((search_res: UserInfoI[]) => {
				if(search_res.length < 1) {
					reject();
					return;
				}
				//verify
				let verify_query = "UPDATE `users` SET `register_hash` = 'verified' \
					WHERE `users`.`register_hash` = '" + code + "';";
				DatabaseUtils.customQuery(verify_query).then(() => {
					resolve( search_res[0].nickname );
				}).catch(reject);
				
			}).catch(reject);
		});
	},

	//////////////////////////////////////////////////////////////////////////////////////

	get_threads: (req: any, resp: any) => {
		let page_nr = req.body.page || 0;

		//only caching news category is good idea since it is not changing much ofter
		if(page_nr == 0 && req.body.category == THREAD_CATEGORY.NEWS) {
			if( (cached_buffer = Cache.getCache('news_threads')) ) {
				sendResponse(resp, cached_buffer.data);
				return;
			}
		}

		DatabaseUtils.getThreads(req.body.category, page_nr, ROWS_PER_PAGE).then(res => {
			let response: any = {
				result: 'SUCCESS',
				THREADS: []
			};
			
			res.forEach((thread, index: number) => {
				if(index === res.length-1) {
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
			if(page_nr == 0 && req.body.category == THREAD_CATEGORY.NEWS)
				Cache.createCache('news_threads', 1000 * 60 * 60 * 12, response);//12 hours
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	get_thread_content: (req: any, resp: any) => {
		let page_nr = req.body.page || 0;

		DatabaseUtils.getThreadContent(req.body.thread, page_nr, ROWS_PER_PAGE).then(res => {
			let response: any = {
				result: 'SUCCESS',
				POSTS: []
			};

			res.forEach((post, index: number) => {
				if(index === res.length-1) {
					response.total_posts = post.id|0;
					response.page = ~~page_nr;
					response.rows_per_page = ROWS_PER_PAGE;
				}
				else if(index === res.length-2) {
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
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	async submit_answer(req: any, resp: any) {
		if(validateText(req.body.content) === false)
			return sendResponse(resp, {result: 'ERROR'});

		//checking if user is logged in
		const session_key = getUserSessionKey(req);
		let user_session = await DatabaseUtils.checkSession(session_key);

		if(user_session.length < 1)
			return sendResponse(resp, {result: 'NO_SESSION'});

		let thread_category = await DatabaseUtils.getThreadCategory((req.body.thread || 0));
		if(thread_category === null)
			return sendResponse(resp, {result: 'ERROR'});

		if(thread_category == THREAD_CATEGORY.NEWS) {
			let is_admin = await isAdmin(req);
			if( is_admin === false)
				return sendResponse(resp, {result: 'INSUFFICIENT_PERMISSIONS'});
		}

		//incrementing post number in thread record
		DatabaseUtils.onPostCreated( (req.body.thread || 0) );

		//submitting
		DatabaseUtils.addPost(user_session[0].id, req.body.thread || 0, req.body.content).then(res => {
			sendResponse(resp, {result: 'SUCCESS'});
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},
	
	async create_thread(req: any, resp: any) {
		if(validateText(req.body.subject, 256) === false || validateText(req.body.content) === false)
			return sendResponse(resp, {result: 'ERROR'});

		if(req.body.category == THREAD_CATEGORY.NEWS) {
			let is_admin = await isAdmin(req);
			if( is_admin === false)
				return sendResponse(resp, {result: 'INSUFFICIENT_PERMISSIONS'});
		}
		
		//checking if user is logged in
		const session_key = getUserSessionKey(req);
		let user_session = await DatabaseUtils.checkSession(session_key);

		if(user_session.length < 1)
			return sendResponse(resp, {result: 'NO_SESSION'});

		let new_thread_id = 0;

		//inserting thread record
		DatabaseUtils.addThread(user_session[0].id, req.body.category, req.body.subject).then(res => {
			return DatabaseUtils.customQuery("SELECT LAST_INSERT_ID() as 'last_id';");
		}).then(res => {
			//console.log(res);

			new_thread_id = res[0].last_id;
			//submitting first post
			return DatabaseUtils.addPost(user_session[0].id, new_thread_id, req.body.content);
		}).then(res => {
			sendResponse(resp, {result: 'SUCCESS', ID: new_thread_id});
		}).catch(e => {
			console.error('creating thread error:', e);
			sendResponse(resp, {result: 'ERROR'});
		});
	},

	//admin request
	async ban_user(req: any, resp: any) {//or unban depending on request params
		let is_admin = await isAdmin(req);
		if(!is_admin)
			return sendResponse(resp, {result: 'ERROR'});

		let ban_query = "UPDATE `users` SET `register_hash` = 'banned' \
			WHERE `users`.`nickname` = '" + req.body.username + "';";
		DatabaseUtils.customQuery(ban_query).then((res) => {
			if(res.changedRows === 0)
				sendResponse(resp, {result: 'USER_NOT_FOUND'});
			else
				sendResponse(resp, {result: 'SUCCESS'});
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	async get_statistics(req: any, resp: any) {
		let is_admin = await isAdmin(req);
		if(!is_admin)
			return sendResponse(resp, {result: 'ERROR'});

		//console.log( req.body );

		interface VisitRowJSON {
			nickname: string;
			ip: string; 
			time: string;
		}

		let stats_query = "SELECT visits.id, visits.ip, visits.user_agent, visits.time, users.nickname\
			FROM `BertaBall`.`visits`\
				LEFT JOIN `BertaBall`.`users` ON `visits`.`account_id` = `users`.`id`\
			WHERE `visits`.`time` >= '" + req.body.from + "' AND\
				`visits`.`time` < '" + req.body.to + "'\
			ORDER BY `visits`.`id`\
			DESC LIMIT 1000;";
		DatabaseUtils.customQuery(stats_query).then((res: VisitRowJSON[]) => {
			let response: any = {
				result: 'SUCCESS',
				VISITS: []
			};

		    res.forEach(_visit => {
		    	response.VISITS.push({
		    		NICK: _visit.nickname,
					IP: _visit.ip,
					TIME: _visit.time
				});
		    });

		    sendResponse(resp, response);
		}).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	get_latest_news: (req: any, resp: any) => {
		
		if( (cached_buffer = Cache.getCache('latest_news')) ) {
			sendResponse(resp, cached_buffer.data);
			return;
		}

		DatabaseUtils.getLatestNews().then(res => {
		    let response: any = {
				result: 'SUCCESS',
				NEWS: []
			};

		    res.forEach((_new: any) => {
		    	response.NEWS.push({
					THREAD_ID: _new.thread_id,
					SUBJECT: _new.subject,
					TIME: _new.time,
					CONTENT: _new.content
				});
		    });

		    sendResponse(resp, response);
		    Cache.createCache('latest_news', 1000 * 60 * 60 * 12, response);//12 hours
	    }).catch((e: Error) => sendResponse(resp, {result: 'ERROR'}));
	},

	upload_avatar: async (req: any, resp: any, file: any) => {
		//check if user is logged in and retrieve his avatar file name
		const session_key = getUserSessionKey(req);
		let res = await DatabaseUtils.checkSession(session_key);

		if(res.length < 1)
			return resp.status(500).send('User not logged in');

		var base64Nick = Buffer.from(res[0].nickname).toString('base64');

		//console.log( Buffer.from(base64Nick, 'base64').toString('ascii') );

		var ext = file.mimetype.replace(/^.+\//gi, '');
		var image_file = 
			path.join(__dirname, '..', '..', '..', `uploads/user_avatars/${base64Nick}.${ext}`);
		file.mv(image_file, async (err: any): Promise<any> => {
			if(err) {
				console.log(err);
				return resp.status(500).send(err);
			}

			try {
				await convertImage(image_file);
				ext = 'png';

				await DatabaseUtils.customQuery("UPDATE `BertaBall`.`users`\
					SET `avatar` = '" + base64Nick + "." + ext + "'\
					WHERE `id` = " + res[0].id + ";");

				

				setTimeout(() => {
					var folder_path = path.join(__dirname, '..', '..', '..', `uploads/user_avatars`);
					fs.readdir(folder_path, 
						(err: Error, files: string[]) => 
					{
						if(err) throw err;
						files.forEach(f => {
							if(f.endsWith('.jpg') || f.endsWith('.jpeg'))
								fs.unlink(folder_path + '/' + f, function(err){
							        if(err) return console.log(err);
							        console.log('file deleted:', f);
							   });
						});
					});
				}, 100);

				resp.status(200).send(`${base64Nick}.${ext}`);
			}
			catch(e) {
				return resp.status(500).send(e);
			}
		});
	},

	remove_avatar: async (req: any, resp: any, file: any) => {
		const session_key = getUserSessionKey(req);
		let res = await DatabaseUtils.checkSession(session_key);

		if(res.length < 1)
			return sendResponse(resp, {result: 'NO_SESSION'});

		if(res[0].avatar !== null) {
			var update_res = await DatabaseUtils.customQuery("UPDATE `BertaBall`.`users`\
				SET `avatar` = NULL\
				WHERE `id` = " + res[0].id + ";");
			if(update_res.changedRows > 0)
				return sendResponse(resp, {result: 'SUCCESS'});
			else
				return sendResponse(resp, {result: 'DATABASE_ERROR'});
		}
	}
};