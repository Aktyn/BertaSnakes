///<reference path="../loader.tsx"/>
///<reference path="../games_history.tsx"/>
///<reference path="../pages_link.tsx"/>
///<reference path="../page_navigator.ts"/>

interface AccountState {
	loaded: boolean;
	raw_result?: string;
}

class Account extends React.Component<any, AccountState> {
	private static extractUserGamesPage = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/account\/([0-9]+)/i)[1] );
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

		this.loadAccountInfo();

		PageNavigator.onUrlChange( () => this.loadAccountInfo(), 'account_info_changer' );
	}

	componentWillUnmount() {
		PageNavigator.removeUrlChangeListener('account_info_changer');
	}

	loadAccountInfo() {
		$$.postRequest('/restore_session', {
			fetch_games: true, 
			page: Account.extractUserGamesPage()
		}, (raw_res) => {
			this.setState({
				loaded: true,
				raw_result: raw_res
			});
		});
	}

	logout() {
		$$.postRequest('/logout_request', {}, (raw_res) => {
			if(raw_res === undefined)
				return;
			var res = JSON.parse(raw_res);
			console.log(res);
			if(res.result !== "SUCCESS")
				throw Error("Cannot logout");
			//remove cookie
			document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
			// location.href = '/login';
			PageNavigator.redirect('/login');
		});
	}

	renderGamesHistory(res: any) {
		if(res.GAMES === undefined || res.GAMES.length === 0) {
			return <div id='last_games_preview' style={{display: 'inline-block'}}>
				No games in history
			</div>;
		}
		else {
			let user_id = res.ID;

			return <div id='last_games_preview' style={{display: 'inline-grid'}}>
				<GamesHistory games={res.GAMES} user_id={user_id|0}>
					{res.total_games > res.rows_per_page && <tr>
						<PagesLink 
							page={res.page} 
							items_per_page={res.rows_per_page} 
							total_items={res.total_games}
							href_base={'/account/'} />
					</tr>}
				</GamesHistory>
			</div>;
		}
	}

	renderResult() {
		if(this.state.raw_result === undefined)
			return;// this.renderError('Incorrect server response');

		var res = JSON.parse(this.state.raw_result || '{}');

		//console.log(res);

		if(res.result !== 'SUCCESS') {
			console.log('User not logged in, redirecting to login page');
			PageNavigator.redirect('/login');
			return;
		}

		try {
			var account_level = JSON.parse(res.CUSTOM_DATA).level | 0;
			var account_rank = ( JSON.parse(res.CUSTOM_DATA).rank || 1000 ) | 0;
		}
		catch(e) {
			console.error(e);
			var account_level = 0;
			var account_rank = 0;
		}

		return <div className='container'>
			<h1>ACCOUNT</h1>
			<div><label id='account_nickname' style={{fontWeight: 'bold'}}>{res.NICK}</label></div>
			<hr/>
			<div style={{
				display: 'inline-grid', 
				gridTemplateColumns: 'fit-content(100%) auto',
				textAlign: 'left', 
				padding: '0px 10px'
			}}>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Email:</label>
					<span id='account_email'>{res.EMAIL}</span>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Registered&nbsp;since:</label>
					<span id='account_register_date'>{res.REGISTER_DATE}</span>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Level:</label>
					<span id='account_level'>{account_level}</span>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Rank:</label>
					<span id='account_rank'>{account_rank}</span>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Games:</label>
					<span id='account_games'>{res.total_games}</span>

			</div>
			<hr/>
			<div><button id='account_logout' onClick={this.logout}>LOG OUT</button></div>
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