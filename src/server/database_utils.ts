const MySQL = require('mysql');
/* jshint multistr:true */


enum STATUS {
    ERROR,
    PENDING,
    SUCCESS
}

var status = STATUS.PENDING;

var prompt = require('prompt-sync')();

var mysql_pass = process.env.npm_config_mysqlpass;
if(!mysql_pass) {
	try {//ask user to type password in console
		mysql_pass = prompt('MySQL password: ');
	}
	catch(e) {
		console.error(
			'Cannot prompt user for email password since server is running in nodemon');
		console.error(
			'You must specify mysql password adding --mysqlpass=PASSWORD to console npm command');
		process.exit();
	}
}

var connection = MySQL.createConnection({
	host: "localhost",
	user: "root",
	password: String(mysql_pass),
	database: "BertaBall"
});

connection.connect((err: Error) => {
	if(err) {
		console.error('Error while connecting to MySQL database: ' + err.stack);
		status = STATUS.ERROR;
		return;
	}
	status = STATUS.SUCCESS;
	console.log('MySQL connection established');
});

const UTILS = {
	currentTime: function(): string {
		let date = new Date();
		let m = date.getUTCMonth() + 1;
		let d = date.getDate();
		let mins = date.getMinutes();
		let hours = date.getHours();
		return date.getFullYear() + '-' + 
			(m < 10 ? ('0' + m) : m) + '-' + 
			(d < 10 ? ('0' + d) : d) + ' ' +
			(hours < 10 ? ('0' + hours) : hours) + ':' + 
			(mins < 10 ? ('0' + mins) : mins);
	}
};

export interface UserRankInfoI {
	id: number;
	nickname: string;
	rank: number;
}

export interface UserInfoI {
	id: number;
	nickname: string;
	password: string;
	email: string;
	avatar: string;
	register_hash: string;
	register_date: string;
	last_login: string;
	custom_data: string;
	friends: string;
}

export interface GameInfoI {
	id: number;
	name: string;
	map: string;
	gamemode: number;
	duration: number;
	time: string;
	result: string;
}

export interface ThreadsInfoI {
	id: number;
	author_id: number;
	nickname: string;
	subject: string;
	time: string;
	last_post_time: string;
	total_posts: number;
}

export interface PostInfoI {
	id: number;
	author_id: number;
	nickname: string;
	content: string;
	time: string;
}

export interface NewsInfoI {
	thread_id: number;
	subject: string;
	time: string;
	content: string;
}

export enum THREAD_CATEGORY {
	NEWS = 1,
	GENERAL = 2,
	HELP = 3,
	BUGS = 4
}

const self = {
	customQuery: (query: string): Promise<any> => {
		return new Promise((resolve, reject) => {
			if(status === STATUS.PENDING)
				setTimeout(() => self.customQuery(query).then(resolve).catch(reject), 1000);
			else if (status === STATUS.SUCCESS) {
				connection.query(query, function(err: Error, result: any) {
					if(err) 
						reject(err);
					else
						resolve(result);
				});
			}
			else
				reject('MySQL connection failed');
		});
	},

	addVisitEntry: (ip: string, user_agent: string, account_id: number | null) =>
		self.customQuery("INSERT INTO `visits` (`ip`, `user_agent`, `time`, `account_id`) VALUES ('" + 
			ip + "', '" + user_agent + "', '" + UTILS.currentTime() + "', " + 
			(account_id || 'NULL') + ")"),

	checkSession: (session_key: string) =>//returns mysql query result
		<Promise<UserInfoI[]>>self.customQuery("SELECT * FROM `users` WHERE `session_key`='" + session_key + "' AND `register_hash` != 'banned' LIMIT 1;"),

	endUserSession: (session_key: string) =>//basically logouts user
		self.customQuery("UPDATE `users` SET `session_key`=NULL, `last_login` = '" + 
			UTILS.currentTime() + "' WHERE `users`.`session_key`='" + session_key + "';"),

	updateLastLogin: (ip: string, user_id: number) =>
		self.customQuery("UPDATE `users` SET `ip` = '" + ip + "', `last_login` = '" + 
			UTILS.currentTime() + "' WHERE `users`.`id` = " + user_id + ";"),

	searchTopRankUsers: (page_id: number, rows_per_page: number) =>
		<Promise<UserRankInfoI[]>>self.customQuery("(SELECT `id`, `nickname`, `rank` FROM `BertaBall`.`users` ORDER BY `rank` DESC LIMIT " + (page_id*rows_per_page) + ", " + rows_per_page + ") UNION (SELECT COUNT(*), NULL, NULL FROM `BertaBall`.`users`);"),

	getUserGames: (user_id: number, page_id: number, rows_per_page: number) => 
		<Promise<GameInfoI[]>>self.customQuery("(SELECT `id`, `name`, `map`, `gamemode`, `duration`, `time`, `result` FROM `games` \
			WHERE `result` LIKE '%" + "\"user_id\":" + user_id + ",%' \
			ORDER BY `time` DESC \
			LIMIT " + (page_id*rows_per_page) + ", " + rows_per_page +  ") \
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`games` \
			WHERE `result` LIKE '%" + "\"user_id\":" + user_id + ",%' );"),

	findGameByID: (game_id: number) =>
		<Promise<GameInfoI | null>>self.customQuery("SELECT * FROM `games` WHERE `id` = " + game_id + " LIMIT 1;")
			.then((res: any) => res.length > 0 ? res[0] : null),

	findUserByID: (user_id: number) =>
		<Promise<UserInfoI | null>>self.customQuery("SELECT * FROM `users` WHERE `id` = " + user_id + " LIMIT 1;")
			.then((res: any) => res.length > 0 ? res[0] : null),

	findUserByNick: (user_nick: string) => 
		<Promise<UserInfoI | null>>self.customQuery("SELECT * FROM `users` WHERE `nickname` = '" + user_nick + "' LIMIT 1;")
			.then((res: any) => res.length > 0 ? res[0] : null),

	findUserByEmail: (email: string) =>
		<Promise<UserInfoI | null>>self.customQuery("SELECT * FROM `users` WHERE `email` = '" + email + "' LIMIT 1;")
			.then((res: any) => res.length > 0 ? res[0] : null),

	createUserSession: (key: string, user_id: number) => //@pass - already hashed user password
		self.customQuery("UPDATE `users` SET `session_key` = '" + key + 
			"' WHERE `users`.`id` = " + user_id + ";"),

	registerAccount: (nick: string, pass: string, email: string, register_hash: string, ip: string, custom_data: string) =>
		self.customQuery("INSERT INTO `users` (`nickname`, `password`, `email`, `register_hash`, `ip`, `register_date`, `custom_data`) VALUES ('" + nick + "', '" + pass + "', '" + email + "', '" + register_hash + "', '" + ip + 
			"', '" + UTILS.currentTime() + "', '" + custom_data + "');"),

	updateUserCustomData: (user_id: number, string_data: string, rank: number) =>
		self.customQuery("UPDATE `users` SET `rank` = " + rank + ", `custom_data` = '" + string_data + 
			"' WHERE `users`.`id` = " + user_id + ";"),

	updateFriendsList: (user_id: number, string_data: string) =>
		self.customQuery("UPDATE `users` SET `friends` = '" + string_data + 
			"' WHERE `users`.`id` = " + user_id + ";"),

	saveGameResult: (name: string, map: string, gamemode: number, duration: number, result_string: string) => {
		self.customQuery("INSERT INTO `games` (`name`, `map`, `gamemode`, `duration`, `time`, `result`) VALUES ('" +
			name + "', '" + map + "', " + gamemode + ", " + duration + ", '" + UTILS.currentTime() + "', '" + 
			result_string + "');");
	},

	onPostCreated: (thread_id: number) =>
		self.customQuery("UPDATE `threads` SET `total_posts` = `total_posts` + 1, `last_post_time` = '" + UTILS.currentTime() + "' WHERE `id` = " + 
			thread_id + ";"),

	getThreadCategory: (thread_id: number) =>
		<Promise<THREAD_CATEGORY | null>>self.customQuery("SELECT `threads`.`category`\
			FROM `BertaBall`.`threads`\
			WHERE threads.id = " + thread_id + " LIMIT 1;")
		.then(res => res.length > 0 ? Number(res[0].category) : null),

	getThreads: (category: number, page_id: number, rows_per_page: number) =>
		<Promise<ThreadsInfoI[]>>self.customQuery("(SELECT `threads`.*, `users`.`nickname` FROM `threads` \
			INNER JOIN `users` ON `threads`.`author_id` = `users`.`id` \
			WHERE `category` = " + category + " \
			ORDER BY `threads`.`last_post_time` DESC \
			LIMIT " + (page_id*rows_per_page) + ", " + rows_per_page +  ")\
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`threads` \
			WHERE `category` = " + category + ");"),

	getThreadContent: (thread_id: number, page_id: number, rows_per_page: number) =>
		<Promise<PostInfoI[]>>self.customQuery("(SELECT `posts`.*, `users`.`nickname` FROM `BertaBall`.`posts` \
			INNER JOIN `BertaBall`.`users` ON `posts`.`author_id` = `users`.`id` \
			WHERE `thread_id` = " + thread_id + " \
			ORDER BY `id` ASC \
			LIMIT " + (page_id*rows_per_page) + ", " + rows_per_page +  ")\
			UNION \
			(SELECT `threads`.`subject`, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`threads` \
			WHERE `threads`.`id` = " + thread_id + ") \
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`posts` \
			WHERE `thread_id` = " + thread_id + ");"),

	getLatestNews: () =>
		<Promise<NewsInfoI[]>>self.customQuery("SELECT \
			    `threads`.`id` AS `thread_id`,\
			    `threads`.`subject`,\
			    `posts`.`time`,\
			    `posts`.`content`\
			FROM\
			    `BertaBall`.`threads`\
			        JOIN\
			    `BertaBall`.`posts` ON `posts`.`id` = (SELECT \
			            `posts`.`id`\
			        FROM\
			            `BertaBall`.`posts`\
			        WHERE\
			            `posts`.`thread_id` = `threads`.`id`\
			        ORDER BY `posts`.`id` DESC\
			        LIMIT 1)\
			WHERE\
			    `category` = 1\
			ORDER BY \
				`posts`.`time` DESC\
			LIMIT 10;"),

	addPost: (author_id: number, thread_id: number, content: string) =>
		self.customQuery("INSERT INTO `posts` (`author_id`, `thread_id`, `time`, `content`) \
			VALUES (" + author_id + ", " + thread_id + ", '" + UTILS.currentTime() + "', '" + 
			content + "');"),

		//NOTE - setting `total_posts` to 1
	addThread: (author_id: number, category: string, subject: string) => 
		self.customQuery("INSERT INTO `threads` \
			(`author_id`, `category`, `subject`, `time`, `last_post_time`, `total_posts`) \
			VALUES (" + author_id + ", " + category + ", '" + subject + "', '" + 
			UTILS.currentTime() + "', '" + UTILS.currentTime() + "', 1);"),
};

export default self;