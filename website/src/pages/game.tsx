///<reference path="../link.tsx"/>

interface GameState {
	loaded: boolean;
	raw_result?: string;
}

class Game extends React.Component<any, GameState> {
	private static extractGameID = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/game\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 0;
		}
	}

	state = {
		loaded: false,
		raw_result: undefined,
	}

	constructor(props: GameState) {
		super(props);

		this.loadGameInfo();
	}

	loadGameInfo() {
		$$.postRequest('/game_info', {id: Game.extractGameID()}, raw_res => {
			this.setState({
				loaded: true,
				raw_result: raw_res
			});
		});
	}

	renderRankWidget(rank: number, rank_reward: number) {
		var stylee = {
			margin: '0px 2px',
			color: (rank_reward >= 0 ? '#9CCC65' : '#e57373')
		};

		return <span>
			<span>{Math.round(rank)}</span>
			{rank_reward >= 0 
				? <span style={stylee}>&#9650;</span> 
				: <span style={stylee}>&#9660;</span>}
			<span>{(rank_reward >= 0 ? '+' : '') + Math.round(rank_reward)}</span>
		</span>;
	}

	renderError(error: string) {
		return <div className='container'>
			<h1 style={{margin: '0px'}}>GAME DETAILS</h1>
			<div className='error_msg' id='game_info_error'>{error}</div>
		</div>;
	}

	renderResult() {
		if(this.state.raw_result === undefined) {
			this.renderError('Incorrect server response');
			return;
		}

		var res = JSON.parse(this.state.raw_result || '{}');

		console.log(res);
		
		if(res.result !== "SUCCESS")
			return this.renderError('Game not found');

		interface PlayerResult {
			nick: string;
			level: number;
			points: number;
			kills: number;
			deaths: number;
			rank: number;
			rank_reward: number;
			user_id: number;
		}

		var result_rows: JSX.Element[] = [];

		try {
			let results: {players_results: PlayerResult[]} = JSON.parse( res.RESULT );
			//for each player's result
			result_rows = results.players_results.map((p_r, index: number) => {
				return <tr>
					<td>{index+1}</td>
					<td>{p_r.nick}</td>
					<td>{p_r.level}</td>
					<td>{p_r.points}</td>
					<td>{p_r.kills}</td>
					<td>{p_r.deaths}</td>
					<td>{p_r.rank 
						? this.renderRankWidget(p_r.rank, p_r.rank_reward) 
						: <span>NO RANK DATA</span>}</td>
					<td>
						{p_r.user_id > 0 
							? <Link type='user_link' href={'/user/' + p_r.user_id} /> 
							: <span></span>}
					</td>
				</tr>;
			});
		}
		catch(e) {
			console.error(e);
		}
		
		const gamemode_names = ['Cooperation', 'Competition'];

		return <div className='container' style={{padding: '0px'}}>
			<h1 style={{margin: '0px'}}>GAME DETAILS</h1>

			<div id='game_details'>
				<div style={{margin: '0px'}}>
					<table style={{width: '100%'}}>
						<tr>
							<th>Name</th><th>Map</th><th>Game Mode</th><th>Duration</th><th>Time</th>
						</tr>
						<tr>
							<td>{res.NAME}</td>
							<td>{res.MAP}</td>
							<td>{gamemode_names[res.GAMEMODE]}</td>
							<td>{res.DURATION}</td>
							<td>{res.TIME}</td>
						</tr>
					</table>
					<table style={{width: '100%'}} className='dark_evens'>
						<tr><th colSpan={8}>Result</th></tr>
						<tr>
							<th></th>
							<th>Nick</th>
							<th>Level</th>
							<th>Points</th>
							<th>Kills</th>
							<th>Deaths</th>
							<th>Rank</th>
							<th></th>
						</tr>
						{result_rows}
					</table>
				</div>
			</div>
		</div>;
	}

	render() {
		return <div>
			{this.state.loaded === false ? <Loader /> : this.renderResult()}
		</div>;
		
	}
}