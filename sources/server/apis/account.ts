import * as express from 'express';
import Sessions from '../sessions';
import Email from '../email';
import {md5, sha256} from '../utils';
import Config from '../../common/config';
import Database from '../database';
import UploadReceiver from '../upload_receiver';
import ERROR_CODES from '../../common/error_codes';

function open(app: express.Express) {
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
			if(result.error !== ERROR_CODES.SUCCESS)
				return res.json({error: result.error});
			//console.log(result);
			//console.log( await Email.checkExistence(email) );
	
			//sending email with verification code
			try {
				console.log('Sending verification email to:', email, 'with code:', verification_code);
				await Email.sendVerificationCode(verification_code, email);
				//console.log('email sending result:', info);
	
				return res.json({error: ERROR_CODES.SUCCESS});
			}
			catch(e) {
				console.error(e);
				//removing just inserted account
				if(typeof result.inserted_id === 'string')
					await Database.removeAccount(result.inserted_id);
				return res.json({error: ERROR_CODES.CANNOT_SEND_EMAIL});
			}
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
	
	app.post('/verify', async (req, res) => {//token, code
		try {
			let result = await Database.verifyAccount(req.body.token, req.body.code);
			res.json(result);
		}
		catch(e) {
			console.error(e);
			res.json({error: ERROR_CODES.CANNOT_VERIFY_ACCOUNT});
		}
	});
	
	app.post('/request_verification_code', async (req, res) => {//token
		try {
			let result = await Database.getAccountVerificationCode(req.body.token);
			if(result.error !== ERROR_CODES.SUCCESS)
				return res.json({error: result.error});
			if(typeof result.email !== 'string' || typeof result.code !== 'string')
				return res.json({error: ERROR_CODES.DATABASE_ERROR});
			if(result.code === '')
				return res.json({error: ERROR_CODES.ACCOUNT_ALREADY_VERIFIED});
	
			//sending email with to account email
			await Email.sendVerificationCode(result.code, <string>result.email);
	
			return res.json({error: ERROR_CODES.SUCCESS});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
	
	app.post('/upload_avatar', async (req, res) => {//token, image
		try {
			let session_account_id = await Database.getSession(req.body.token);
			if(!session_account_id)
				return res.json({error: ERROR_CODES.ACCOUNT_NOT_LOGGED_IN});
	
			let account = await Database.getAccount(session_account_id);
			if(!account)
				return res.json({error: ERROR_CODES.ACCOUNT_DOES_NOT_EXISTS});
	
			if(!account.verified)
				return res.json({error: ERROR_CODES.ACCOUNT_NOT_VERIFIED});
	
			let avatar_name = account.id;//encodeBase64(account.username);
			let avatar = null;
			if(req.body.image === null) {
				UploadReceiver.removeAvatar( avatar_name );
			}
			else {
				let result = await UploadReceiver.saveAvatar( avatar_name, req.body.image );
				if(result.error !== ERROR_CODES.SUCCESS)
					return res.json({error: result.error});
				if(typeof result.file_name !== 'string')
					return res.json({error: ERROR_CODES.SERVER_ERROR});
				avatar = result.file_name;
			}
	
			//assign result.file_name value as account avatar in database
			let db_result = await Database.updateAvatar(account.id, avatar);
			if(db_result.error !== ERROR_CODES.SUCCESS)
				return res.json({error: db_result.error});
	
			return res.json({error: ERROR_CODES.SUCCESS, avatar});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
}

export default {open}