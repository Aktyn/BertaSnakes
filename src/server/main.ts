declare global {
	namespace NodeJS {
		export interface Global {
			_CLIENT_: boolean;
			// DATE_VERSION: string; //deprecated idea
			APP_VERSION: string;
		}
	}
}
global._CLIENT_ = false;

import * as fs from 'fs';
var app_version;
try {
	var pckg_json = fs.readFileSync(__dirname + '/../../package.json', 'utf8');
	app_version = JSON.parse(pckg_json).version;
}
catch(e) {
	app_version = '1.0.0';
}

global.APP_VERSION = app_version.replace(/\./g, '_') || 'beta';
/*global.DATE_VERSION = (() => {
	let date = new Date();
	let m = date.getUTCMonth() + 1;
	let d = date.getDate();
	return date.getFullYear() + '_' + (m < 10 ? '0' + m : m) + '_' + (d < 10 ? '0' + d : d);
})();*/

const PORT = 2674;

import Connection from './connection';
import Core from './core';

// require('./http/http_server.js').init();
import HttpServer from './http/http_server';
HttpServer.init();

//running websocket server
console.log('Running WebSocketServer at port:', PORT);
// const WebSocketServer = require('ws').Server;
import {Server} from 'ws';
const websock = new Server({ port: PORT });

websock.on('connection', function(ws, req) {
	(<any>ws).isAlive = true;
	ws.on('pong', () => {
		(<any>ws).isAlive = true;//heartbeat
	});

	//new client connection
	let connection = new Connection(ws, req);

	Core.addConnection(connection);

	ws.on('message', function(message) {
		Core.onMessage(connection, message);
	});

	ws.on('close', () => {// close user connection
		console.log('connection close:', connection.id);
		Core.removeConnection(connection);
	});
});

//detecting dead connections
setInterval(function ping() {
	websock.clients.forEach((ws) => {
		if((<any>ws).isAlive === false) {//connection doesn't send pong in time
			console.log('removing dead connection');
			return ws.terminate();
		}

		(<any>ws).isAlive = false;
		ws.ping(() => {});
	});
}, 30 * 1000);//check every 30 seconds