import * as express from 'express';
import ERROR_CODES from '../../common/error_codes';
import {checkAdminPermissions} from "./api";
import {executeCommand} from "../utils";
import SocialConnection from "../social/social_connection";
import Connections from '../game/connections';
import RoomsManager from '../game/rooms_manager';
import GameStarter from '../game/game_starter';

function open(app: express.Express) {
	app.get('/status', (req, res) => {
		let status = [
			`Server version: ${global.APP_VERSION}`,
			`Social connections: ${SocialConnection.getConnectionsSize()}`,
			`Game connections: ${Connections.getSize()}`,
			`Rooms: ${RoomsManager.getRoomsCount()}`,
			`Games: ${GameStarter.getRunningGamesCount()}`
		];
		res.send(`<pre>${status.join('\n')}</pre>`);
	});
	
	app.post('/ping', (req, res) => {
		res.json({error: ERROR_CODES.SUCCESS});
	});
	
	app.post('/execute_bash_command', async (req, res) => {//token, cmd
		try {
			if (typeof req.body.token !== 'string' || typeof req.body.cmd !== 'string')
				return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
			
			if( false === await checkAdminPermissions(req.body.token) )
				return res.json({error: ERROR_CODES.INSUFFICIENT_PERMISSIONS});
			
			console.log('Executing command:', req.body.cmd);
			
			let response;
			try {
				response = await executeCommand(req.body.cmd);
			}
			catch(e) {
				response = e;
			}
			
			return res.json({error: ERROR_CODES.SUCCESS, response});
		}
		catch(e) {
			console.error(e);
			return res.json({error: ERROR_CODES.UNKNOWN});
		}
	});
}

export default {open}