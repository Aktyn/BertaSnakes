global._CLIENT_ = false;

var pjson = require('./../../package.json');
global.APP_VERSION = pjson.version.replace(/\./g, '_') || 'beta';
global.DATE_VERSION = (() => {
	let date = new Date();
	let m = date.getUTCMonth() + 1;
	let d = date.getDate();
	return date.getFullYear() + '_' + (m < 10 ? '0' + m : m) + '_' + (d < 10 ? '0' + d : d);
})();

//const CHARS = 'abcdefghijklmnopqrstuvwxyz1234567890';

// global.SESSION = Array.from({length: 16}, () => CHARS[~~(Math.random()*CHARS.length)])
// 	.join('').concat('v_'+APP_VERSION.replace('.', '_')).toUpperCase();

// console.log('SESSION CODE:', SESSION);

const PORT = process.argv.slice(2)[0] || 2674;

const Connection = require('./connection.js');
const Core = require('./core.js');
const Compiler = require('./compiler.js');
const path = require('path');

const dir = path.join(__dirname, '..', '..');

const game_code_file = dir + '/compiled/' + /*DATE_VERSION*/APP_VERSION + '.js';
const compilation_options = {closure: false, target_file: game_code_file, remove_logs: false};

Compiler.compileGameSources(compilation_options).then(() => {
	// return Compiler.compilePageSources();
}).then(() => {
	// console.log('Page code compiled');
	require('./http/http_server.js').init();//running http server
}).catch(e => {
	console.error("Compilation error:", e);
	require('./http/http_server.js').init();
});

Compiler.recompileOnGameSourceFileChange(compilation_options);//ONLY DEVELOPEMENT MODE

//running websocket server
console.log('Running WebSocketServer at port:', PORT);
const WebSocketServer = require('ws').Server;
const websock = new WebSocketServer({ port: PORT });

websock.on('connection', function(ws, req) {
	ws.isAlive = true;
	ws.on('pong', () => {
		ws.isAlive = true;//heartbeat
	});

	//new client connection
	let connection = new Connection(ws, req);

	Core.addConnection(connection);

	ws.on('message', function(message) {
		Core.onMessage(connection, message);
	});

	ws.on('close', conn => {// close user connection
		console.log('connection close:', connection.id);
		Core.removeConnection(connection);
	});
});

//detecting dead connections
const interval = setInterval(function ping() {
	websock.clients.forEach(ws => {
		if(ws.isAlive === false) {//connection doesn't send pong in time
			console.log('removing dead connection');
			return ws.terminate();
		}

		ws.isAlive = false;
		ws.ping(() => {});
	});
}, 30 * 1000);//check every 30 seconds