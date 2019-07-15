import {ObjectId} from 'mongodb';
import {AccountSchema, COLLECTIONS, getCollection} from "../core";
import ERROR_CODES from '../../../common/error_codes';

const PROJECT_DATE = {
	/*$reduce: {
		input: {
			$map: {
				input: {
					$objectToArray: '$_id'
				},
				as: 'value',
				in: {
					$substr: ['$$value.v', 0, 4]
				}
			}
		},
		initialValue: '',
		in: {
			$concat: [
				'$$value',
				{
					$cond: [
						{
							$eq: ['$$value', '']
						},
						'',
						'-'
					]
				},
				'$$this'
			]
		}
	}*/
	$map: {
		input: {
			$objectToArray: '$_id'
		},
		as: 'value',
		in: '$$value.v'
	}
};

function statsMatchConditions(from: number, to: number, account_hex?: string) {
	let cond: any = {
		$and: [{
			_id: {
				$gt: ObjectId.createFromTime(from / 1000)
			}
		}, {
			_id: {
				$lt: ObjectId.createFromTime(to / 1000)
			}
		}]
	};
	
	if(account_hex)
		cond.account_id = ObjectId.createFromHexString(account_hex);
	
	return cond;
}

async function registerUserAgent(agent: string) {
	try {
		let existing = await getCollection(COLLECTIONS.user_agents).findOne({
			agent: agent
		});
		if(existing)
			return existing._id as ObjectId;
		
		let insert_res = await getCollection(COLLECTIONS.user_agents).insertOne({
			agent: agent
		});
		
		if(insert_res.result.ok)
			return insert_res.insertedId;
		
		return null;
	}
	catch(e) {
		console.error(e);
		return null;
	}
}

export default {
	async registerVisit(account: AccountSchema | null, user_agent: string, ip: string) {
		//console.log(account, user_agent, ip);
		try {
			let agent_id = await registerUserAgent(user_agent);
			
			await getCollection(COLLECTIONS.visits).insertOne({
				account_id: account ? ObjectId.createFromHexString(account.id) : null,
				user_agent_id: agent_id,
				ip: ip
			});
		}
		catch(e) {
			console.error(e);
		}
	},
	
	async getUserVisitStatistics(from: number, to: number, account_hex_id: string) {//timestamps range
		try {
			let visits = await getCollection(COLLECTIONS.visits).aggregate([
				{
					$match: statsMatchConditions(from, to, account_hex_id)
				}, {
					$group: {
						_id: {
							year: {$year: '$_id'},
							month: {$month: '$_id'},
							day: {$dayOfMonth: '$_id'},
						},
						count: {$sum: 1}
					}
				}, {
					$project: {
						_id: 0,
						count: 1,
						date: PROJECT_DATE
					}
				}
			]).toArray();
			
			return {error: ERROR_CODES.SUCCESS, data: visits};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getVisitsStatistics(from: number, to: number) {//timestamps range
		try {
			let total_visits = await getCollection(COLLECTIONS.visits).aggregate([
				{
					$match: statsMatchConditions(from, to)
				}, {
					$group: {
						_id: {
							year: {$year: '$_id'},
							month: {$month: '$_id'},
							day: {$dayOfMonth: '$_id'},
							account: '$account_id'
						},
						count: {$sum: 1}
					}
				}, {
					$group: {
						_id: {
							year: '$_id.year',
							month: '$_id.month',
							day: '$_id.day',
						},
						total_visits: { $sum: '$count' },
						unique_visits: {$sum: 1}
					}
				}, {
					$project: {
						_id: 0,
						total_visits: 1,
						unique_visits: 1,
						date: PROJECT_DATE,
					}
				}
			]).toArray();
			
			return {error: ERROR_CODES.SUCCESS, data: total_visits};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	}
}