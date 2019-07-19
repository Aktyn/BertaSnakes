import * as crypto from 'crypto';
import * as express from 'express';
import * as fs from 'fs';
import {spawn} from 'child_process';
import {AccountSchema} from './database/core';
import {UserCustomData} from '../common/user_info';

const prompt = require('prompt-sync')();

export function getArgument(name: string) {
	for(let arg of process.argv) {
		if(arg.startsWith(name))
			return arg.replace(name, '').substring(1);
	}

	try {//ask user to type password in console
		return prompt(name + ': ') || '';
	}
	catch(e) {
		console.error(`Argument ${name} not found. Closing program.`);
		process.exit();
		return '';
	}
}

export function sha256(input: string) {
	return crypto.createHash('sha256').update( input ).digest('base64');
}

export function md5(input: string) {
	return crypto.createHash('md5').update( input ).digest('base64');
}

/*export function encodeBase64(input: string) {
	return Buffer.from(input).toString('base64');;
}*/

export function AccountSchema2UserCustomData(account: AccountSchema): UserCustomData {
	return {
		nick: account.username,
		...account
	};
}

export function makeSureFolderExists(path: string) {
	try {
		if( !fs.existsSync(path) )
			fs.mkdirSync(path);
	}
	catch(e) {
		console.error(e);
	}
}

export function executeCommand(cmd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		let stdout = '';
		let stderr = '';
		
		let expired = false;
		
		setTimeout(() => {
			expired = true;
			reject('Command timeout');
		}, 1000 * 60 * 5);//timeout after 5 minutes
		
		try {
			let args = cmd.split(' ');
			let main_cmd = args.shift() || 'echo';
			const command = spawn(main_cmd, args, {shell: true});
			command.stdout.on('data', (data: string) => stdout += data);
			command.stderr.on('data', (data: string) => stderr += data);
			command.on('close', (code: number) => {
				if (expired) return;
				if (code === 0)
					resolve(stdout);
				else
					reject(stderr);
			});
			command.on('error', (err: any) => {
				if (!expired)
					reject(err);
			});
		} catch (e) {
			if (!expired)
				reject(e);
		}
	});
}

export function extractIP(req: express.Request) {
	let forwards = req.headers['x-forwarded-for'];
	if (typeof forwards === 'object')//an array
		forwards = forwards[0];// forwards.join(',');
	if (typeof forwards === 'string')
		forwards = forwards.split(',')[0];
	return (forwards || req.connection.remoteAddress || '').replace(/::ffff:/, '');
}