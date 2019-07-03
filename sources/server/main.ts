declare global {
	namespace NodeJS {
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
let app_version;
try {
	let package_json = fs.readFileSync(__dirname + '/../../package.json', 'utf8');
	app_version = JSON.parse(package_json).version;
}
catch(e) {
	app_version = '1.0.0';
}

global.APP_VERSION = app_version.replace(/\./g, '_') || 'unknown version';

import './database';//initializes database

import HTTP_API from './apis/api';
HTTP_API.shareUploads();
HTTP_API.shareClientFiles();//must be last sharing function

import Config from '../common/config';

import Core from './game/core';
Core.runAt( Config.WEBSOCKET_PORT );

import SocialCore from './social/core';
SocialCore.runAt( Config.SOCIAL_WEBSOCKET_PORT );