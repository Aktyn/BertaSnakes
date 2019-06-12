var prompt = require('prompt-sync')();
import * as crypto from 'crypto';

export function getArgument(name: string) {
	for(var arg of process.argv) {
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

export function encodeBase64(input: string) {
	return Buffer.from(input).toString('base64');;
}