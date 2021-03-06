declare global {
	namespace NodeJS {
		// noinspection JSUnusedGlobalSymbols
		export interface Global {
			_CLIENT_: boolean;
			_SERVER_: boolean;
			APP_VERSION: string;
		}
	}
}
global._CLIENT_ = false;
global._SERVER_ = true;

import * as fs from 'fs';
let app_version: string;
try {
	let package_json = fs.readFileSync(__dirname + '/../../package.json', 'utf8');
	app_version = JSON.parse(package_json).version;
}
catch(e) {
	app_version = '1.0.0';
}

global.APP_VERSION = app_version || 'unknown version';

console.log('Running BertaSnakes server\n\tNODE_ENV:', process.env.NODE_ENV, '\n\tversion:', global.APP_VERSION);

import './database';//initializes database

import HTTP_API from './apis';
HTTP_API.shareUploads();
HTTP_API.shareClientFiles();//must be last sharing function

import Config from '../common/config';

import Core from './game/core';
Core.runAt( Config.WEBSOCKET_PORT );

import SocialCore from './social/core';
SocialCore.runAt( Config.SOCIAL_WEBSOCKET_PORT );

import AutoBackups from './auto_backups';
AutoBackups.doRegularly(Config.BACKUPS_INTERVAL);