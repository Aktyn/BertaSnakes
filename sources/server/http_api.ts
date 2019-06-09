import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';

import ERROR_CODES from '../common/error_codes';
import Config from '../common/config';
import {sha256, md5} from './utils';
import Sessions from './sessions';
import Database from './database';
import Email from './email';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {//ALLOW CROSS-DOMAIN REQUESTS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

app.get('/status', (req, res) => {
	res.send('Server is running');
});

app.post('/ping', (req, res) => {
	res.json({error: ERROR_CODES.SUCCESS});
});

app.post('/login', async (req, res) => {
	try {
		let result = await Sessions.login(req.body.nick, req.body.password);
		res.json(result);
	}
	catch(e) {
		console.error(e);
		res.json({error: ERROR_CODES.UNKNOWN});
	}
});

app.post('/token_login', async (req, res) => {
	try {
		let result = await Sessions.token_login(req.body.token);
		res.json(result);
	}
	catch(e) {
		console.error(e);
		res.json({error: ERROR_CODES.UNKNOWN});
	}
});

app.post('/register', async (req, res) => {//nick, password, email
	try {
		const nick = req.body.nick.substr(0, Config.MAX_LOGIN_LENGTH);
		const hashed_password = sha256( req.body.password.substr(0, Config.MAX_PASSWORD_LENGTH) );
		const email = req.body.email;

		const verification_code = md5( Date.now().toString() + nick + email );

		let result = await Database.insertAccount(nick, hashed_password, email, verification_code);
		if(result.error !== ERROR_CODES.SUCCESS) {
			res.json({error: result.error});
			return;
		}
		//console.log(result);
		//console.log( await Email.checkExistence(email) );

		//sending email with verification code
		try {
			console.log('Sending verification email to:', email, 'with code:', verification_code);
			await Email.sendVerificationCode(verification_code, email);
			//console.log('email sending result:', info);

			res.json({error: ERROR_CODES.SUCCESS});
		}
		catch(e) {
			console.error(e);
			//removing just inserted account
			if(typeof result.inserted_id === 'string')
				await Database.removeAccount(result.inserted_id);
			res.json({error: ERROR_CODES.CANNOT_SEND_EMAIL});
		}
	}
	catch(e) {
		console.error(e);
		res.json({error: ERROR_CODES.UNKNOWN});
	}
});

app.listen(Config.SERVER_PORT, () => console.log(`Server listens on: ${Config.SERVER_PORT}!`));

export default {
	shareClientFiles() {
		try {
			const client_dir = path.join(__dirname, '..', '..', 'dist', 'client');
			app.use(express.static(client_dir));

			const index_html = fs.readFileSync(client_dir + '/index.html', 'utf8');
			app.get('*', (req, res) => res.send(index_html));
			console.log('Client files are now accesible through express server');
		}
		catch(e) {
			console.error('Cannot share client files:', e);
		}
	}
}