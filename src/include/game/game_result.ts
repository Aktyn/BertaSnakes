///<reference path="game_core.ts"/>

interface PlayerResultJSON {
	user_id: number;
	nick: string;
	level: number;
	points: number;
	kills: number;
	deaths: number;
	exp: number;
	coins: number;
	rank: number;
	rank_reward: number;
}

interface GameResultJSON {
	players_results: PlayerResultJSON[]
}

const GameResult = (function() {
	try {
		var _GameCore_: typeof GameCore = require('./game_core');
	}
	catch(e) {
		var _GameCore_ = GameCore;
	}

	const EXP_FACTOR = 0.01;//1 percent per kill point
	const COINS_PER_BEATEN_PLAYER = 50;
	const COINS_FOR_POINTS_BONUS_FACTOR = 4;

	//according to killed enemies minus deaths, player's level and points
	function calculateExpReward(player: any) {
		return Math.max(0,
			player.kills + player.points/_GameCore_.GET_PARAMS().points_for_enemy_kill-player.deaths*5
		) * EXP_FACTOR / Math.sqrt(player.level);
	}

	function calculateCoinsReward(position: number, players_count: number, points: number) {
		if(players_count < 2)
			return 0;

		let beaten_players = players_count - (position+1);
		return Math.round( 
			beaten_players * COINS_PER_BEATEN_PLAYER + 
			points/_GameCore_.GET_PARAMS().points_for_enemy_kill * COINS_FOR_POINTS_BONUS_FACTOR * 
				( (players_count-1) / 8 )
		);
	}

	function probability(r1: number, r2: number): number {
	    return 1.0 * 1.0 / (1 + 1.0 * Math.pow(10, 1.0 * (r1 - r2) / 400));
	}

	const eloK = 10;

	function eloRating(Ra: number, Rb: number, d: boolean) {  
	    //calculate the winning probability of Player A
	    let Pa = probability(Rb, Ra);
	 
	    // Case -1 When Player A wins
	    if (d === true)
	        return eloK * (1 - Pa);
	    else// Case -2 When Player B wins
	        return eloK * (0 - Pa);
	 
	 	throw new Error('Impossible error');
	}

	//@players - array of objects with rank property
	//@target_index - index of target object within players array
	function calculateRankReward(players: any, target_index: number) {
		let total_reward = 0;//stores sum of partial rewards

		let Ra: number = players[target_index].rank;

		for(let i=0; i<players.length; i++) {
			let Rb: number = players[i].rank;

			if(i !== target_index)//TODO - ignore guests
				total_reward += eloRating(Ra, Rb, i > target_index);
		}

		return total_reward;
	}

	/*(function() {//Elo test

		let players = [
			// {rank: 2173},
			// {rank: 2162},
			// {rank: 1996},
			// {rank: 2025},
			// {rank: 2097},
			// {rank: 2140},
			// {rank: 1831},
			// {rank: 1558}
			///////////////
			
			/////////////////
			// {rank: 1200},
			// {rank: 1000}
		];

		for(let i=0; i<players.length; i++)
			console.log( Math.round(calculateRankReward(players, i)) );
	})();*/

	return class GameResult {
		public players_results: PlayerResultJSON[];

		constructor(game?: any) {
			this.players_results = [];

			if(game instanceof _GameCore_) {//this should be invoke only server-side
				game.players.sort((a: any, b: any) => b.points - a.points)
					.forEach((player: any, index: any, arr: any) => 
				{
					//@arr - sorted array of players
					let rank_reward = calculateRankReward(arr, index);

					this.players_results.push({
						user_id: player.user_id,
						nick: player.nick,
						level: player.level,
						points: player.points,
						kills: player.kills,
						deaths: player.deaths,
						exp: calculateExpReward(player),
						//NOTE - array is sorted desc by player points
						coins: calculateCoinsReward(index, game.players.length, player.points),
						rank: player.rank + rank_reward,//TODO
						rank_reward: rank_reward
					});
				});
			}
		}

		toJSON(): GameResultJSON {//returns string
			return {
				players_results: this.players_results
			};
		}

		static fromJSON(json_data: any) {
			if(typeof json_data === 'string')
				json_data = <GameResultJSON>JSON.parse(json_data);

			let result = new GameResult();
			result.players_results = json_data['players_results'];
			return result;
		}
	};
})();

try {//export for NodeJS
	module.exports = GameResult;
}
catch(e) {}