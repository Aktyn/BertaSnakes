import * as express from 'express';
import Connections from '../game/connections';
import RoomsManager from '../game/rooms_manager';
import ERROR_CODES from '../../common/error_codes';
import Config, {CoinPackSchema} from '../../common/config';
import {SHIP_COSTS, SHIP_LVL_REQUIREMENTS} from "../../common/game/objects/player";
import Skills from '../../common/game/common/skills';
import Database, {AccountSchema} from '../database';
import {AccountSchema2UserCustomData, extractIP} from '../utils';
import getCurrenciesData from "../currencies";
import Paypal, {Payment} from '../paypal';

interface PaymentSchema {
	account_id: string;
	pack: CoinPackSchema;
	currency: string;
	payment: Payment;
}

//payment id is a key
let awaiting_payments = new Map<string, PaymentSchema>();
let realized_payments = new Map<string, PaymentSchema>();

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
	
	app.post('/purchase_coins', async (req, res) => {//token, coins, currency
		try {
			if( typeof req.body.token !== 'string' || typeof req.body.coins !== 'number' ||
				typeof req.body.currency !== 'string')
			{
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			}
			
			//authenticate
			let account_res = await Database.getAccountFromToken(req.body.token);
			//let account = account_res.account;
			if( account_res.error !== ERROR_CODES.SUCCESS || !account_res.account )
				return res.json({error: account_res.error});
			
			//find pack of coins
			const packs_array: CoinPackSchema[] = Object.values(Config.COIN_PACKS);
			const pack_index = packs_array.findIndex(pack => pack.coins === req.body.coins);
			let pack: CoinPackSchema | undefined;
			if(pack_index !== -1)
				pack = packs_array[pack_index];
			if( !pack )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			
			const currencies_data = await getCurrenciesData();
			if(currencies_data.error !== ERROR_CODES.SUCCESS)
				return res.json(currencies_data);
			if( !(req.body.currency in currencies_data.rates) )
				return res.json({error: ERROR_CODES.UNKNOWN_CURRENCY});
			
			const origin = req.get('origin');
			if( !origin )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			const price = pack.price * currencies_data.rates[req.body.currency];
			
			const pack_names = new Map([
				[5000,  'Small coin pack'],
				[30000, 'Medium coin pack'],
				[70000, 'Large coin pack']
			]);
			const name = pack_names.get(pack.coins) || 'Coin pack';
			
			console.log(`purchase request: ${JSON.stringify(pack)}, currency: ${req.body.currency}, converted price: ${
				price}, pack name: "${name}", origin: ${origin}`);
			
			try {
				let payment = await Paypal.createPayment(origin, name, `00${pack_index+1}`, price,
					req.body.currency,`${pack.coins} coins`);
				if( !payment.links || !payment.id )
					return res.json({error: ERROR_CODES.PAYPAL_ERROR});
				//console.log(payment);
				for(let link of payment.links) {
					if(link.rel === 'approval_url') {
						awaiting_payments.set(payment.id, {
							account_id: account_res.account.id,
							pack: pack,
							currency: req.body.currency,
							payment: payment
						});
						return res.json({error: ERROR_CODES.SUCCESS, approval_url: link.href});
					}
				}
			}
			catch(e) {
				console.error(e);
				return res.json({error: ERROR_CODES.PAYPAL_ERROR});
			}
			
			return res.json({error: ERROR_CODES.PAYPAL_ERROR});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});

	//token: string, paypal_response: {PayerID: string, paymentId: string, token: string}
	app.post('/execute_purchase', async (req, res) => {
		try {
			if( typeof req.body.token !== 'string' || typeof req.body.paypal_response !== 'object' )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			
			const paypal_response = req.body.paypal_response;
			if( typeof paypal_response.paymentId !== 'string' || typeof paypal_response.PayerID !== 'string' ||
				typeof paypal_response.token !== 'string' )
			{
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			}
			
			//authenticate
			let account_res = await Database.getAccountFromToken(req.body.token);
			let account = account_res.account;
			if( account_res.error !== ERROR_CODES.SUCCESS || !account )
				return res.json({error: account_res.error});
			
			let payment_data = awaiting_payments.get( paypal_response.paymentId );
			if( !payment_data ) {
				let realized = realized_payments.get( paypal_response.paymentId );
				if(realized) {//user refreshed page
					return res.json({
						error: ERROR_CODES.SUCCESS,
						account, pack: realized.pack,
						realized_before: true
					});
				}
				else
					return res.json({error: ERROR_CODES.PAYMENT_DATA_NOT_FOUND});
			}
			if( payment_data.account_id !== account.id )//only user who created payment can execute it
				return res.json({error: ERROR_CODES.ACCOUNT_ID_MISMATCH});
			
			let saved_coins = account.coins;
			
			//console.log( payment_data );
			try {//add coins to user's account, NOTE: this is done before payment execution
				account.coins += payment_data.pack.coins;
				let update_res = await Database.updateAccountCustomData(account.id, account);
				if (update_res.error !== ERROR_CODES.SUCCESS)
					return res.json({error: update_res.error});
				
				onAccountCustomDataUpdate(account);
			}
			catch(e) {
				return res.json({error: ERROR_CODES.DATABASE_ERROR});
			}
			
			try {
				let payment_res = await Paypal.executePayment(paypal_response.paymentId, paypal_response.PayerID);
				if( payment_res.state !== 'approved' )
					console.warn('Payment execution has not been approved!!!', payment_res);
			}
			catch(e) {
				console.error('Payment error: ' + e);
				try {//restoring coins state because payment was not successful
					account.coins = saved_coins;
					await Database.updateAccountCustomData(account.id, account);
					onAccountCustomDataUpdate(account);
				}
				catch(e) {
				
				}
				return res.json({error: ERROR_CODES.PAYPAL_ERROR});
			}
			
			realized_payments.set(paypal_response.paymentId, payment_data);
			awaiting_payments.delete( paypal_response.paymentId );
			
			console.log('Payment executed', payment_data.account_id, payment_data.pack);
			
			//saving payment data in database (asynchronously)
			Database.registerPayment(account.id, payment_data.pack, payment_data.currency,
				req.headers['user-agent'] || '', extractIP(req)).catch(console.error);
			
			return res.json({
				error: ERROR_CODES.SUCCESS,
				account, pack: payment_data.pack,
				realized_before: false
			});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
}

export default {open}