import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';

import Connections from './game/connections';
import RoomsManager from './game/rooms_manager';
import ERROR_CODES from '../common/error_codes';
import Config from '../common/config';
import {AccountSchema2UserCustomData, md5, sha256} from './utils';
import Sessions from './sessions';
import Database, {AccountSchema} from './database';
import Email from './email';
import UploadReceiver from './upload_receiver';
import {SHIP_COSTS, SHIP_LVL_REQUIREMENTS} from "../common/game/objects/player";
import Skills from '../common/game/common/skills';

//CREATING EXAMPLE ACCOUNTS
/*setTimeout(async () => {
	const hashed_password = sha256( 'password' );//example password
	// noinspection SpellCheckingInspection
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	for(let i=0; i<40; i++) {
		let random_nick = new Array(10).fill(0)
			.map(() => chars[(Math.random() * chars.length) | 0]).join('');
		let random_email = random_nick + '@example.com';
		let res = await Database.insertAccount(
			random_nick, hashed_password, random_email, '');
	}
}, 5000);*/

const app = express();
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({limit: '10mb'}));

app.use(function(req, res, next) {//ALLOW CROSS-DOMAIN REQUESTS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

//check whether user is in room and send data update to everyone in this room
function onAccountCustomDataUpdate(account: AccountSchema) {
	let user_info = Connections.findAccount( account.id );
	if(user_info) {
		user_info.updateData(AccountSchema2UserCustomData(account));
		if (user_info.room)//if user is in room
			RoomsManager.onRoomUserCustomDataUpdate(user_info.room, user_info);
	}
}

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

app.post('/get_ranking', async (req, res) => {//page, type
	try {
		if( typeof req.body.page !== "number" || typeof req.body.type !== "number" )
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		let db_res = await Database.getRankingPage(req.body.page, req.body.type);
		if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.data || !db_res.total_accounts)
			return res.json(db_res);
		
		return res.json({error: ERROR_CODES.SUCCESS, data: db_res.data, total_users: db_res.total_accounts});
	}
	catch(e) {
		console.error(e);
		return res.json({error: ERROR_CODES.UNKNOWN});
	}
});

app.post('/account_games', async (req, res) => {//account_id
	try {
		if( !req.body.account_id || typeof req.body.page !== "number" )
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		let db_res = await Database.getAccountGames(req.body.account_id, req.body.page);
		if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.games)
			return res.json(db_res);
		
		return res.json({error: ERROR_CODES.SUCCESS, games: db_res.games});
	}
	catch(e) {
		console.error(e);
		return res.json({error: ERROR_CODES.UNKNOWN});
	}
});

app.post('/game_details', async (req, res) => {//game_id
	try {
		if( !req.body.game_id )
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		let db_res = await Database.getGame(req.body.game_id);
		
		if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.game)
			return res.json(db_res);
		
		return res.json({error: ERROR_CODES.SUCCESS, game: db_res.game});
	}
	catch(e) {
		console.error(e);
		return res.json({error: ERROR_CODES.UNKNOWN});
	}
});

app.post('/get_user_public_data', async (req, res) => {//account_id
	try {
		if( !req.body.account_id )
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		let db_res = await Database.getUserPublicData(req.body.account_id);
		
		if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.data)
			return res.json(db_res);
		
		return res.json({error: ERROR_CODES.SUCCESS, data: db_res.data});
	}
	catch(e) {
		console.error(e);
		return res.json({error: ERROR_CODES.UNKNOWN});
	}
});

app.post('/update_setup', async (req, res) => {//token, ship_type, skills
	try {
		if( typeof req.body.token !== 'string' || typeof req.body.ship_type !== 'number' ||
			typeof req.body.skills !== 'object' )
		{
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		}
		
		//authenticate
		let account_res = await Database.getAccountFromToken(req.body.token);
		let account = account_res.account;
		if( account_res.error !== ERROR_CODES.SUCCESS || !account )
			return res.json({error: account_res.error});
		
		if( account.available_ships.indexOf(req.body.ship_type) !== -1 )//requested ship is available
			account.ship_type = req.body.ship_type;
		
		let are_skills_available = true;
		for(let skill_id of req.body.skills) {
			if(skill_id === null)
				continue;
			
			//incorrect data type //or skill is just not available
			if( typeof skill_id !== 'number' || account.available_skills.indexOf(skill_id) === -1 ) {
				are_skills_available = false;
				break;
			}
		}
		
		if(are_skills_available)
			account.skills = req.body.skills;
		
		let update_res = await Database.updateAccountCustomData(account.id, account);
		if( update_res.error !== ERROR_CODES.SUCCESS )
			return res.json({error: update_res.error});
		
		onAccountCustomDataUpdate( account );
		
		return res.json({error: ERROR_CODES.SUCCESS, account});
	}
	catch(e) {
		console.error(e);
		return res.json({error: ERROR_CODES.UNKNOWN});
	}
});

//TODO: refactor purchase requests code
app.post('/buy_ship', async (req, res) => {//token, ship_type
	try {
		if( typeof req.body.token !== 'string' || typeof req.body.ship_type !== 'number')
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		
		let type: number = req.body.ship_type;
		if(type < 0 || type >= SHIP_COSTS.length)//basically SHIP_COSTS.length gives number of ship types
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		
		//authenticate
		let account_res = await Database.getAccountFromToken(req.body.token);
		let account = account_res.account;
		if( account_res.error !== ERROR_CODES.SUCCESS || !account )
			return res.json({error: account_res.error});
		
		//validate whether user can afford to buy this
		if( account.level < SHIP_LVL_REQUIREMENTS[type] )
			return res.json({error: ERROR_CODES.INSUFFICIENT_LEVEL});
		if( account.coins < SHIP_COSTS[type] )
			return res.json({error: ERROR_CODES.NOT_ENOUGH_COINS});
		if( account.available_ships.indexOf(type) !== -1 )
			return res.json({error: ERROR_CODES.SHIP_ALREADY_BOUGHT});
		
		//make purchase
		account.coins -= SHIP_COSTS[type];
		account.available_ships.push(type);
		account.available_ships = account.available_ships.sort((a,b) => a-b);
		
		//if new ship is best one then select it
		if( Math.max.apply(null, account.available_ships) === type )
			account.ship_type = type;
		
		let update_res = await Database.updateAccountCustomData(account.id, account);
		if( update_res.error !== ERROR_CODES.SUCCESS )
			return res.json({error: update_res.error});
		
		onAccountCustomDataUpdate( account );
		
		return res.json({error: ERROR_CODES.SUCCESS, account});
	}
	catch(e) {
		console.error(e);
		return res.json({error: ERROR_CODES.UNKNOWN});
	}
});

app.post('/buy_skill', async (req, res) => {//token, skill_id
	try {
		if( typeof req.body.token !== 'string' || typeof req.body.skill_id !== 'number')
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		
		let skill = Skills.getById( req.body.skill_id );
		if( !skill || typeof skill.price !== 'number' )//given id is not buy-able skill id
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		
		//authenticate
		let account_res = await Database.getAccountFromToken(req.body.token);
		let account = account_res.account;
		if( account_res.error !== ERROR_CODES.SUCCESS || !account )
			return res.json({error: account_res.error});
		
		//validate whether user can afford to buy this
		if( account.level < skill.lvl_required)
			return res.json({error: ERROR_CODES.INSUFFICIENT_LEVEL});
		if( account.coins < skill.price )
			return res.json({error: ERROR_CODES.NOT_ENOUGH_COINS});
		if( account.available_skills.indexOf(skill.id) !== -1 )
			return res.json({error: ERROR_CODES.SKILL_ALREADY_BOUGHT});
		
		//make purchase
		account.coins -= skill.price;
		account.available_skills.push(skill.id);
		
		//add new skill to skillsbar if there is a free slot
		for(let i=0; i<account.skills.length; i++) {
			if( account.skills[i] === null ) {
				account.skills[i] = skill.id;
				break;
			}
		}
		
		let update_res = await Database.updateAccountCustomData(account.id, account);
		if( update_res.error !== ERROR_CODES.SUCCESS )
			return res.json({error: update_res.error});
		
		onAccountCustomDataUpdate( account );
		
		return res.json({error: ERROR_CODES.SUCCESS, account});
	}
	catch(e) {
		console.error(e);
		return res.json({error: ERROR_CODES.UNKNOWN});
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
			console.log('Client files are now accessible through express server');
		}
		catch(e) {
			console.error('Cannot share client files:', e);
		}
	},

	shareUploads() {
		try {
			app.use('/uploads', express.static(UploadReceiver.UPLOADS_PATH));
		}
		catch(e) {
			console.error('Cannot share uploaded files through express:', e);
		}
	}
}