///<reference path="utils.ts"/>
///<reference path="topbar.tsx"/>
///<reference path="pages/home.tsx"/>
///<reference path="pages/forum.tsx"/>
///<reference path="pages/ranking.tsx"/>
///<reference path="pages/info.tsx"/>
///<reference path="pages/user.tsx"/>
///<reference path="pages/game.tsx"/>
///<reference path="pages/account.tsx"/>
///<reference path="pages/login.tsx"/>
///<reference path="pages/register.tsx"/>
///<reference path="pages/admin.tsx"/>
///<reference path="pages/not_found.tsx"/>
///<reference path="ex_router.tsx"/>

class WebPage extends React.Component<any, {logged_in: boolean, current: string}> {
	state = {
		logged_in: false,
		current: PageNavigator.getCurrentPageName()
	}

	constructor(props: any) {
		super(props);

		//checking session
		if( document.cookie.match(/user_session/i) !== null ) {//detect user_session cookie
			$$.postRequest('restore_session', {}, (pre_res) => {
				if(pre_res === undefined)
					return;
				var res = JSON.parse(pre_res);
				let logged_in = res.result === 'SUCCESS';
				if(logged_in === false)//remove cookie
					document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
				this.onSession( logged_in );
			});
		}
		else
			this.onSession( false );

		PageNavigator.onUrlChange(() => {
			var logged = this.state.logged_in;
			if( (logged === true && document.cookie.match(/user_session/i) === null) || 
				(logged === false && document.cookie.match(/user_session/i) !== null) ) 
			{
				logged = !logged;
			}

			this.setState({
				logged_in: logged,
				current: PageNavigator.getCurrentPageName()
			});
		});
	}

	onSession(is_logged_in: boolean) {
		this.setState({
			logged_in: is_logged_in
		});
	}

	render() {
		return <React.Fragment>
			<Topbar logged_in={this.state.logged_in} current={this.state.current} />
			
			<ExRouter>
				<ExRoute path='/' component={Home} />
				<ExRoute path='/forum' component={Forum} />
				<ExRoute path='/ranking' component={Ranking} />
				<ExRoute path='/info' component={Info} />
				<ExRoute path='/login' component={Login} />
				<ExRoute path='/game' component={Game} />
				<ExRoute path='/user' component={User} />
				<ExRoute path='/register' component={Register} />
				<ExRoute path='/account' component={Account} />
				<ExRoute path='/admin' component={Admin} />
				<ExRoute path='*' component={NotFound} />
			</ExRouter>
		</React.Fragment>;
	}
}