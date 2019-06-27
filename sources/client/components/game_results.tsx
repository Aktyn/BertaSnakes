import * as React from 'react';

import RoomInfo from '../../common/room_info';
import ServerApi from '../utils/server_api';
import Utils from '../utils/utils';
import {PlayerResultJSON} from '../../common/game/game_result';

import '../styles/game_results.scss';

const ship_icons = [
	require('../img/textures/players/type_1.png'),
	require('../img/textures/players/type_2.png'),
	require('../img/textures/players/type_3.png'),
];

const kills_icon = require('../img/icons/scope_icon.png');
const deaths_icon = require('../img/icons/skull_icon.png');

interface GameResultsProps {
	onClose: () => void;
	room: RoomInfo;
	data: PlayerResultJSON[];
}

let RewardIndicator = ({reward}: {reward: number}) => {
	return <span>{reward >= 0 ?
		<span style={{color: '#8BC34A'}}>&#9650;</span> :
		<span style={{color: '#e57373'}}>&#9660;</span>}
		{Math.round(reward)}
	</span>;
};

export default class GameResults extends React.Component<GameResultsProps, any> {
	
	constructor(props: GameResultsProps) {
		super(props);
	}
	
	private renderList() {
		return this.props.data.map((row, index) => {
			return <tr key={row.user_id}>
				<td>{index+1}</td>
				<td><img src={ServerApi.getAvatarPath(row.avatar)} alt='user avatar' /></td>
				<td style={{textAlign: 'left'}}>
					{Utils.trimString(row.nick, 15)}
				</td>
				<td><img src={ship_icons[row.ship_type]} style={{opacity: 0.5}} alt='ship icon' /></td>
				<td>{row.level}</td>
				<td>{row.kills}</td>
				<td>{row.deaths}</td>
				<td>{row.points}</td>
				<td>+{row.coins}</td>
				<td>+{Math.round(row.exp*100)}%</td>
				<td>{Math.round(row.rank)}<RewardIndicator reward={row.rank_reward} /></td>
			</tr>;
		});
	}
	
	render() {
		return <div className='game-results-container'>
			<div className={'results-body'}>
				<h1>Results for: {Utils.trimString(this.props.room.name, 20)}</h1>
				<table className='results-tab'>
					<thead><tr>
						<th/>
						<th/>
						<th>Player</th>
						<th>Ship</th>
						<th>Lvl</th>
						<th><img src={kills_icon} alt='kills' /></th>
						<th><img src={deaths_icon} alt='deaths' /></th>
						<th>Points</th>
						<th>Coins</th>
						<th>Exp</th>
						<th>Rank</th>
					</tr></thead>
					<tbody>{this.renderList()}</tbody>
				</table>
				<nav>
					<button style={{margin: '10px 0px'}} onClick={this.props.onClose}>CLOSE RESULTS</button>
				</nav>
			</div>
		</div>;
	}
}