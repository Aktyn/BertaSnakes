import * as React from 'react';
import SidepopBase, {SidepopProps} from './sidepop_base';
import Loader from '../loader';
import ServerApi from '../../utils/server_api';
import Account, {AccountSchema} from '../../account';
import {errorMsg} from '../../../common/error_codes';
import Config from '../../../common/config';

interface AccountSidepopProps extends SidepopProps {

}

interface AccountSidepopState {
	loading: boolean;
	register_view: boolean;
	error?: string;
	account: AccountSchema | null;
}

const offsetTop = {marginTop: '10px'};

export default class AccountSidepop extends React.Component<AccountSidepopProps, AccountSidepopState> {
	private username_input: 		HTMLInputElement | null = null;
	private password_input: 		HTMLInputElement | null = null;
	private password_confirm_input: HTMLInputElement | null = null;
	private email_input: 			HTMLInputElement | null = null;
	private register_btn: 			HTMLButtonElement | null = null;

	private register_confirm: NodeJS.Timeout | null = null;

	private onLogIn: (account: AccountSchema | null) => void;

	state: AccountSidepopState = {
		loading: false,
		register_view: false,//true temporary for tests
		account: null
	}

	constructor(props: AccountSidepopProps) {
		super(props);
		this.state.account = Account.getAccount();
		this.onLogIn = (account) => this.setState({account});
	}

	componentDidMount() {
		if(this.username_input)
			this.username_input.focus();

		Account.addLoginListener( this.onLogIn );

		if(process.env.NODE_ENV === 'development') {
			try {
				//@ts-ignore
				this.username_input.value = 'TestAccount';
				//@ts-ignore
				this.password_input.value = 'test_password';
				//@ts-ignore
				this.password_confirm_input.value = 'test_password';
				//@ts-ignore
				this.email_input.value = 'Aktyn3@gmail.com';//TODO - remove of course
			}
			catch(e) {}
		}

		(async () => {
			if(false === await ServerApi.pingServer() )
				this.setError('Server is not available');

			//TODO - get account details if user is logged in
		})();
	}

	componentWillUnmount() {
		Account.removeLoginListener( this.onLogIn );
		if(this.register_confirm)
			clearTimeout(this.register_confirm);
	}

	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}

	private async tryLogin() {
		if(this.state.loading || !this.username_input || !this.password_input)
			return;
		let nick = this.username_input.value;
		let password = this.password_input.value;
		if(nick.length < 3) {
			this.username_input.focus();
			return this.setError('Username must be at least 3 characters long');
		}
		if(password.length < 6) {
			this.password_input.focus();
			return this.setError('Password must be at least 6 characters long');
		}

		this.setState({loading: true, error: undefined});

		let res = await Account.login(nick, password);
		if(res.error)
			return this.setError( errorMsg(res.error) );
		
		this.setState({account: Account.getAccount(), loading: false});
		
		//close sidepop after successful login (changed)
		//this.props.onClose();
	}

	private async tryRegister() {
		if(this.state.loading || !this.register_btn || !this.username_input || !this.password_input || 
			!this.password_confirm_input || !this.email_input)
		{
			return;
		}

		//validate inputs
		let nick = this.username_input.value;
		let password = this.password_input.value;
		let email = this.email_input.value;

		if(nick.length < 3) {//TODO - move this requirements into config and check them server-side
			this.username_input.focus();
			return this.setError('Username must be at least 3 characters long');
		}
		if(password.length < 6) {
			this.password_input.focus();
			return this.setError('Password must be at least 6 characters long');
		}
		if(password !== this.password_confirm_input.value) {
			this.password_confirm_input.focus();
			return this.setError('Passwords does not match');
		}

		if( !email.match(/[^@]+@[a-z0-9]+\.[a-z0-9]+/i) ) {
			this.email_input.focus();
			return this.setError('Email address is not correct');
		}

		//confirmation system
		if(!this.register_confirm) {
			this.register_btn.textContent = 'CONFIRM';
			this.register_confirm = setTimeout(() => {
				if(this.register_btn)
					this.register_btn.textContent = 'CREATE';
				this.register_confirm = null;
			}, 5000) as never;
			return;
		}

		this.setState({loading: true, error: undefined});

		let res = await Account.register(nick, password, email);
		if(res.error) {
			if(this.register_confirm) {
				clearTimeout(this.register_confirm);
				this.register_confirm = null;
			}
			this.register_btn.textContent = 'CREATE';
			return this.setError( errorMsg(res.error) );
		}
		
		this.setState({account: Account.getAccount(), loading: false});
	}

	private canReturn() {
		return this.state.register_view;
	}

	private return() {
		if(this.state.register_view) {
			this.setState({register_view: false, error: undefined, loading: false});
			return;
		}
	}

	private formatInput(e: React.ChangeEvent<HTMLInputElement>) {
		//remove white characters
		e.target.value = e.target.value.replace(/\s/g, '');
	}

	private checkPasswordsMatch() {
		if(!this.password_input || !this.password_confirm_input)
			return;
		if(this.password_input.value === this.password_confirm_input.value)
			this.password_confirm_input.classList.remove('incorrect');
		else
			this.password_confirm_input.classList.add('incorrect');
	}

	private renderLoginSection() {
		return <section>
			<h1 key={'login_h'} className='fader-in'>Log in to your account</h1>
			<input key='login_username' className='fader-in' type='text' placeholder='Username' 
				ref={el => this.username_input = el} onKeyDown={e => {
					if(e.keyCode === 13 && this.password_input)
						this.password_input.focus();
				}} onChange={this.formatInput} maxLength={Config.MAX_LOGIN_LENGTH} name='username' />
			<input key='login_password' className='fader-in' type='password' placeholder='Password' 
				ref={el => this.password_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13)
						this.tryLogin();
				}} onChange={this.formatInput} maxLength={Config.MAX_PASSWORD_LENGTH} name='password' />
			<button key='login_btn' className='fader-in' style={offsetTop} 
				onClick={this.tryLogin.bind(this)}>LOG IN</button>
			<hr />
			<label key='no_acc_label' className='fader-in'>No account yet?</label>
			<br/>
			<button key='register_view_btn' className='fader-in' style={offsetTop} 
				onClick={() => {
					this.setState({register_view: true, error: undefined, loading: false});
				}}>REGISTER</button>
		</section>;
	}

	private renderRegisterSection() {
		return <section>
			<h1 key='register_h' className='fader-in'>Create new account</h1>
			<input key='register_username' className='fader-in' type='text' placeholder='Username'
				ref={el => this.username_input = el} onKeyDown={e => {
					if(e.keyCode === 13 && this.password_input)
						this.password_input.focus();
				}} onChange={this.formatInput} maxLength={Config.MAX_LOGIN_LENGTH} />
			<input key='register_password' className='fader-in' type='password' placeholder='Password' 
				ref={el => this.password_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13 && this.password_confirm_input)
						this.password_confirm_input.focus();
				}} onChange={e => {
					this.checkPasswordsMatch();
					this.formatInput(e);
				}} maxLength={Config.MAX_PASSWORD_LENGTH} />
			<input key='register_password_confirm' className='fader-in' type='password' 
				placeholder='Confirm password' 
				ref={el => this.password_confirm_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13 && this.email_input)
						this.email_input.focus();
				}} onChange={e => {
					this.checkPasswordsMatch();
					this.formatInput(e);
				}} maxLength={Config.MAX_PASSWORD_LENGTH} />
			<input key='email_input' className='fader-in' type='email' name='email'
				placeholder='Email address' 
				ref={el => this.email_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13 && this.register_btn) {
						this.register_btn.focus();
						this.tryRegister();
					}
				}} onChange={this.formatInput} maxLength={256} />
			<button key='register_btn' style={offsetTop} className='fader-in'
				ref={el => this.register_btn = el} onClick={this.tryRegister.bind(this)}>CREATE</button>
		</section>;
	}

	private renderVerificationPrompt(account: AccountSchema) {
		return <>
			<hr />
			<h2 key='not_verified_label' className='error fader-in'>Account is not verified</h2>
			<div key='verification_panel' className='fader-in'>
				<input type='text' placeholder='VERIFICATION CODE' style={{textAlign: 'center'}} />
				<button style={offsetTop} onClick={() => {
					//TODO
				}}>VERIFY</button>
			</div>
			<hr />
		</>;
	}

	private renderAccountSection(account: AccountSchema) {
		//TODO - information about not verified account and resent verification link button
		return <section>
			<h1 key='welcome-key' className='fader-in'>Welcome {account.username}</h1>
			{!account.verified && this.renderVerificationPrompt(account)}
			<button key='logout-btn' className='fader-in' onClick={() => {
				Account.logout();
			}}>LOG OUT</button>
		</section>;
	}

	render() {
		return <SidepopBase onClose={this.props.onClose} show_navigator={true}
			navigator_return={this.canReturn() ? this.return.bind(this) : undefined} >
			{this.state.loading && <Loader color='#ef5350' />}
			{this.state.error && <div className='error'>{this.state.error}</div>}
			{
				this.state.account ? this.renderAccountSection(this.state.account) :
				(this.state.register_view ? this.renderRegisterSection() : this.renderLoginSection())
			}
		</SidepopBase>;
	}
}