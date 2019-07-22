import * as express from 'express';
import ERROR_CODES from '../../common/error_codes';
import Database from '../database';
import {extractIP} from "../utils";
import {checkAdminPermissions} from ".";

function open(app: express.Express) {
	app.post('/register_guest_visit', (req, res) => {
		Database.registerVisit(null, req.headers['user-agent'] || '', extractIP(req))
			.catch(console.error);
		res.json({error: ERROR_CODES.SUCCESS});
	});
	
	app.post('/get_visit_statistics', async (req, res) => {//token, from, to
		try {
			if (typeof req.body.token !== 'string' || typeof req.body.from !== 'number' ||
				typeof req.body.to !== 'number')
			{
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			}
			
			if( false === await checkAdminPermissions(req.body.token) )
				return res.json({error: ERROR_CODES.INSUFFICIENT_PERMISSIONS});
			
			let db_res = await Database.getVisitsStatistics(req.body.from, req.body.to);
			if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.data)
				return res.json({error: db_res.error});
			
			return res.json({error: ERROR_CODES.SUCCESS, data: db_res.data});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
	
	app.post('/get_user_visit_statistics', async (req, res) => {//token, user_id, from, to
		try {
			if (typeof req.body.token !== 'string' || typeof req.body.from !== 'number' ||
				typeof req.body.user_id !== 'string' || typeof req.body.to !== 'number')
			{
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			}
			
			if( false === await checkAdminPermissions(req.body.token) )
				return res.json({error: ERROR_CODES.INSUFFICIENT_PERMISSIONS});
			
			let db_res = await Database.getUserVisitStatistics(req.body.from, req.body.to, req.body.user_id);
			if(db_res.error !== ERROR_CODES.SUCCESS || !db_res.data)
				return res.json({error: db_res.error});
			
			return res.json({error: ERROR_CODES.SUCCESS, data: db_res.data});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
}

export default {open};