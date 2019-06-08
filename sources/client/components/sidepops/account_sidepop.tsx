import * as React from 'react';
import SidepopBase, {SidepopProps} from './sidepop_base';
import Loader from '../loader';
import ServerApi from '../../utils/server_api';
import Account, {AccountSchema} from '../../account';
import {errorMsg} from '../../../common/error_codes';

const MAX_LEN = 64;

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
	private nick_input: HTMLInputElement | null = null;
	private password_input: HTMLInputElement | null = null;

	private onLogIn: (account: AccountSchema | null) => void;

	state: AccountSidepopState = {
		loading: false,
		register_view: false,
		account: null
	}

	constructor(props: AccountSidepopProps) {
		super(props);
		this.state.account = Account.getAccount();
		this.onLogIn = (account) => this.setState({account});
	}

	componentDidMount() {
		if(this.nick_input)
			this.nick_input.focus();

		Account.addLoginListener( this.onLogIn );

		if(process.env.NODE_ENV === 'development') {
			try {
				//@ts-ignore
				this.nick_input.value = 'TestAccount';
				//@ts-ignore
				this.password_input.value = 'test_password';
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
	}

	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}

	private async tryLogin() {
		if(this.state.loading || !this.nick_input || !this.password_input)
			return;
		let nick = this.nick_input.value;
		let password = this.password_input.value;
		if(nick.length < 3)
			return this.setError('Username must be at least 3 characters long');
		if(password.length < 6)
			return this.setError('Password must be at least 6 characters long');

		this.setState({loading: true, error: undefined});

		let res = await Account.login(nick, password);
		if(res.error)
			return this.setError( errorMsg(res.error) );
		
		this.setState({account: Account.getAccount(), loading: false});
		//close sidepop after successful login
		//this.props.onClose();
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

	private renderLoginSection() {
		return <section>
			<h1 key={'login_h'} className='fader-in'>Log in to your account</h1>
			<input className='fader-in' type='text' placeholder='Username' 
				ref={el => this.nick_input = el} onKeyDown={e => {
					if(e.keyCode === 13 && this.password_input)
						this.password_input.focus();
				}} onChange={this.formatInput} maxLength={MAX_LEN} />
			<input className='fader-in' type='password' placeholder='Password' 
				ref={el => this.password_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13)
						this.tryLogin();
				}} onChange={this.formatInput} maxLength={MAX_LEN} />
			<button className='fader-in' style={offsetTop} 
				onClick={this.tryLogin.bind(this)}>LOG IN</button>
			<hr />
			<label className='fader-in'>No account yet?</label>
			<br/>
			<button className='fader-in' style={offsetTop} 
				onClick={() => {
					this.setState({register_view: true, error: undefined, loading: false});
				}}>REGISTER</button>
		</section>;
	}

	private renderRegisterSection() {
		return <section>
			<h1 key='register_h' className='fader-in'>Create new account</h1>
			<div key='todo-key' className='fader-in'>TODO</div>
		</section>;
	}

	private renderAccountSection(account: AccountSchema) {
		return <section>
			<h1 key='welcome-key' className='fader-in'>Welcome {account.username}</h1>
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