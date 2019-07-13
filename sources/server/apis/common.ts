import * as express from 'express';
import ERROR_CODES from '../../common/error_codes';
import Database from '../database/core';
import {extractIP} from "../utils";

function open(app: express.Express) {
	app.get('/status', (req, res) => {
		res.send('Server is running');
	});
	
	app.post('/ping', (req, res) => {
		res.json({error: ERROR_CODES.SUCCESS});
	});
	
	app.post('/register_guest_visit', (req, res) => {
		Database.registerVisit(null, req.headers['user-agent'] || '', extractIP(req));
		res.json({error: ERROR_CODES.SUCCESS});
	});
}

export default {open}