import * as React from 'react';
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom';
import ContainerPage, {ContainerProps} from "./container_page";
import {offsetTop} from "../components/sidepops/sidepops_common";
import ServerApi from '../utils/server_api';
import Utils from '../utils/utils';
import ERROR_CODES, {errorMsg} from "../../common/error_codes";
import {PublicAccountSchema, GameSchema} from "../../server/database";

import '../styles/pages/search.scss';
import GameListItem from '../components/widgets/game_list_item';

const enum CATEGORIES {
	USERS = 0,
	GAMES
}

interface SearchState extends ContainerProps {
	category: CATEGORIES;
	accounts: PublicAccountSchema[];
	//last_user_search?: string;
	games: GameSchema[];
	//last_game_search?: string;
}

export default class SearchPage extends React.Component<any, SearchState> {
	private username_input: HTMLInputElement | null = null;
	private game_input: HTMLInputElement | null = null;
	
	state: SearchState = {
		error: undefined,
		loading: false,
		show_navigator: false,
		
		category: this.category,
		accounts: [],
		games: []
	};
	
	static contextTypes = {
        router: PropTypes.object
    };
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
		if(this.value) {
			if(this.category === CATEGORIES.USERS)
				this.searchUser(this.value).catch(console.error);
			else
				this.searchGame(this.value).catch(console.error);
		}
	}
	
	componentDidUpdate(prevProps: any) {
		if(this.props.location !== prevProps.location) {
			if(this.state.category !== this.category)
				this.changeCategory(this.category);
			if(this.value) {
				if(this.category === CATEGORIES.USERS) {
					if(this.username_input)
						this.username_input.value = this.value;
					this.searchUser(this.value).catch(console.error);
				}
				else if(this.category === CATEGORIES.GAMES) {
					if(this.game_input)
						this.game_input.value = this.value;
					this.searchGame(this.value).catch(console.error);
				}
			}
		}
	}
	
	private get category() {
		return parseInt(this.props.match.params.category) || CATEGORIES.USERS;
	}
	
	private get value() {
		return this.props.match.params.value || undefined;
	}
	
	private async searchUser(username: string) {
		try {
			if(username.length < 2)
				return;
			
			this.setState({loading: true, error: undefined, accounts: []});
			let res = await ServerApi.postRequest('/search_user', {
				username
			});
			
			//console.log(res);
			if(res.error !== ERROR_CODES.SUCCESS)
				return this.setError( errorMsg(res.error) );
			
			this.setState({
				//last_user_search: username,
				loading: false,
				accounts: res.accounts
			});
		}
		catch(e) {
			this.setError( errorMsg(ERROR_CODES.SERVER_UNREACHABLE) );
		}
	}
	
	private async searchGame(name: string) {
		try {
			if(name.length < 2)
				return;
			
			this.setState({loading: true, error: undefined, games: []});
			let res = await ServerApi.postRequest('/search_game', {
				name
			});
			
			console.log(res);
			if(res.error !== ERROR_CODES.SUCCESS)
				return this.setError( errorMsg(res.error) );
			
			this.setState({
				//last_game_search: name,
				loading: false,
				games: res.games
			});
		}
		catch(e) {
			this.setError( errorMsg(ERROR_CODES.SERVER_UNREACHABLE) );
		}
	}
	
	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}
	
	private changeCategory(cat: CATEGORIES) {
		this.setState({
			category: cat,
			error: undefined,
			loading: false,
			accounts: [],
			games: []
		});
	}
	
	private redirect(category: CATEGORIES, value?: string) {
		this.context.router.history.push(`/search/${category}/${value}`);
	}
	
	private static renderFoundUsers(accounts: PublicAccountSchema[]) {
		return accounts.map((account) => {
			return <tr key={account.id}>
				<td><img src={ServerApi.getAvatarPath(account.avatar)} alt='avatar' /></td>
				<td style={{textAlign: 'left'}}>{Utils.trimString(account.username, 15)}</td>
				<td>{Math.round(account.rank)}</td>
				<td>{account.level}&nbsp;({Math.round(account.exp*100)}%)</td>
				<td className={'hide-on-shrink'}>{
					new Date(account.creation_time).toLocaleDateString('pl-PL')
				}
				</td>
				<td><Link to={'/users/' + account.id} className={'more-icon shaky-icon'}/></td>
			</tr>;
		});
	}
	
	private renderUserSearch() {
		return <React.Fragment key={'user-search'}>
			<div className={'fader-in'} style={offsetTop}>
				<input type={'text'} placeholder={'Username'} ref={el => this.username_input = el} style={{
					width: '80%'
				}} onKeyDown={e => {
					if(e.keyCode === 13 && this.username_input)
						this.redirect(this.category, this.username_input.value.trim());
						//this.searchUser().catch(console.error);
				}} defaultValue={this.value}/>
			</div>
			<div className={'fader-in'} style={offsetTop}>
				<button onClick={() => {
					if(this.username_input)
						this.redirect(this.category, this.username_input.value.trim());
				}}>SEARCH</button>
			</div>
			<div className={'fader-in'} style={offsetTop}>{this.state.accounts.length > 0 ?
				<table className={'results-table'}>
					<thead><tr>
						<th />
						<th>Username</th>
						<th>Rank</th>
						<th>Level</th>
						<th className={'hide-on-shrink'}>Registered since</th>
						<th />
					</tr></thead>
					<tbody>{SearchPage.renderFoundUsers(this.state.accounts)}</tbody>
				</table>
				:
				(this.value && <span>No results</span>)
			}</div>
		</React.Fragment>;
	}
	
	private renderFoundGames(games: GameSchema[]) {
		return games.map(game => {
			//let position = game.results.findIndex(result => result.account_id === this.props.account.id);
			return <GameListItem key={game._id} game={game} onClick={() => {
				this.context.router.history.push('/games/' + game._id);
			}} />
		});
	}
	
	private renderGameSearch() {
		return <React.Fragment key={'game-search'}>
			<div className={'fader-in'} style={offsetTop}>
				<input type={'text'} placeholder={'Name of game'} ref={el => this.game_input = el} style={{
					width: '80%'
				}} onKeyDown={e => {
					if(e.keyCode === 13 && this.game_input)
						this.redirect(this.category, this.game_input.value.trim());
						//this.searchGame().catch(console.error);
				}} defaultValue={this.value}/>
			</div>
			<div className={'fader-in'} style={offsetTop}>
				<button onClick={() => {
					if(this.game_input)
						this.redirect(this.category, this.game_input.value.trim());
				}}>SEARCH</button>
			</div>
			<div className={'fader-in'} style={offsetTop}>{this.state.games.length > 0 ?
				<table className={'games-list fader-in'}>
					<tbody>{this.renderFoundGames(this.state.games)}</tbody>
				</table>
				:
				(this.value && <span>No results</span>)
			}</div>
		</React.Fragment>;
	}
	
	render() {
		return <ContainerPage className={'search-page'} {...this.state}>
			<nav className={'fader-in'}>
				<Link to={`/search/${CATEGORIES.USERS}`}>USERS</Link>
				<Link to={`/search/${CATEGORIES.GAMES}`}>GAMES</Link>
				<span className={'indicator'} style={{
					transform: `translateX(${this.state.category === CATEGORIES.GAMES ? '100' : '0'}%)`
				}} />
			</nav>
			{this.state.category === CATEGORIES.USERS ? this.renderUserSearch() : this.renderGameSearch()}
		</ContainerPage>;
	}
}