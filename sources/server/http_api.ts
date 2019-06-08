import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';

import ERROR_CODES from '../common/error_codes';
import Config from '../common/config';
import Sessions from './sessions';

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