///<reference path="../loader.tsx"/>
///<reference path="../games_history.tsx"/>
///<reference path="../pages_link.tsx"/>
///<reference path="../page_navigator.ts"/>
///<reference path="../session.ts"/>

interface AccountState {
	loaded: boolean;
	avatar_upload_error: boolean;
	games?: any[];
	games_page: number;
	rows_per_page: number;
	total_games: number;
}

class Account extends React.Component<any, AccountState> {
	private static avatar_cleared = false;

	private static extractUserGamesPage = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/account\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 0;
		}
	}

	private fileInput: HTMLInputElement | null = null;

	state: AccountState = {
		loaded: false,
		avatar_upload_error: false,
		games: undefined,
		games_page: 0,
		rows_per_page: 0,
		total_games: 0
	}

	constructor(props: any) {
		super(props);

		this.loadAccountInfo();

		PageNavigator.onUrlChange( () => this.loadAccountInfo(), 'account_info_changer' );
	}

	componentWillUnmount() {
		PageNavigator.removeUrlChangeListener('account_info_changer');
	}

	parseGames(raw_res?: string): {games?: any[]; page?: number; rows_per_page?: number;
		total_games?: number;} 
	{
		if(raw_res === undefined)
			return {};
		var res = JSON.parse(raw_res);
		if(res.result !== 'SUCCESS')
			return {};

		return {
			games: res.GAMES,
			page: res.page,
			rows_per_page: res.rows_per_page,
			total_games: res.total_games
		}

		//console.log(res);
		return {};
	}

	loadAccountInfo() {
		if(Session.loggedIn() === true) {
			$$.postRequest('/fetch_account_games', {
				page: Account.extractUserGamesPage()
			}, (raw_res) => {
				var games_data = this.parseGames(raw_res);
				this.setState({
					loaded: true,
					games: games_data.games || [],
					games_page: games_data.page || 0,
					rows_per_page: games_data.rows_per_page || 0,
					total_games: games_data.total_games || 0
				});
			});

			return;
		}
		$$.postRequest('/restore_session', {
			fetch_games: true, 
			page: Account.extractUserGamesPage()
		}, (raw_res) => {
			if(raw_res === undefined)
				return;
			var res = JSON.parse(raw_res);
			Session.set(res);

			var games_data = this.parseGames(raw_res)
			this.setState({
				loaded: true, 
				games: games_data.games || [],
				games_page: games_data.page || 0,
				rows_per_page: games_data.rows_per_page || 0,
				total_games: games_data.total_games || 0
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
			
			Session.clear();
			PageNavigator.redirect('/login');
		});
	}

	uploadAvatar() {
		if(this.fileInput !== null && this.fileInput.files && this.fileInput.files.length > 0) {
			var file = this.fileInput.files[0];

			var xhr = new XMLHttpRequest();

	        xhr.onreadystatechange = () => {//Call a function when the state changes.
	        	if(xhr.readyState === 4) {
	        		if(xhr.status === 413) {
	        			console.log('Uploading file error:', xhr.responseText);
	        			this.setState({avatar_upload_error: true});
	        		}
	        		else if(xhr.status === 200) {
	        			if(Account.avatar_cleared)
	        				location.reload();//page must be reloaded due to resources caching
	        			else {
	        				Session.setAvatar(xhr.responseText);
	        				PageNavigator.redirect('/account');
	        			}
	        		}
	        	}
			};

			xhr.open("post", 'upload_avatar_request', true);

			var formdata = new FormData();
           	formdata.append('avatar_file', file, file.name);
			xhr.send(formdata);//file
		}
	}

	removeAvatar() {
		console.log('Removing current avatar');
		$$.postRequest('/remove_avatar_request', {}, (raw_res) => {
			if(raw_res === undefined)
				return;
			var res = JSON.parse(raw_res);

			if(res.result !== 'SUCCESS') {
				console.log('Cannot remove avatar');
				return;
			}

			Account.avatar_cleared = true;
			Session.clearAvatar();
			PageNavigator.redirect('/account');
		});
	}

	renderGamesHistory() {
		if(this.state.games === undefined || this.state.games.length === 0) {
			return <div id='last_games_preview' style={{display: 'inline-block'}}>
				No games in history
			</div>;
		}
		else {
			//let user_id = Session.getData().ID;

			return <div id='last_games_preview' style={{display: 'inline-grid'}}>
				<GamesHistory games={this.state.games} user_id={Session.getData().ID|0}>
					{this.state.games && this.state.total_games > this.state.rows_per_page && 
					<tr>
						<PagesLink 
							page={this.state.games_page} 
							items_per_page={this.state.rows_per_page} 
							total_items={this.state.total_games}
							href_base={'/account/'} />
					</tr>}
				</GamesHistory>
			</div>;
		}
	}

	renderAvatar() {
		if(Session.loggedIn() && Session.getData().AVATAR !== null) {
			return <div className='avatar_uploader current_avatar' style={{
				backgroundImage: `url('avatars/${Session.getData().AVATAR}')`
			}} onClick={() => this.removeAvatar()}>
			</div>;
		}
		return <div className='avatar_uploader'>
			<input ref={(input) => this.fileInput = input} name='avatar_file'
				accept="image/png, image/jpeg" type='file' onChange={ () => this.uploadAvatar() } />
		</div>;
	}

	renderResult() {
		if(Session.loggedIn() === false) {
			console.log('User not logged in, redirecting to login page');
			PageNavigator.redirect('/login');
			return;
		}

		var data = Session.getData();

		return <div className='container'>
			<h1>ACCOUNT</h1>
			<div>
				<label id='account_nickname' style={{fontWeight: 'bold'}}>{data.NICK}</label>
				<div style={{paddingTop: '20px'}}>
					{this.renderAvatar()}
					{this.state.avatar_upload_error && <div>
						Cannot upload this file.<br />
						Maximum size is 1MB and supported image types are: png and jpg.
					</div>}
				</div>
			</div>
			<hr/>
			<div style={{
				display: 'inline-grid', 
				gridTemplateColumns: 'fit-content(100%) auto',
				textAlign: 'left', 
				padding: '0px 10px'
			}}>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Email:</label>
					<span id='account_email'>{data.EMAIL}</span>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Registered&nbsp;since:</label>
					<span id='account_register_date'>{data.REGISTER_DATE}</span>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Level:</label>
					<span id='account_level'>{data.LEVEL}</span>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Rank:</label>
					<span id='account_rank'>{data.RANK}</span>
				<label style={{textAlign: 'right', margin: '0px 10px'}}>Games:</label>
					<span id='account_games'>{this.state.total_games}</span>

			</div>
			<hr/>
			<div><button id='account_logout' onClick={this.logout}>LOG OUT</button></div>
			<hr/>
			<h2 style={{fontWeight: 'bold'}}>Last games</h2>
			{this.renderGamesHistory()}
		</div>;
	}

	render() {
		return <div>
			{this.state.loaded === false ? <Loader /> : this.renderResult()}
		</div>;
	}
}