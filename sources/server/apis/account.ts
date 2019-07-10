import * as express from 'express';
import Sessions from '../sessions';
import Email from '../email';
import {md5, sha256} from '../utils';
import Config from '../../common/config';
import Database from '../database/database';
import UploadReceiver from '../upload_receiver';
import ERROR_CODES from '../../common/error_codes';

//<code, account_id>
let reset_codes: Map<string, string> = new Map();

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
			if(nick < Config.MIN_LOGIN_LENGTH || req.body.password < Config.MIN_PASSWORD_LENGTH)
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
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
			if( typeof req.body.token !== "string" )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
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
	
	app.post('/request_password_reset_code',async (req, res) => {//email
		try {
			if( typeof req.body.email !== "string" )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			let db_res = await Database.getAccountFromEmail(req.body.email);
			if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.account)
				return res.json({error: db_res.error});
			
			let awaiting_code: string | undefined = undefined;
			reset_codes.forEach((value, key) => {
				if(db_res.account && value === db_res.account.id)//found not used reset code for this account
					awaiting_code = key;
			});
	
			if(awaiting_code) {//previous code was not used yet
				//resend this code
				await Email.sendPasswordResetCode(awaiting_code, req.body.email);
				return res.json({error: ERROR_CODES.SUCCESS});
			}
			
			//generate reset code
			let password_reset_code = md5( Date.now().toString() + db_res.account.username + req.body.email );
			reset_codes.set(password_reset_code, db_res.account.id);
			//console.log(password_reset_code);
			
			//send code via email
			await Email.sendPasswordResetCode(password_reset_code, req.body.email);
	
			return res.json({error: ERROR_CODES.SUCCESS});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
	
	app.post('/reset_password', async (req, res) => {//new_password, reset_code
		try {
			if( typeof req.body.new_password !== "string" || typeof req.body.reset_code !== "string" )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			
			if(req.body.new_password < Config.MIN_PASSWORD_LENGTH)
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			const hashed_password = sha256( req.body.new_password.substr(0, Config.MAX_PASSWORD_LENGTH) );
			
			let account_id_to_password_reset = reset_codes.get(req.body.reset_code);
			if( !account_id_to_password_reset )
				return res.json({error: ERROR_CODES.INCORRECT_RESET_CODE});
			
			reset_codes.delete(req.body.reset_code);
			
			let db_res = await Database.updateAccountPassword(account_id_to_password_reset, hashed_password);
			if(db_res.error !== ERROR_CODES.SUCCESS)
				return res.json({error: db_res.error});
	
			return res.json({error: ERROR_CODES.SUCCESS});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
	
	app.post('/upload_avatar', async (req, res) => {//token, image
		try {
			if( typeof req.body.token !== "string" )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			let session_account_id = await Database.getSession(req.body.token);
			if(!session_account_id)
				return res.json({error: ERROR_CODES.ACCOUNT_NOT_LOGGED_IN});
	
			let account = await Database.getAccount(session_account_id);
			if(!account)
				return res.json({error: ERROR_CODES.ACCOUNT_DOES_NOT_EXIST});
	
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