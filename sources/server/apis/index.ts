import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';

import Config from '../../common/config';
import Database from '../database';
import {UPLOADS_FOLDER} from '../upload_receiver';
import ERROR_CODES from '../../common/error_codes';

import CommonApi from './common';
import AccountApi from './account';
import GettersApi from './getters';
import SearchApi from './search';
import TransactionsApi from './transactions';
import StatisticsApi from './statistics';

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

export async function checkAdminPermissions(token: string) {
	let account_res = await Database.getAccountFromToken(token);
	if(account_res.error !== ERROR_CODES.SUCCESS || !account_res.account)
		return false;//res.json({error: account_res.error});
	return account_res.account.admin;
}

const app = express();
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({limit: '10mb'}));

app.use(function(req, res, next) {//ALLOW CROSS-DOMAIN REQUESTS
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods','GET,POST');
    res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept');

    next();
});

CommonApi.open(app);
AccountApi.open(app);
GettersApi.open(app);
SearchApi.open(app);
TransactionsApi.open(app);
StatisticsApi.open(app);

app.listen(Config.SERVER_PORT, () => console.log(`Server listens on: ${Config.SERVER_PORT}!`));

export default {
	shareClientFiles() {
		try {
			const client_dir = path.join(__dirname, '..', '..', '..', 'dist', 'client');
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
			app.use('/uploads', express.static(UPLOADS_FOLDER));
		}
		catch(e) {
			console.error('Cannot share uploaded files through express:', e);
		}
	}
}