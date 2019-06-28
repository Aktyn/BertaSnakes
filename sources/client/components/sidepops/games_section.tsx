import * as React from 'react';
import {Link, Redirect} from "react-router-dom";

import ServerApi from '../../utils/server_api';
import ERROR_CODES from '../../../common/error_codes';
import Config from '../../../common/config';
import {GameSchema, PublicAccountSchema} from "../../../server/database";
import Utils from '../../utils/utils';
import RewardIndicator from "../reward_indicator";
import PagesController from "../pages_controller";
import ResultsTable from "../results_table";
import {offsetTop} from "./sidepops_common";
import GameInfoList, {convertDate} from "../game_info_list";
import UserSidepop from "./user_sidepop";

interface GamesSectionProps {
	onError: (code: ERROR_CODES) => void;
	account: PublicAccountSchema;
	total_games: number;
	container_mode: boolean;
}

interface GamesSectionState {
	games: GameSchema[];
	page: number;
	focused_game: GameSchema | null;
	link_copied: boolean;
	selected_player?: string;
	redirect_to?: string;
}

export default class GamesSection extends React.Component<GamesSectionProps, GamesSectionState> {
	static defaultProps: Partial<GamesSectionProps> = {
		container_mode: false
	};
	
	state: GamesSectionState = {
		games: [],
		page: 0,
		focused_game: null,
		link_copied: false,
	};
	
	componentDidMount() {
		this.loadGames(this.state.page).catch(console.error);
	}
	
	componentDidUpdate(prevProps: Readonly<GamesSectionProps>, prevState: Readonly<GamesSectionState>) {
		if(this.state.page !== prevState.page) {
			console.log('Page changed to:', this.state.page);
			this.loadGames(this.state.page).catch(console.error);
		}
	}
	
	private async loadGames(page: number) {
		try {
			let res = await ServerApi.postRequest('/account_games', {
				account_id: this.props.account.id,
				page
			});
			if (res.error !== ERROR_CODES.SUCCESS)
				return this.props.onError(res.error);
			//console.log(res);
			this.setState({games: res.games});
		}
		catch(e) {
			console.error(e);
			this.props.onError(ERROR_CODES.UNKNOWN);
		}
	}
	
	public isGameFocused() {
		return this.state.focused_game !== null;
	}
	
	public defocusGame() {
		this.setState({focused_game: null, link_copied: false});
	}
	
	private renderGamesList() {
		return this.state.games.map(game => {
			let position = game.results.findIndex(result => result.account_id === this.props.account.id);
			return <tr key={game._id} onClick={() => {
				if(this.props.container_mode)
					this.setState({redirect_to: game._id});
				else
					this.setState({focused_game: game});
			}}>
				<td style={{textAlign: 'left'}}>
					<div style={{fontWeight: 'bold'}}>{Utils.trimString(game.name, 20)}</div>
					<div>{convertDate(game.finish_timestamp)}</div>
				</td>
				<td>
					<div>
						<span>{game.map}</span>
						<span className={'separator'} style={{backgroundColor: '#B0BEC5'}} />
						<span>{Math.round(game.duration/60)}&nbsp;min</span>
					</div>
					<div>{Utils.GAMEMODES_NAMES[game.gamemode]}</div>
				</td>
				<td>
					<div>Pos:&nbsp;{position+1}/{game.results.length}</div>
					<div>
						Rank: {Math.round(game.results[position].rank)}&nbsp;
						<RewardIndicator reward={game.results[position].rank_reward} />
					</div>
				</td>
			</tr>;
		});
	}
	
	private renderFocusedGame(game: GameSchema) {
		let link = '/games/' + game._id;
		return <>
			<GameInfoList game={game} />
			<hr/>
			<div className={'fader-in'} style={{width: '100%', overflowX: 'auto'}}>
				<ResultsTable data={game.results} onPlayerSelected={account_id => {
					this.setState({selected_player: account_id});
				}} no_avatars no_animation />
			</div>
			<hr/>
			<div className={'fader-in'}>
				<div>Link&nbsp;to&nbsp;share:</div>
				<div>
					<Link to={link} target={'_blank'}>{location.origin + link}</Link>
				</div>
				<button style={{
					...offsetTop,
					border: this.state.link_copied ? '1px solid #9CCC65' : 'none'
				}} onClick={() => {
					let textField = document.createElement('textarea');
				    textField.innerText = location.origin + link;
				    document.body.appendChild(textField);
				    textField.select();
				    document.execCommand('copy');
				    textField.remove();
				    this.setState({link_copied: true});
				}}>COPY</button>
			</div>
			{this.state.selected_player &&
				<UserSidepop account_id={this.state.selected_player} onClose={() => {
					this.setState({selected_player: undefined});
				}} />
			}
		</>;
	}
	
	render() {
		if(this.state.redirect_to)
			return <Redirect to={'/games/' + this.state.redirect_to} />;
		if(this.state.focused_game)
			return this.renderFocusedGame(this.state.focused_game);
		if(this.props.total_games === 0)
			return <section>No games played yet</section>;
		return <section>
			<h3 className={'fader-in'}>{this.props.account.username}'s games</h3>
			<table className={'games-list fader-in'}>
				<tbody>{this.renderGamesList()}</tbody>
			</table>
			<div className='fader-in'>{
				this.props.total_games > Config.ITEMS_PER_GAMES_LIST_PAGE &&
				<PagesController page={this.state.page} page_capacity={Config.ITEMS_PER_GAMES_LIST_PAGE}
				                 items={this.props.total_games} onChange={page => {
					this.setState({page});
				}} />
			}</div>
		</section>;
	}
}