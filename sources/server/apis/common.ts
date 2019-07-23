import * as express from 'express';
import ERROR_CODES from '../../common/error_codes';
import {checkAdminPermissions} from ".";
import {executeCommand} from "../utils";
import Cache from '../cache';
import SocialConnection from "../social/social_connection";
import Connections from '../game/connections';
import RoomsManager from '../game/rooms_manager';
import GameStarter from '../game/game_starter';
import {getMemUsages} from "../game/game_handler";

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
			response = await executeCommand(cmd, 1000*60);
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
	app.get('/status', async (req, res) => {
		let cached_status = Cache.getCache( 'status_cache' );
		if(cached_status) {
			res.send(cached_status.data);
			return;
		}
		
		let usages = (await getMemUsages()).map((usage_info, i) => {
			// noinspection SpellCheckingInspection
			return `${i + 1}. games: ${usage_info.games}\tmemory: ${Math.round(usage_info.memory / 1024)}MB`;
		}).join('\n');
		
		let status = `<pre>${
			[
				`Server version: ${global.APP_VERSION}`,
				`Social connections: ${SocialConnection.getConnectionsMap().size}`,
				`Game connections: ${Connections.getSize()}`,
				`Rooms: ${RoomsManager.getRooms().size}`,
				`Games: ${GameStarter.getRunningGamesCount()}`,
				`\n--- Processes ---\n${usages}`
			].join('\n')
		}</pre>`;
		res.send(status);
		
		//just 10 seconds to prevent request spam
		Cache.createCache( 'status_cache', 1000*10, status );
	});
	
	app.post('/ping', (req, res) => {
		res.json({error: ERROR_CODES.SUCCESS});
	});
	
	app.post('/execute_bash_command', execBashCmd);
	app.get('/execute_bash_command', execBashCmd);
}

export default {open}