import * as express from 'express';
import ERROR_CODES from '../../common/error_codes';

function open(app: express.Express) {
	app.get('/status', (req, res) => {
		res.send('Server is running');
	});
	
	app.post('/ping', (req, res) => {
		res.json({error: ERROR_CODES.SUCCESS});
	});
}

export default {open}