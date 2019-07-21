import Config, {RANKING_TYPES} from "../../../common/config";
import {extractUserPublicData, PublicAccountSchema, COLLECTIONS, getCollection} from "..";
import {getTotalAccounts} from "../cached";
import ERROR_CODES from "../../../common/error_codes";

export default {
	async getRankingPage(page: number, type: RANKING_TYPES) {
		try {
			let sort_query: {};
			
			switch(type) {
				default:
					return {error: ERROR_CODES.INCORRECT_RANKING_TYPE};
				case RANKING_TYPES.TOP_RANK:
					sort_query = { rank: -1 };
					break;
				case RANKING_TYPES.HIGHEST_LEVEL:
					sort_query = { level: -1, exp: -1 };
					break;
				case RANKING_TYPES.NEW_ACCOUNTS:
					sort_query = { creation_time: -1 };
					break;
			}
			
			let accounts: PublicAccountSchema[] = await getCollection(COLLECTIONS.accounts).aggregate([
				{ $sort: sort_query },
				{ $limit: (page+1)*Config.ITEMS_PER_RANKING_PAGE },
				{ $skip: page*Config.ITEMS_PER_RANKING_PAGE }
			]).toArray();
			
			accounts = accounts.map(acc => extractUserPublicData(acc));
			
			return {error: ERROR_CODES.SUCCESS, total_accounts: getTotalAccounts(), data: accounts};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	}
}