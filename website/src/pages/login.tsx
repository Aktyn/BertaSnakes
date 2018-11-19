///<reference path="../link.tsx"/>
///<reference path="../page_navigator.ts"/>

class Login extends React.Component<any, any> {
	private loginInput: HTMLInputElement | null = null;
	private passInput: HTMLInputElement | null = null;

	state = {
		error: undefined,
		verified: true
	}

	constructor(props: any) {
		super(props);
	}

	onKeyDown(e: KeyboardEvent) {
		if(e.keyCode === 13) {
			if(e.target === this.loginInput && this.passInput !== null)
				this.passInput.focus();
			else if(e.target === this.passInput && this.passInput)
				this.login();
		}
	}

	login() {
		if(!this.loginInput || !this.passInput)
			return this.setState({error: 'Invalid input values'});

		var nick = this.loginInput.value;
		var pass = this.passInput.value;

		//NOTE - base64 encoded password
		$$.postRequest('/login_request', {username: nick, password: btoa(pass)}, raw_res => {
			if(raw_res === undefined)
				return;
			var res = JSON.parse(raw_res);
			//console.log(res);

			if(res.result !== 'SUCCESS') {
				var error = (function(error_name) {
					switch(error_name) {
						case "INCORRECT_PASSWORD":
							return "Incorrect password";
						case "USER_DOES_NOT_EXISTS":
							return "User does not exists";
						case "ACCOUNT_NOT_VERIFIED":
							return "Account not verified. Check your email for verification link or:";
						case "ACCOUNT_BANNED":
							return "Account banned";
						default: 
							return "Login error";
					}
				})( res.result );

				this.setState({
					error: error,
					verified: res.result !== 'ACCOUNT_NOT_VERIFIED'
				});

				return;
			}

			//set cookie from res.user_key
			let d = new Date();
    		d.setTime(d.getTime() + (14*24*60*60*1000));//14 days cookie lifetime
			document.cookie = 'user_session=' + res.user_key + 
				";expires=" + d.toUTCString() + ";path=/";

			// location.href = '/account';
			PageNavigator.redirect('/account');
		});
	}

	showResendVerificationLink() {
		let sending = false;

		if(!this.loginInput || !this.passInput)
			return this.setState({error: 'Invalid input values'});

		var nick = this.loginInput.value;
		var pass = this.passInput.value;

		return <div>
			<button onClick={() => {
				if(sending === true)
					return;
				sending = true;
				
				$$.postRequest('/resend_verification_link_request', 
					{username: nick, password: btoa(pass)}, resend_res_raw => {
					if(resend_res_raw === undefined)
						return this.setState({error: 'Incorrect server response'});
					sending = false;
					var resend_res: {result: string} = JSON.parse(resend_res_raw);
					console.log(resend_res);

					if(resend_res.result !== 'SUCCESS')
						return this.setState({error: resend_res.result});
					else
						location.reload();
				});
			}}>RESEND VERIFICATION EMAIL</button>
		</div>;
	}

	render() {
		return <div id='account_form' className='container'>
			<h1>Login to your account</h1>
			<div className='error_msg' id='login_error'>
				{this.state.error}
				{this.state.verified || this.showResendVerificationLink()}
			</div>
			<div className='prompt'>
				<label>Nickname: </label>
				<input ref={(input) => { this.loginInput = input; }}
					onKeyDown={e => this.onKeyDown(e as never)} type='text' name='username' />
			</div>
			<div className='prompt'>
				<label>Password: </label>
				<input ref={(input) => { this.passInput = input; }}
					onKeyDown={e => this.onKeyDown(e as never)} type='password' name='password' />
			</div>
			<div><button onClick={this.login.bind(this)}>LOG IN</button></div>
			<hr />
			<div style={{marginBottom: '10px'}}>OR</div>
			<Link href='/register'><button>REGISTER</button></Link>
		</div>;
	}
}

//<a href='/register'><button id='register_submit'>REGISTER</button></a>