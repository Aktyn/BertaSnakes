"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//const UserInfo = (function() {
var guest_id = -1000; //NOTE that guests ids are negative
var INITIAL_RANK = 1000; //new account's rank
var UserInfo = /** @class */ (function () {
    //@id - database id for registered accounts
    function UserInfo(id, nick, custom_data) {
        this.lobby_subscriber = false;
        this._id = id || 0;
        if (this._id === 0) { //is guest
            this._id = guest_id--;
            this.nick = "Guest#" + Math.abs(this._id);
        }
        else
            this.nick = nick;
        try {
            if (typeof custom_data === 'string')
                custom_data = JSON.parse(custom_data);
            else if (typeof custom_data !== 'object') {
                //console.error('custom_data must be a JSON format');
                custom_data = {};
            }
        }
        catch (e) {
            console.error(e);
            custom_data = {};
        }
        this.custom_data = custom_data;
        this.friends = [];
        //filling data gaps with default values
        this.custom_data['level'] = this.custom_data['level'] || 1; //NOTE - level is never 0
        this.custom_data['rank'] = this.custom_data['rank'] || INITIAL_RANK;
        this.custom_data['exp'] = this.custom_data['exp'] || 0;
        this.custom_data['coins'] = this.custom_data['coins'] || 0;
        this.custom_data['ship_type'] = this.custom_data['ship_type'] || 0;
        this.custom_data['skills'] =
            this.custom_data['skills'] || [null, null, null, null, null, null];
        this.custom_data['avaible_ships'] = this.custom_data['avaible_ships'] || [0];
        this.custom_data['avaible_skills'] = this.custom_data['avaible_skills'] || [];
        //this.level = custom_data['level'] || 1;
        //this.lobby_subscriber = false;
        //use only serverside
        this.connection = null;
        this.room = null;
    }
    //STORES ONLY PUBLIC DATA
    UserInfo.prototype.toJSON = function () {
        return JSON.stringify({
            id: this.id,
            nick: this.nick,
            level: this.level,
            rank: this.rank
        });
    };
    //GETS ONLY PUBLIC DATA
    UserInfo.fromJSON = function (json_data) {
        if (typeof json_data === 'string')
            json_data = JSON.parse(json_data);
        return new UserInfo(json_data['id'], json_data['nick'], {
            level: json_data['level'],
            rank: json_data['rank']
        });
    };
    //PRIVATE AND PUBLIC DATA (for server-side threads comunications)
    UserInfo.prototype.toFullJSON = function () {
        return JSON.stringify({
            id: this.id,
            nick: this.nick,
            custom_data: this.custom_data,
            friends: this.friends,
            lobby_subscriber: this.lobby_subscriber
        });
    };
    //PRIVATE AND PUBLIC ...
    UserInfo.fromFullJSON = function (full_json_data) {
        if (typeof full_json_data === 'string')
            full_json_data = JSON.parse(full_json_data);
        var user = new UserInfo(full_json_data['id'], full_json_data['nick'], full_json_data['custom_data']);
        user.friends = full_json_data['friends'];
        user.lobby_subscriber = full_json_data['lobby_subscriber'];
        return user;
    };
    /*get lobby_subscriber() {
        return this._lobby_subscriber;
    }

    set lobby_subscriber(value) {
        this._lobby_subscriber = value;
    }*/
    UserInfo.prototype.isGuest = function () {
        return this._id < 0;
    };
    Object.defineProperty(UserInfo.prototype, "id", {
        get: function () {
            return this._id;
        },
        set: function (val) {
            throw new Error('User id cannot be changed');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserInfo.prototype, "level", {
        /*get nick() {
            return this._nick;
        }
    
        set nick(_nick) {
            this._nick = _nick || '';
        }*/
        get: function () {
            return this.custom_data['level'] || 1; //this._level;
        },
        set: function (_level) {
            //this.custom_data['level'] = _level;
            throw new Error('Level can be changed only through custom_data');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserInfo.prototype, "rank", {
        get: function () {
            return this.custom_data['rank'] || INITIAL_RANK;
        },
        set: function (value) {
            throw new Error('User\'s rank can be changed only through custom_data');
        },
        enumerable: true,
        configurable: true
    });
    return UserInfo;
}());
exports.default = UserInfo;
;
// })();
//------------------------------------------------------//
/*try {//export for NodeJS
    module.exports = UserInfo;
}
catch(e) {}*/
