import * as React from 'react';

import Utils from '../utils/utils';
import ServerApi from '../utils/server_api';
import RewardIndicator from "./reward_indicator";
import {PlayerResultJSON} from '../../common/game/game_result';

import '../styles/results_table.scss';

const ship_icons = [
	require('../img/textures/players/type_1.png'),
	require('../img/textures/players/type_2.png'),
	require('../img/textures/players/type_3.png'),
];

const kills_icon = require('../img/icons/scope_icon.png');
const deaths_icon = require('../img/icons/skull_icon.png');
const coin_icon = require('../img/icons/coin.png');

interface ResultsTableProps {
	data: PlayerResultJSON[];
	no_avatars: boolean;
	no_animation: boolean;
	onPlayerSelected?: (account_id: string) => void;
}

export default class ResultsTable extends React.Component<ResultsTableProps, any> {
	static defaultProps = {
		no_avatars: false,
		no_animation: false
	};
	
	private renderList() {
		return this.props.data.map((row, index) => {
			return <tr key={row.user_id || index}>
				<td>{index+1}</td>
				{!this.props.no_avatars &&
					<td><img src={ServerApi.getAvatarPath(row.avatar)} alt='user avatar' /></td>
				}
				<td className={this.props.onPlayerSelected && row.account_id ? 'player-nick' : ''}
				    style={{textAlign: 'left'}} onClick={() => {
						if(this.props.onPlayerSelected && row.account_id)
							this.props.onPlayerSelected(row.account_id);
					}}>
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
		return <table className={`results-tab${this.props.no_animation ? ' no-animation' : ''}`}>
			<thead><tr>
				<th/>
				{!this.props.no_avatars && <th/>}
				<th>Player</th>
				<th>Ship</th>
				<th>Lvl</th>
				<th><img src={kills_icon} alt='kills' /></th>
				<th><img src={deaths_icon} alt='deaths' /></th>
				<th>Points</th>
				<th><img src={coin_icon} alt={'coin icon'} style={{
					backgroundColor: '#F9A825',
					borderRadius: '40px',
				}}/></th>
				<th>Exp</th>
				<th>Rank</th>
			</tr></thead>
			<tbody>{this.renderList()}</tbody>
		</table>;
	}
}