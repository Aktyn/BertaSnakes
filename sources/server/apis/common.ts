import * as express from 'express';
import ERROR_CODES from '../../common/error_codes';
import {checkAdminPermissions} from "./api";
import {executeCommand} from "../utils";
import SocialConnection from "../social/social_connection";
import Connections from '../game/connections';
import RoomsManager from '../game/rooms_manager';
import GameStarter from '../game/game_starter';

async function execBashCmd(req: express.Request, res: express.Response) {//token, cmd
	try {//works with both: GET and POST request with query strings or JSON body
		let token = req.query.token || req.body.token;
		let cmd = req.query.cmd || req.body.cmd;
		if (typeof token !== 'string' || typeof cmd !== 'string')
			return res.json({error: ERROR_CODES.INCORRECT_DATA_SENT});
		
		if (false === await checkAdminPermissions(token))
			return res.json({error: ERROR_CODES.INSUFFICIENT_PERMISSIONS});
		
		console.log('Executing command:', cmd);
		
		let response;
		try {
			response = await executeCommand(cmd);
		} catch (e) {
			response = e;
		}
		
		return res.json({error: ERROR_CODES.SUCCESS, response});
	} catch (e) {
		console.error(e);
		return res.json({error: ERROR_CODES.UNKNOWN});
	}
}

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
	
	app.post('/execute_bash_command', execBashCmd);
	app.get('/execute_bash_command', execBashCmd);
}

export default {open}