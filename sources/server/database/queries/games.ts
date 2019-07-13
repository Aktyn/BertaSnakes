import {ObjectId} from 'mongodb';
import Config from '../../../common/config';

import RoomInfo from "../../../common/room_info";
import {GameSchema, COLLECTIONS, getCollection} from "../core";
import {PlayerResultJSON} from "../../../common/game/game_result";
import ERROR_CODES from "../../../common/error_codes";

export default {
	async saveGameResult(room: RoomInfo, players_results: PlayerResultJSON[]) {
		try {
			let insert_res = await getCollection(COLLECTIONS.games).insertOne({
				finish_timestamp: Date.now(),
				name: room.name,
				map: room.map,
				gamemode: room.gamemode,
				duration: room.duration,
				results: players_results.map(result => {
					delete result.avatar;//it is redundant and user may change avatar after game
					delete result.user_id;//irrelevant for database
					return result;
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
					$sort: {finish_timestamp: -1}
				}, {
					$project: {
						_id: 1,
						finish_timestamp: 1,
						name: 1,
						map: 1,
						gamemode: 1,
						duration: 1,
						results: 1
					}
				}, {
                    $limit: (page+1)*Config.ITEMS_PER_GAMES_LIST_PAGE
                }, {
                    $skip: page*Config.ITEMS_PER_GAMES_LIST_PAGE
                }
			]).toArray();
			
			games.forEach(g => g._id = (g._id as unknown as ObjectId).toHexString());
			
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
}