import {ObjectId} from 'mongodb';
import Config from '../../../common/config';

import RoomInfo from "../../../common/room_info";
import {GameSchema, COLLECTIONS, getCollection} from "..";
import {PlayerResultJSON} from "../../../common/game/game_result";
import ERROR_CODES from "../../../common/error_codes";
import {escapeRegExp} from "../../utils";

function fixGameSchemas(games: GameSchema[]) {
	games.forEach(g => {
		g.finish_timestamp = (g._id as unknown as ObjectId).getTimestamp().getTime();//NOTE - order is important
		g._id = (g._id as unknown as ObjectId).toHexString();
	});
}

export default {
	async saveGameResult(room: RoomInfo, players_results: PlayerResultJSON[]) {
		try {
			let insert_res = await getCollection(COLLECTIONS.games).insertOne({
				//finish_timestamp: Date.now(),
				name: room.name,
				map: room.map,
				gamemode: room.gamemode,
				duration: room.duration,
				max_enemies: room.max_enemies,
				results: players_results.map(result => {
					let result_copy = {
						...result
					};
					delete result_copy.avatar;//it is redundant and user may change avatar after game
					delete result_copy.user_id;//irrelevant for database
					
					return result_copy;
				})
			});
			if( !insert_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	async getAccountGames(account_hex_id: string, page: number) {
		try {
			let games: GameSchema[] = await getCollection(COLLECTIONS.games).aggregate([
				{
					$match: {
						results: {
							$elemMatch: {
								account_id: account_hex_id
							}
						}
					}
				}, {
					$sort: {_id: -1}
				}/*, {
					$project: {
						_id: 1,
						name: 1,
						map: 1,
						gamemode: 1,
						duration: 1,
						max_enemies: 1,
						results: 1
					}
				}*/, {
                    $limit: (page+1)*Config.ITEMS_PER_GAMES_LIST_PAGE
                }, {
                    $skip: page*Config.ITEMS_PER_GAMES_LIST_PAGE
                }
			]).toArray();
			
			fixGameSchemas(games);
			
			return {error: ERROR_CODES.SUCCESS, games};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getGame(game_id: string) {
		try {
			let game = await getCollection(COLLECTIONS.games).findOne({
				_id: ObjectId.createFromHexString(game_id)
			});
			
			if (!game)
				return {error: ERROR_CODES.GAME_DOES_NOT_EXIST};
			return {
				error: ERROR_CODES.SUCCESS,
				game: game as GameSchema
			};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async searchGame(_name: string) {
		try {
			let games: GameSchema[] = await getCollection(COLLECTIONS.games).aggregate([
				{
					$match: {
						name: new RegExp(`.*${escapeRegExp(_name)}.*`, 'i')//*name*
					}
				}, {
					$limit: 64
				}
			]).toArray();
			
			fixGameSchemas(games);
			
			return {
				error: ERROR_CODES.SUCCESS,
				games: games
			};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
}