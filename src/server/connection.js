const Connection = (function() {
	const UserInfo = require('./../include/user_info.js');

	var id = 0;

	return class {
		constructor(socket, req) {
			this.id = ++id;//NOTE - connection never has id equal 0
			this.socket = socket;
			this.req = req;

			this._user = null;//new UserInfo();

			console.log('Connection id:', this.id, ', ip:', this.client_ip);
		}

		get client_ip() {
			return this.req.connection.remoteAddress.replace(/::ffff:/, '');
		}
		get ip() {
			return this.client_ip;
		}

		get user() {
			return this._user;
		}

		set user(_user) {
			this._user = _user;
			this._user.connection = this;
		}

		close() {
			this.socket.close();
		}

		send(data) {
			if(this.socket.readyState !== 1)//socket not open
				return;
			this.socket.send(data);
		}
	};
})();

module.exports = Connection;