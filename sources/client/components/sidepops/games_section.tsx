import * as React from 'react';
//import {Redirect} from "react-router-dom";
import PropTypes from 'prop-types'

import ServerApi from '../../utils/server_api';
import ERROR_CODES from '../../../common/error_codes';
import Config from '../../../common/config';
import {GameSchema, PublicAccountSchema} from "../../../server/database";
import PagesController from "../widgets/pages_controller";
import ResultsTable from "../results_table";
import GameInfoList from "../widgets/game_info_list";
import UserSidepop from "./user_sidepop";
import SharePanel from "./share_panel";
import GameListItem from "../widgets/game_list_item";

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
	selected_player?: string;
	//redirect_to?: string;
}

export default class GamesSection extends React.Component<GamesSectionProps, GamesSectionState> {
	static defaultProps: Partial<GamesSectionProps> = {
		container_mode: false
	};
	
	static contextTypes = {
        router: PropTypes.object
    };
	
	state: GamesSectionState = {
		games: [],
		page: 0,
		focused_game: null
	};
	
	componentDidMount() {
		this.loadGames().catch(console.error);
	}
	
	componentDidUpdate(prevProps: Readonly<GamesSectionProps>, prevState: Readonly<GamesSectionState>) {
		if(this.state.page !== prevState.page)
			this.loadGames().catch(console.error);
	}
	
	private async loadGames() {
		try {
			let res = await ServerApi.postRequest('/account_games', {
				account_id: this.props.account.id,
				page: this.state.page
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
		this.setState({focused_game: null});
	}
	
	// noinspection JSMethodCanBeStatic
	private renderGamesList(games: GameSchema[]) {
		return games.map(game => {
			let position = game.results.findIndex(result => result.account_id === this.props.account.id);
			return <GameListItem key={game._id} {...{game, position}} onClick={() => {
				if (this.props.container_mode) {
					//this.setState({redirect_to: game._id});
					this.context.router.history.push('/games/' + game._id);
				} else
					this.setState({focused_game: game});
			}} />
		});
	}
	
	private renderFocusedGame(game: GameSchema) {
		return <>
			<GameInfoList game={game} />
			<hr/>
			<div className={'fader-in'} style={{width: '100%', overflowX: 'auto'}}>
				<ResultsTable data={game.results} onPlayerSelected={account_id => {
					this.setState({selected_player: account_id});
				}} no_avatars no_animation />
			</div>
			<hr/>
			<SharePanel link={'/games/' + game._id} />
			{this.state.selected_player &&
				<UserSidepop account_id={this.state.selected_player} onClose={() => {
					this.setState({selected_player: undefined});
				}} />
			}
		</>;
	}
	
	render() {
		//if(this.state.redirect_to)
		//	return <Redirect to={'/games/' + this.state.redirect_to} />;
		if(this.state.focused_game)
			return this.renderFocusedGame(this.state.focused_game);
		if(this.props.total_games === 0)
			return <section>No games played yet</section>;
		return <section>
			<h3 className={'fader-in'}>{this.props.account.username}'s games</h3>
			<table className={'games-list fader-in'}>
				<tbody>{this.renderGamesList(this.state.games)}</tbody>
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