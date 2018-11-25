interface GameInfo {
	ID: number;
	DURATION: number;
	GAMEMODE: number;
	MAP: string;
	NAME: string;
	RESULT: string;//another stringify json data
	TIME: string;
}

interface GamesProps {
	games: GameInfo[],
	user_id: number//whose user's history is this
}

class GamesHistory extends React.Component<GamesProps, any> {
	constructor(props: GamesProps) {
		super(props);
	}

	makeRankWidget(rank: number, rank_reward: number) {	
		return <span>
			<span>{Math.round(rank)}</span>
			<span style={{
				'margin': '0px 2px',
				'color': (rank_reward >= 0 ? '#9CCC65' : '#e57373')
			}}>{rank_reward >= 0 ? <span>&#9650;</span> : <span>&#9660;</span>}</span>
			<span>{(rank_reward >= 0 ? '+' : '') + Math.round(rank_reward)}</span>
		</span>;
	}

	render() {
		const gamemode_names = ['Cooperation', 'Competition'];

		return <table style={{display: 'inline-table'}} className='darkEvens'>
			<tr>
				<th>Name</th>
				<th>Map</th>
				<th>Game Mode</th>
				<th>Duration</th>
				<th>Finish time</th>
				<th>Pos.</th>
				<th>Rank</th>
				<th></th>
			</tr>
			{this.props.games.map((game_info: GameInfo) => {

				let duration = game_info.DURATION >= 60 ? (game_info.DURATION/60 + ' min') : 
					game_info.DURATION + ' sec';

				let result = JSON.parse( game_info.RESULT ).players_results;
				for(let pos=0; pos<result.length; pos++) {
					if(result[pos].user_id === this.props.user_id) {
						return <tr>
							<td>{game_info.NAME}</td>
							<td>{game_info.MAP}</td>
							<td>{gamemode_names[game_info.GAMEMODE]}</td>
							<td>{duration}</td>
							<td>{game_info.TIME}</td>
							<td>{pos + 1 + '/' + result.length}</td>
							<td>
								{this.makeRankWidget(result[pos].rank||0, result[pos].rank_reward||0)}
							</td>
							<td style={{padding: '0px 10px'}}>
								<Link type='game_link' 
									vertical={false} 
									href={'/game/'+game_info.ID} />
							</td>
						</tr>;

						//let rank_gain = result[pos].rank|0;
						break;
					}
				}
				return undefined;	
			})}
			{this.props.children}
		</table>;
	}
}