///<reference path="../loader.tsx"/>
///<reference path="../games_history.tsx"/>
///<reference path="../pages_link.tsx"/>
///<reference path="../page_navigator.ts"/>

interface UserState {
	loaded: boolean;
	raw_result?: string;
}

class User extends React.Component<any, UserState> {
	private static extractUserID = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/user\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 0;
		}
	}

	private static extractUserGamesPage = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/user\/[0-9]+\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 0;
		}
	}

	state = {
		loaded: false,
		raw_result: undefined
	}

	constructor(props: any) {
		super(props);

		this.loadUserInfo();

		PageNavigator.onUrlChange( () => this.loadUserInfo(), 'user_info_changer' );
	}

	componentWillUnmount() {
		PageNavigator.removeUrlChangeListener('user_info_changer');
	}

	loadUserInfo() {
		//console.log('user id:', User.extractUserID(), 'games page:', User.extractUserGamesPage());

		$$.postRequest('/user_info', {
			id: User.extractUserID(), 
			fetch_games: true, 
			page: User.extractUserGamesPage()}, (raw_res) => 
		{
			this.setState({
				loaded: true,
				raw_result: raw_res
			});
		});
	}

	renderGamesHistory(res: any) {
		if(res.GAMES === undefined || res.GAMES.length === 0) {
			return <div id='last_games_preview' style={{display: 'inline-block'}}>
				No games in history
			</div>;
		}
		else {
			let user_id = User.extractUserID();

			return <div id='last_games_preview' style={{display: 'inline-grid'}}>
				<GamesHistory games={res.GAMES} user_id={user_id|0}>
					{res.total_games > res.rows_per_page && <tr>
						<PagesLink 
							page={res.page} 
							items_per_page={res.rows_per_page} 
							total_items={res.total_games}
							href_base={'/user/' + user_id + '/'} />
					</tr>}
				</GamesHistory>
			</div>;
		}
	}

	renderError(error: string) {
		return <div className='container'>
			<h1>USER INFO</h1>
			<div className='error_msg' id='user_info_error'>{error}</div>
		</div>;
	}

	renderResult() {
		if(this.state.raw_result === undefined)
			return this.renderError('Incorrect server response');

		var res = JSON.parse(this.state.raw_result || '{}');

		if(res.result !== "SUCCESS")
			return this.renderError('User not found');

		try {
			var user_level: number = JSON.parse(res.CUSTOM_DATA).level;
			var user_rank: number = (JSON.parse(res.CUSTOM_DATA).rank || 1000)|0;
		}
		catch(e) {
			var user_level = 0;
			var user_rank = 0;
		}
		//<div className='error_msg' id='user_info_error'>{this.state.error}</div>
		return <div className='container'>
			<h1>USER INFO</h1>
			<div><label id='user_nickname' style={{fontWeight: 'bold'}}>{res.NICK}</label></div>
			<hr/>
			<div style={{
				display: 'inline-grid',
				gridTemplateColumns: 'fit-content(100%) auto',
				textAlign: 'left', 
				padding: '0px 10px'
			}}>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Registered&nbsp;since:</label>
				<span id='user_register_date'>{res.REGISTER_DATE}</span>

				<label style={{textAlign: 'right', margin: '0px 10px'}}>Last&nbsp;seen:</label>
				<span id='user_last_seen_date'>{res.LAST_SEEN}</span>

				<label style={{textAlign: 'right', margin: '0px 10px'}}>Level:</label>
				<span id='user_level'>{user_level}</span>

				<label style={{textAlign: 'right', margin: '0px 10px'}}>Rank:</label>
				<span id='user_rank'>{user_rank}</span>
			</div>
			<hr/>
			<h2 style={{fontWeight: 'bold'}}>Last games</h2>
			{this.renderGamesHistory(res)}
		</div>;
	}

	render() {
		return <div>
			{this.state.loaded === false ? <Loader /> : this.renderResult()}
		</div>;
	}
}