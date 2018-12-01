///<reference path="../link.tsx"/>
///<reference path="../page_navigator.ts"/>
///<reference path="../loader.tsx"/>

class Register extends React.Component<any, any> {
	private nickInput: HTMLInputElement | null = null;
	private passInput: HTMLInputElement | null = null;
	private emailInput: HTMLInputElement | null = null;

	state = {
		loading: false,
		error: undefined
	}

	constructor(props: any) {
		super(props);
	}

	onKeyDown(e: KeyboardEvent) {
		if(e.keyCode === 13) {
			if(e.target === this.nickInput && this.passInput !== null)
				this.passInput.focus();
			else if(e.target === this.passInput && this.emailInput)
				this.emailInput.focus();
			else if(e.target === this.emailInput)
				this.register();
		}
	}

	register() {
		//$$('#register_error').setText('').append( body_loader = COMMON.createLoader() );
		
		if(!this.nickInput || !this.passInput || !this.emailInput)
			return this.setState({error: 'Invalid input values', loading: false});

		this.setState({error: undefined, loading: true});

		var nick = this.nickInput.value;
		var pass = this.passInput.value;
		var email = this.emailInput.value;

		//NOTE - base64 encoded password
		$$.postRequest('/register_request', 
			{username: nick, password: btoa(pass), email: email}, raw_res => {

			if(raw_res === undefined)
				return;

			var res = JSON.parse(raw_res);

			//console.log(res);
			
			if(res.result !== 'SUCCESS') {
				var error = (function(error_name) {
					switch(error_name) {
						case "USERNAME_TOO_SHORT":
							return "User name must be at least 3 characters long";
						case "PASSWORD_TOO_SHORT": 	
							return "Password too short";
						case "INCORRECT_EMAIL":
							return "Email format incorrect";
						case "USER_ALREADY_EXISTS":
							return "User name taken";
						case "EMAIL_IN_USE":
							return "Email already in use";
						case "EMAIL_SEND_ERROR":
							return "Cannot send email with verification code";
						default: 
							return "Register error";
					}
				})(res.result);

				this.setState({error: error, loading: false});

				return;
			}

			if(this.nickInput)	this.nickInput.value = '';
			if(this.passInput)	this.passInput.value = '';
			if(this.emailInput)	this.emailInput.value = '';

			this.setState({error: "Registration successful. Check your email for verification link", 
				loading: false});
		});
	}

	render() {
		return <div id='account_form' className='container'>
			<h1>Registration</h1>
			<div className='error_msg' id='register_error'>
				{this.state.error}
				{this.state.loading && <Loader color='#f44336' />}
			</div>
			<div className='prompt'><label>Nickname: </label>
				<input ref={(input) => { this.nickInput = input; }}
					onKeyDown={e => this.onKeyDown(e as never)} type='text' name='username' /></div>
			<div className='prompt'><label>Password: </label>
				<input ref={(input) => { this.passInput = input; }}
					onKeyDown={e => this.onKeyDown(e as never)} type='password' name='password' /></div>
			<div className='prompt'><label>Email adress: </label>
				<input ref={(input) => { this.emailInput = input; }}
					onKeyDown={e => this.onKeyDown(e as never)} type='email' name='email' /></div>
			<div><button id='register_submit' onClick={this.register.bind(this)}>CREATE</button></div>
			<hr />
			<Link href='/login'><button id='register_submit'>RETURN</button></Link>
		</div>;
	}
}