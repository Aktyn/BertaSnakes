"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var id = 0;
var Connection = /** @class */ (function () {
    function Connection(socket, req) {
        this._user = null;
        this.id = ++id; //NOTE - connection never has id equal 0
        this.socket = socket;
        this.req = req;
        //this._user = null;//new UserInfo();
        console.log('Connection id:', this.id, ', ip:', this.client_ip);
    }
    Object.defineProperty(Connection.prototype, "client_ip", {
        get: function () {
            return this.req.connection.remoteAddress.replace(/::ffff:/, '');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Connection.prototype, "ip", {
        get: function () {
            return this.client_ip;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Connection.prototype, "user", {
        get: function () {
            return this._user;
        },
        set: function (_user) {
            if ((this._user = _user))
                this._user.connection = this;
        },
        enumerable: true,
        configurable: true
    });
    Connection.prototype.close = function () {
        this.socket.close();
    };
    Connection.prototype.send = function (data) {
        if (this.socket.readyState !== 1) //socket not open
            return;
        this.socket.send(data);
    };
    return Connection;
}());
exports.default = Connection;
