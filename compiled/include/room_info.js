"use strict";
var RoomInfo = (function () {
    var id = 0;
    var DEFAULT_SITS = 1; //
    var DEFAULT_MAP = 'Open Maze'; //'Empty';
    var DEFAULT_DURATION = 180; //seconds
    var GAME_MODES = {
        COOPERATION: 0,
        COMPETITION: 1
    };
    return /** @class */ (function () {
        function class_1(_id, _name) {
            this._id = _id || ++id;
            this.name = _name || ("#" + this.id);
            this.map = DEFAULT_MAP; //name of chosen map
            this.duration = DEFAULT_DURATION; //game duration in seconds
            // + Array(~~(Math.random()*15)).fill().map(x => 'x').join('');
            this.sits = []; //NOTE - stores only users ids and zeros (in case of empty sit)
            for (var i = 0; i < DEFAULT_SITS; i++)
                this.sits.push(0);
            //stores booleans - true corresponds to ready user (same order as sits)
            this.readys = this.sits.map(function (sit) { return false; });
            this.users = []; //contains UserInfo instances
            this.gamemode = GAME_MODES.COOPERATION; //default
            //use only serverside
            //this.confirmations = null;//if not null => waiting for confirmations before start
            this.onUserConfirm = null; //handle to callback
            this.game_process = null; //if not null => game is running
        }
        class_1.prototype.toJSON = function () {
            return JSON.stringify({
                id: this.id,
                name: this.name,
                map: this.map,
                gamemode: this.gamemode,
                duration: this.duration,
                sits: this.sits,
                readys: this.readys
            });
        };
        class_1.fromJSON = function (json_data) {
            if (typeof json_data === 'string')
                json_data = JSON.parse(json_data);
            var room = new RoomInfo(json_data['id'], json_data['name']);
            if (typeof json_data['sits'] === 'string')
                json_data['sits'] = JSON.parse(json_data['sits']);
            room.sits = json_data['sits'];
            room.readys = json_data['readys'];
            room.map = json_data['map'];
            room.gamemode = json_data['gamemode'];
            room.duration = json_data['duration'];
            return room;
        };
        class_1.prototype.updateData = function (json_data) {
            if (json_data instanceof RoomInfo) { //update from RoomInfo instance
                if (this.id !== json_data.id)
                    throw Error('id mismatch');
                this.name = json_data.name;
                this.sits = json_data.sits;
                this.readys = json_data.readys;
                this.map = json_data.map;
                this.gamemode = json_data.gamemode;
                this.duration = json_data.duration;
            }
            else { //update from JSON
                if (typeof json_data === 'string') //json
                    json_data = JSON.parse(json_data);
                if (this.id !== json_data['id'])
                    throw Error('id mismatch');
                this.name = json_data['name'];
                this.sits = json_data['sits'];
                this.readys = json_data['readys'];
                this.map = json_data['map'];
                this.gamemode = json_data['gamemode'];
                this.duration = json_data['duration'];
            }
        };
        Object.defineProperty(class_1.prototype, "id", {
            get: function () {
                return this._id;
            },
            set: function (val) {
                throw new Error('RoomInfo id cannot be changed');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(class_1.prototype, "taken_sits", {
            get: function () {
                return this.sits.filter(function (sit) { return sit !== 0; }).length;
            },
            enumerable: true,
            configurable: true
        });
        class_1.prototype.getUserByID = function (user_id) {
            for (var _i = 0, _a = this.users; _i < _a.length; _i++) {
                var user = _a[_i];
                if (user.id === user_id)
                    return user;
            }
            return null;
        };
        class_1.prototype.getOwner = function () {
            if (this.users.length > 0)
                return this.users[0];
            return undefined; //empty room has no owner
        };
        /*getSitsWithUserInfo() {//return array of nulls or UserInfo instances
            return this.sits.map(sit => {
                return sit === 0 ? null : this.getUserByID(sit);
            });
        }*/
        class_1.prototype.changeSitsNumber = function (number) {
            while (this.sits.length > number) //removing last sits
                this.sits.pop();
            while (this.sits.length < number)
                this.sits.push(0);
            this.readys = this.sits.map(function (sit) { return false; }); //unready all sitter and keeps array same size
        };
        class_1.prototype.isUserSitting = function (user) {
            if (typeof user === 'undefined')
                throw new Error('User not specified');
            if (user.id !== undefined)
                user = user.id;
            return this.sits.some(function (u) { return (u !== 0) ? (u === Number(user)) : false; });
        };
        class_1.prototype.sitUser = function (user) {
            if (typeof user === 'undefined')
                throw new Error('User not specified');
            if (user.id !== undefined)
                user = user.id;
            if (this.sits.some(function (sit) { return sit === Number(user); }) === true) {
                console.log('User already sitting (' + user + ')');
                return;
            }
            for (var i in this.sits) {
                if (this.sits[i] === 0) { //first empty sit
                    this.sits[i] = Number(user); //sitting user on it
                    break;
                }
            }
        };
        class_1.prototype.standUpUser = function (user) {
            if (typeof user === 'undefined')
                throw new Error('User not specified');
            if (user.id !== undefined)
                user = user.id;
            this.sits = this.sits.map(function (sit) { return (sit === Number(user)) ? 0 : sit; })
                .sort(function (a, b) { return a === 0 ? 1 : -1; });
            this.unreadyAll();
        };
        class_1.prototype.setUserReady = function (user) {
            if (typeof user === 'undefined')
                throw new Error('User not specified');
            if (user.id !== undefined)
                user = user.id;
            if (this.sits.every(function (sit) { return sit !== 0; }) === false) //not every sit taken
                return false;
            for (var i in this.sits) {
                if (this.sits[i] === Number(user) && this.readys[i] === false) {
                    this.readys[i] = true;
                    return true;
                }
            }
            return false;
        };
        class_1.prototype.unreadyAll = function () {
            for (var i in this.readys)
                this.readys[i] = false;
        };
        class_1.prototype.everyoneReady = function () {
            return this.readys.every(function (r) { return r === true; });
        };
        class_1.prototype.addUser = function (user) {
            for (var _i = 0, _a = this.users; _i < _a.length; _i++) {
                var u = _a[_i];
                if (u.id === user.id) { //user already in room - do not duplticate entry
                    user.room = this;
                    return;
                }
            }
            this.users.push(user);
            user.room = this;
        };
        class_1.prototype.removeUser = function (user) {
            if (typeof user === 'number') { //user id
                for (var _i = 0, _a = this.users; _i < _a.length; _i++) {
                    var u = _a[_i];
                    if (u.id === user)
                        return this.removeUser(u);
                }
                return false;
            }
            var i = this.users.indexOf(user);
            if (i > -1) {
                if (this.sits.indexOf(user.id) !== -1) //user is sitting
                    this.standUpUser(user); //releasing this sit
                user.room = null;
                this.users.splice(i, 1);
                return true;
            }
            return false;
        };
        Object.defineProperty(class_1, "GAME_MODES", {
            get: function () {
                return GAME_MODES;
            },
            enumerable: true,
            configurable: true
        });
        return class_1;
    }());
})();
//------------------------------------------------------//
try { //export for NodeJS
    module.exports = RoomInfo;
}
catch (e) { }
