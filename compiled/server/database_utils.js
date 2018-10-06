"use strict";
var DatabaseUtils = (function () {
    var MySQL = require('mysql');
    /* jshint multistr:true */
    var self = {
        STATUS: {
            ERROR: 0,
            PENDING: 1,
            SUCCESS: 2
        }
    };
    var status = self.STATUS.PENDING;
    var connection = MySQL.createConnection({
        host: "localhost",
        user: "root",
        password: "2718282",
        database: "BertaBall"
    });
    connection.connect(function (err) {
        if (err) {
            console.error('Error while connecting to MySQL database: ' + err.stack);
            status = self.STATUS.ERROR;
            return;
        }
        status = self.STATUS.SUCCESS;
        console.log('MySQL connection established');
    });
    var UTILS = {
        currentTime: function () {
            var date = new Date();
            var m = date.getUTCMonth() + 1;
            var d = date.getDate();
            var mins = date.getMinutes();
            var hours = date.getHours();
            return date.getFullYear() + '-' +
                (m < 10 ? ('0' + m) : m) + '-' +
                (d < 10 ? ('0' + d) : d) + ' ' +
                (hours < 10 ? ('0' + hours) : hours) + ':' +
                (mins < 10 ? ('0' + mins) : mins);
        }
    };
    self.customQuery = function (query) {
        return new Promise(function (resolve, reject) {
            if (status === self.STATUS.PENDING)
                setTimeout(function () { return self.customQuery(query).then(resolve).catch(reject); }, 1000);
            else if (status === self.STATUS.SUCCESS) {
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
    };
    self.addVisitEntry = function (ip, user_agent) {
        return self.customQuery("INSERT INTO `visits` (`ip`, `user_agent`, `time`) VALUES ('" +
            ip + "', '" + user_agent + "', '" + UTILS.currentTime() + "')");
    };
    self.checkSession = function (session_key) {
        return self.customQuery("SELECT * FROM `users` WHERE `session_key`='" + session_key + "' AND `register_hash` != 'banned' LIMIT 1;");
    };
    self.endUserSession = function (session_key) {
        return self.customQuery("UPDATE `users` SET `session_key`=NULL, `last_login` = '" +
            UTILS.currentTime() + "' WHERE `users`.`session_key`='" + session_key + "';");
    };
    self.updateLastLogin = function (ip, user_id) {
        return self.customQuery("UPDATE `users` SET `ip` = '" + ip + "', `last_login` = '" +
            UTILS.currentTime() + "' WHERE `users`.`id` = " + user_id + ";");
    };
    /*self.searchUsers = username =>//deprecated cause no limit restrictions
        self.customQuery("SELECT * FROM `users` WHERE `nickname` LIKE '%" + username + "%'");*/
    /*self.searchGames = gamename =>  /same as above
        self.customQuery("SELECT * FROM `games` WHERE `name` LIKE '%" + gamename +
            "%' ORDER BY `time` DESC");*/
    self.searchTopRankUsers = function (page_id, rows_per_page) {
        return self.customQuery("(SELECT `id`, `nickname`, `rank` FROM `BertaBall`.`users` ORDER BY `rank` DESC LIMIT " + (page_id * rows_per_page) + ", " + rows_per_page + ") UNION (SELECT COUNT(*), NULL, NULL FROM `BertaBall`.`users`);");
    };
    // self.getUserGames = (user_id, page_id, rows_per_page) => //ORDER BY `time` DESC
    // 	self.customQuery("SELECT * FROM `games` WHERE `result` LIKE '%" + 
    // 	"\"user_id\":" + user_id + ",%' ORDER BY `time` DESC LIMIT 20");
    self.getUserGames = function (user_id, page_id, rows_per_page) {
        return self.customQuery("(SELECT `id`, `name`, `map`, `gamemode`, `duration`, `time`, `result` FROM `games` \
			WHERE `result` LIKE '%" + "\"user_id\":" + user_id + ",%' \
			ORDER BY `time` DESC \
			LIMIT " + (page_id * rows_per_page) + ", " + rows_per_page + ") \
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`games` \
			WHERE `result` LIKE '%" + "\"user_id\":" + user_id + ",%' );");
    };
    self.findGameByID = function (game_id) {
        return self.customQuery("SELECT * FROM `games` WHERE `id` = " + game_id + " LIMIT 1;")
            .then(function (res) { return res.length > 0 ? res[0] : null; });
    };
    self.findUserByID = function (user_id) {
        return self.customQuery("SELECT * FROM `users` WHERE `id` = " + user_id + " LIMIT 1;")
            .then(function (res) { return res.length > 0 ? res[0] : null; });
    };
    self.findUserByNick = function (user_nick) {
        return self.customQuery("SELECT * FROM `users` WHERE `nickname` = '" + user_nick + "' LIMIT 1;")
            .then(function (res) { return res.length > 0 ? res[0] : null; });
    };
    self.findUserByEmail = function (email) {
        return self.customQuery("SELECT * FROM `users` WHERE `email` = '" + email + "' LIMIT 1;")
            .then(function (res) { return res.length > 0 ? res[0] : null; });
    };
    self.createUserSession = function (key, user_id) {
        return self.customQuery("UPDATE `users` SET `session_key` = '" + key +
            "' WHERE `users`.`id` = " + user_id + ";");
    };
    self.registerAccount = function (nick, pass, email, register_hash, ip, custom_data) {
        return self.customQuery("INSERT INTO `users` (`nickname`, `password`, `email`, `register_hash`, `ip`, `register_date`, `custom_data`) VALUES ('" + nick + "', '" + pass + "', '" + email + "', '" + register_hash + "', '" + ip +
            "', '" + UTILS.currentTime() + "', '" + custom_data + "');");
    };
    self.updateUserCustomData = function (user_id, string_data, rank) {
        return self.customQuery("UPDATE `users` SET `rank` = " + rank + ", `custom_data` = '" + string_data +
            "' WHERE `users`.`id` = " + user_id + ";");
    };
    self.updateFriendsList = function (user_id, string_data) {
        return self.customQuery("UPDATE `users` SET `friends` = '" + string_data +
            "' WHERE `users`.`id` = " + user_id + ";");
    };
    self.saveGameResult = function (name, map, gamemode, duration, result_string) {
        self.customQuery("INSERT INTO `games` (`name`, `map`, `gamemode`, `duration`, `time`, `result`) VALUES ('" +
            name + "', '" + map + "', " + gamemode + ", " + duration + ", '" + UTILS.currentTime() + "', '" +
            result_string + "');");
    };
    self.onPostCreated = function (thread_id) {
        return self.customQuery("UPDATE `threads` SET `total_posts` = `total_posts` + 1, `last_post_time` = '" + UTILS.currentTime() + "' WHERE `id` = " +
            thread_id + ";");
    };
    self.getThreads = function (category, page_id, rows_per_page) {
        return self.customQuery("(SELECT `threads`.*, `users`.`nickname` FROM `threads` \
			INNER JOIN `users` ON `threads`.`author_id` = `users`.`id` \
			WHERE `category` = " + category + " \
			ORDER BY `threads`.`last_post_time` DESC \
			LIMIT " + (page_id * rows_per_page) + ", " + rows_per_page + ")\
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`threads` \
			WHERE `category` = " + category + ");");
    };
    self.getThreadContent = function (thread_id, page_id, rows_per_page) {
        return self.customQuery("(SELECT `posts`.*, `users`.`nickname` FROM `BertaBall`.`posts` \
			INNER JOIN `BertaBall`.`users` ON `posts`.`author_id` = `users`.`id` \
			WHERE `thread_id` = " + thread_id + " \
			ORDER BY `id` ASC \
			LIMIT " + (page_id * rows_per_page) + ", " + rows_per_page + ")\
			UNION \
			(SELECT `threads`.`subject`, NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`threads` \
			WHERE `threads`.`id` = " + thread_id + ") \
			UNION \
			(SELECT COUNT(*), NULL, NULL, NULL, NULL, NULL FROM `BertaBall`.`posts` \
			WHERE `thread_id` = " + thread_id + ");");
    };
    self.addPost = function (author_id, thread_id, content) {
        return self.customQuery("INSERT INTO `posts` (`author_id`, `thread_id`, `time`, `content`) \
			VALUES (" + author_id + ", " + thread_id + ", '" + UTILS.currentTime() + "', '" +
            content + "');");
    };
    self.addThread = function (author_id, category, subject) {
        return self.customQuery("INSERT INTO `threads` \
			(`author_id`, `category`, `subject`, `time`, `last_post_time`, `total_posts`) \
			VALUES (" + author_id + ", " + category + ", '" + subject + "', '" +
            UTILS.currentTime() + "', '" + UTILS.currentTime() + "', 1);");
    };
    return self;
})();
module.exports = DatabaseUtils;
