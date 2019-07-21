import * as express from 'express';
import ERROR_CODES from '../../common/error_codes';
import Database from '../database';
import Cache from '../cache';

const ranking_cache_name = (page: number, type: number) => `ranking_page_${page}_${type}`;

function open(app: express.Express) {
	app.post('/get_ranking', async (req, res) => {//page, type
		try {
			if( typeof req.body.page !== "number" || typeof req.body.type !== "number" )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			
			if( req.body.page === 0 ) {//check for first ranking page in cache
				let cached_page = Cache.getCache( ranking_cache_name(req.body.page, req.body.type) );
				if(cached_page)
					return res.json(cached_page.data);
			}
			
			let db_res = await Database.getRankingPage(req.body.page, req.body.type);
			if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.data || !db_res.total_accounts)
				return res.json(db_res);
			
			let cached_response = {error: ERROR_CODES.SUCCESS, data: db_res.data, total_users: db_res.total_accounts};
			if( req.body.page === 0 )
				Cache.createCache( ranking_cache_name(req.body.page, req.body.type), 1000*60*5, cached_response );
			return res.json(cached_response);
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
	
	/*app.post('/get_friends_list', async (req, res) => {//token
		try {
			if( !req.body.token )
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			
			let account_res = await Database.getAccountFromToken(req.body.token);
			let account = account_res.account;
			if( account_res.error !== ERROR_CODES.SUCCESS || !account )
				return res.json({error: account_res.error});
			
			let db_res = await Database.getAccountFriends( account.id );
			
			if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.friends)
				return res.json(db_res);
			
			return res.json({error: ERROR_CODES.SUCCESS, friends: db_res.friends});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});*/
}

export default {open}