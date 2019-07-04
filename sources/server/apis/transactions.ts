import * as express from 'express';
import Connections from '../game/connections';
import RoomsManager from '../game/rooms_manager';
import ERROR_CODES from '../../common/error_codes';
import {SHIP_COSTS, SHIP_LVL_REQUIREMENTS} from "../../common/game/objects/player";
import Skills from '../../common/game/common/skills';
import Database, {AccountSchema} from '../database/database';
import {AccountSchema2UserCustomData} from '../utils';

//check whether user is in room and send data update to everyone in this room
function onAccountCustomDataUpdate(account: AccountSchema) {
	let user_info = Connections.findAccount( account.id );
	if(user_info) {
		user_info.updateData(AccountSchema2UserCustomData(account));
		if (user_info.room)//if user is in room
			RoomsManager.onRoomUserCustomDataUpdate(user_info.room, user_info);
	}
}

function open(app: express.Express) {
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

}

export default {open}