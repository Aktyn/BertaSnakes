import * as React from 'react';
import ServerApi from '../../utils/server_api';
import {AccountSchema} from '../../account';
// import AccountSidepop from "./account_sidepop";
import ERROR_CODES from '../../../common/error_codes';
import {GameSchema} from "../../../server/database";
import Utils from '../../utils/utils';

interface GamesSectionProps {
	//self: AccountSidepop;
	onError: (code: ERROR_CODES) => void;
	account: AccountSchema;
}

interface GamesSectionState {
	games: GameSchema[]
}

export default class GamesSection extends React.Component<GamesSectionProps, GamesSectionState> {
	
	state: GamesSectionState = {
		games: []
	};
	
	componentDidMount() {
		this.loadGames().catch(console.error);
	}
	
	private async loadGames() {
		try {
			let res = await ServerApi.postRequest('/account_games', {account_id: this.props.account.id});
			if (res.error !== ERROR_CODES.SUCCESS)
				return this.props.onError(res.error);
			console.log(res);
			this.setState({games: res.games});
		}
		catch(e) {
			console.error(e);
			this.props.onError(ERROR_CODES.UNKNOWN);
		}
	}
	
	private renderGamesList() {
		return this.state.games.map(game => {
			return <tr key={game._id}>
				<td style={{textAlign: 'left'}}>
					<div>{Utils.trimString(game.name, 20)}</div>
					<div>{game.map}</div>
				</td>
				<td>
					<div>
						<span>{game.map}</span>
						<span className={'separator'} />{/*TODO: separator in sidepop*/}
						<span>{Math.round(game.duration/60)}&nbsp;min</span>
					</div>
					<div>{new Date(game.finish_timestamp).toLocaleString('pl-PL')}</div>
				</td>
				<td>
					<div>{Utils.GAMEMODES_NAMES[game.gamemode]}</div>
					<div>{game.results.length}&nbsp;player{game.results.length > 1 ? 's' : ''}</div>
				</td>
			</tr>;
		});
	}
	
	render() {
		return <section>
			<table>{/*TODO: style of this table*/}
				{/*<thead><tr>*/}
				{/*	<th>Name</th>*/}
				{/*	<th>Map</th>*/}
				{/*	<th>Mode</th>*/}
				{/*	<th>Duration</th>*/}
				{/*	<th>Players</th>*/}
				{/*	<th>Date</th>*/}
				{/*</tr></thead>*/}
				<tbody>{this.renderGamesList()}</tbody>
			</table>
		</section>;
	}
}