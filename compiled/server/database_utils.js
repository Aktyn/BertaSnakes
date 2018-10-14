"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// var DatabaseUtils = (function() {
const MySQL = require('mysql');
/* jshint multistr:true */
/*const STATUS = {
    ERROR: 0,
    PENDING: 1,
    SUCCESS: 2
};*/
var STATUS;
(function (STATUS) {
    STATUS[STATUS["ERROR"] = 0] = "ERROR";
    STATUS[STATUS["PENDING"] = 1] = "PENDING";
    STATUS[STATUS["SUCCESS"] = 2] = "SUCCESS";
})(STATUS || (STATUS = {}));
var status = STATUS.PENDING;
var connection = MySQL.createConnection({
    host: "localhost",
    user: "root",
    password: "2718282",
    database: "BertaBall"
});
connection.connect((err) => {
    if (err) {
        console.error('Error while connecting to MySQL database: ' + err.stack);
        status = STATUS.ERROR;
        return;
    }
    status = STATUS.SUCCESS;
    console.log('MySQL connection established');
});
const UTILS = {
    currentTime: function () {
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
const self = {
    customQuery: (query) => {
        return new Promise((resolve, reject) => {
            if (status === STATUS.PENDING)
                setTimeout(() => self.customQuery(query).then(resolve).catch(reject), 1000);
            else if (status === STATUS.SUCCESS) {
                connection.query(query, function (err, result) {
                    if (err)
                        reject(err);
                    else
                        resolve(result);
                });
            }
            else
                reject('MySQL connection failed');
        });
    },
    addVisitEntry: (ip, user_agent) => self.customQuery("INSERT INTO `visits` (`ip`, `user_agent`, `time`) VALUES ('" +
        ip + "', '" + user_agent + "', '" + UTILS.currentTime() + "')"),
    checkSession: (session_key) => //returns mysql query result
     self.customQuery("SELECT * FROM `users` WHERE `session_key`='" + session_key + "' AND `register_hash` != 'banned' LIMIT 1;"),
    endUserSession: (session_key) => //basically logouts user
     self.customQuery("UPDATE `users` SET `session_key`=NULL, `last_login` = '" +
        UTILS.currentTime() + "' WHERE `users`.`session_key`='" + session_key + "';"),
    updateLastLogin: (ip, user_id) => self.customQuery("UPDATE `users` SET `ip` = '" + ip + "', `last_login` = '" +
        UTILS.currentTime() + "' WHERE `users`.`id` = " + user_id + ";"),
    /*searchUsers: username =>//deprecated cause no limit restrictions
        self.customQuery("SELECT * FROM `users` WHERE `nickname` LIKE '%" + username + "%'");*/
    /*searchGames: gamename =>  /same as above
        self.customQuery("SELECT * FROM `games` WHERE `name` LIKE '%" + gamename +
            "%' ORDER BY `time` DESC");*/
    searchTopRankUsers: (page_id, rows_per_page) => self.customQuery("(SELECT `id`, `nickname`, `rank` FROM `BertaBall`.`users` ORDER BY `rank` DESC LIMIT " + (page_id * rows_per_page) + ", " + rows_per_page + ") UNION (SELECT COUNT(*), NULL, NULL FROM `BertaBall`.`users`);"),
    // getUserGames: (user_id, page_id, rows_per_page) => //ORDER BY `time` DESC
    // 	self.customQuery("SELECT * FROM `games` WHERE `result` LIKE '%" + 
    // 	"\"user_id\":" + user_id + ",%' ORDER BY `time` DESC LIMIT 20");
    //ORDER BY `time` DESC
    getUserGames: (user_id, page_id, rows_per_page) => self.customQuery("(SELECT `id`, `name`, `map`, `gamemode`, `duration`, `time`, `result` FROM `games` \
			WHERE `result` LIKE '%" + "\"user_id\":" + user_id + ",%' \
			ORDER BY `time` DESC \
			LIMIT " + (page_id * rows_per_page) + ", " + rows_per_page + ") \
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`games` \
			WHERE `result` LIKE '%" + "\"user_id\":" + user_id + ",%' );"),
    findGameByID: (game_id) => self.customQuery("SELECT * FROM `games` WHERE `id` = " + game_id + " LIMIT 1;")
        .then((res) => res.length > 0 ? res[0] : null),
    findUserByID: (user_id) => self.customQuery("SELECT * FROM `users` WHERE `id` = " + user_id + " LIMIT 1;")
        .then((res) => res.length > 0 ? res[0] : null),
    findUserByNick: (user_nick) => self.customQuery("SELECT * FROM `users` WHERE `nickname` = '" + user_nick + "' LIMIT 1;")
        .then((res) => res.length > 0 ? res[0] : null),
    findUserByEmail: (email) => self.customQuery("SELECT * FROM `users` WHERE `email` = '" + email + "' LIMIT 1;")
        .then((res) => res.length > 0 ? res[0] : null),
    createUserSession: (key, user_id) => //@pass - already hashed user password
     self.customQuery("UPDATE `users` SET `session_key` = '" + key +
        "' WHERE `users`.`id` = " + user_id + ";"),
    registerAccount: (nick, pass, email, register_hash, ip, custom_data) => self.customQuery("INSERT INTO `users` (`nickname`, `password`, `email`, `register_hash`, `ip`, `register_date`, `custom_data`) VALUES ('" + nick + "', '" + pass + "', '" + email + "', '" + register_hash + "', '" + ip +
        "', '" + UTILS.currentTime() + "', '" + custom_data + "');"),
    updateUserCustomData: (user_id, string_data, rank) => self.customQuery("UPDATE `users` SET `rank` = " + rank + ", `custom_data` = '" + string_data +
        "' WHERE `users`.`id` = " + user_id + ";"),
    updateFriendsList: (user_id, string_data) => self.customQuery("UPDATE `users` SET `friends` = '" + string_data +
        "' WHERE `users`.`id` = " + user_id + ";"),
    saveGameResult: (name, map, gamemode, duration, result_string) => {
        self.customQuery("INSERT INTO `games` (`name`, `map`, `gamemode`, `duration`, `time`, `result`) VALUES ('" +
            name + "', '" + map + "', " + gamemode + ", " + duration + ", '" + UTILS.currentTime() + "', '" +
            result_string + "');");
    },
    onPostCreated: (thread_id) => self.customQuery("UPDATE `threads` SET `total_posts` = `total_posts` + 1, `last_post_time` = '" + UTILS.currentTime() + "' WHERE `id` = " +
        thread_id + ";"),
    getThreads: (category, page_id, rows_per_page) => self.customQuery("(SELECT `threads`.*, `users`.`nickname` FROM `threads` \
			INNER JOIN `users` ON `threads`.`author_id` = `users`.`id` \
			WHERE `category` = " + category + " \
			ORDER BY `threads`.`last_post_time` DESC \
			LIMIT " + (page_id * rows_per_page) + ", " + rows_per_page + ")\
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`threads` \
			WHERE `category` = " + category + ");"),
    getThreadContent: (thread_id, page_id, rows_per_page) => self.customQuery("(SELECT `posts`.*, `users`.`nickname` FROM `BertaBall`.`posts` \
			INNER JOIN `BertaBall`.`users` ON `posts`.`author_id` = `users`.`id` \
			WHERE `thread_id` = " + thread_id + " \
			ORDER BY `id` ASC \
			LIMIT " + (page_id * rows_per_page) + ", " + rows_per_page + ")\
			UNION \
			(SELECT `threads`.`subject`, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`threads` \
			WHERE `threads`.`id` = " + thread_id + ") \
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`posts` \
			WHERE `thread_id` = " + thread_id + ");"),
    addPost: (author_id, thread_id, content) => self.customQuery("INSERT INTO `posts` (`author_id`, `thread_id`, `time`, `content`) \
			VALUES (" + author_id + ", " + thread_id + ", '" + UTILS.currentTime() + "', '" +
        content + "');"),
    //NOTE - setting `total_posts` to 1
    addThread: (author_id, category, subject) => self.customQuery("INSERT INTO `threads` \
			(`author_id`, `category`, `subject`, `time`, `last_post_time`, `total_posts`) \
			VALUES (" + author_id + ", " + category + ", '" + subject + "', '" +
        UTILS.currentTime() + "', '" + UTILS.currentTime() + "', 1);"),
};
// return self;
// })();
exports.default = self;
// export default DatabaseUtils;
