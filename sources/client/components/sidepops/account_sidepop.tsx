import * as React from 'react';
import SidepopBase, {SidepopProps} from './sidepop_base';
import Loader from '../loader';
import ServerApi from '../../utils/server_api';
import Utils from '../../utils/utils';
import Account, {AccountSchema} from '../../account';
import {errorMsg} from '../../../common/error_codes';
import Config from '../../../common/config';
import ERROR_CODES from '../../../common/error_codes';

import './../../styles/account_sidepop.scss';
const no_avatar_img = require('../../img/icons/account.svg');

interface AccountSidepopProps extends SidepopProps {

}

interface AccountSidepopState {
	loading: boolean;
	register_view: boolean;
	error?: string;
	account: AccountSchema | null;
	verify_info: boolean;
	verification_resend: boolean;
}

const offsetTop = {marginTop: '10px'};

export default class AccountSidepop extends React.Component<AccountSidepopProps, AccountSidepopState> {
	private username_input: 		HTMLInputElement | null = null;
	private password_input: 		HTMLInputElement | null = null;
	private password_confirm_input: HTMLInputElement | null = null;
	private email_input: 			HTMLInputElement | null = null;
	private register_btn: 			HTMLButtonElement | null = null;
	private verification_code_input:HTMLInputElement | null = null;

	private register_confirm: NodeJS.Timeout | null = null;

	private onLogIn: (account: AccountSchema | null) => void;

	state: AccountSidepopState = {
		loading: false,
		register_view: false,//true temporary for tests
		account: null,
		verify_info: false,
		verification_resend: false,
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
				this.email_input.value = 'xxxx@gmail.com';//TODO - remove of course
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
		this.setState({error: msg, loading: false, verify_info: false});
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

	private async tryVerify() {
		if(!this.verification_code_input)
			return;
		let code = this.verification_code_input.value;
		//base64 text verification
		if(!code.match(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i))
			return this.setError( errorMsg(ERROR_CODES.INCORRECT_VERIFICATION_CODE) );

		this.setState({loading: true, error: undefined});

		let res = await Account.verify(code);
		if(res.error)
			return this.setError( errorMsg(res.error) );
		
		this.setState({loading: false, error: undefined, verify_info: true, account: Account.getAccount()});
	}

	private async tryResendVerificationCode() {
		this.setState({loading: true, error: undefined});
		let res = await Account.requestVerificationCode();
		if(res.error) {
			if(res.error === ERROR_CODES.ACCOUNT_ALREADY_VERIFIED)
				this.setState({account: Account.getAccount()});
			return this.setError( errorMsg(res.error) );
		}
		this.setState({loading: false, error: undefined, verification_resend: true});
	}

	private async uploadAvatar(clear = false) {
		try {
			let image_data = clear ? null : await Utils.openImageFile();//URL string

			this.setState({loading: true, error: undefined});

			let res = await Account.uploadAvatar(image_data);
			if(res.error)
				return this.setError( errorMsg(res.error) );

			this.setState({
				loading: false, 
				error: undefined, 
				verification_resend: true,
				account: Account.getAccount()//account data with new avatar
			});
		}
		catch(e) {
			this.setError( errorMsg(e) );
		}
	}

	private clearAvatar() {
		this.uploadAvatar(true);
	}

	private canReturn() {
		return this.state.register_view;
	}

	private return() {
		if(this.state.register_view) {
			this.setState({
				register_view: false, 
				error: undefined, 
				loading: false, 
				verify_info: false, 
				verification_resend: false
			});
			return;
		}
	}

	private removeWhitechars(e: React.ChangeEvent<HTMLInputElement>) {
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
				}} onChange={this.removeWhitechars} maxLength={Config.MAX_LOGIN_LENGTH} name='username'/>
			<input key='login_password' className='fader-in' type='password' placeholder='Password' 
				ref={el => this.password_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13)
						this.tryLogin();
				}} onChange={this.removeWhitechars} maxLength={Config.MAX_PASSWORD_LENGTH} 
				name='password' />
			<button key='login_btn' className='fader-in' style={offsetTop} 
				onClick={this.tryLogin.bind(this)}>LOG IN</button>
			<hr />
			<label key='no_acc_label' className='fader-in'>No account yet?</label>
			<br/>
			<button key='register_view_btn' className='fader-in' style={offsetTop} 
				onClick={() => {
					this.setState({
						register_view: true, error: undefined, loading: false, verify_info: false
					});
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
				}} onChange={this.removeWhitechars} maxLength={Config.MAX_LOGIN_LENGTH} />
			<input key='register_password' className='fader-in' type='password' placeholder='Password' 
				ref={el => this.password_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13 && this.password_confirm_input)
						this.password_confirm_input.focus();
				}} onChange={e => {
					this.checkPasswordsMatch();
					this.removeWhitechars(e);
				}} maxLength={Config.MAX_PASSWORD_LENGTH} />
			<input key='register_password_confirm' className='fader-in' type='password' 
				placeholder='Confirm password' 
				ref={el => this.password_confirm_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13 && this.email_input)
						this.email_input.focus();
				}} onChange={e => {
					this.checkPasswordsMatch();
					this.removeWhitechars(e);
				}} maxLength={Config.MAX_PASSWORD_LENGTH} />
			<input key='email_input' className='fader-in' type='email' name='email'
				placeholder='Email address' 
				ref={el => this.email_input = el} style={offsetTop}
				onKeyDown={e => {
					if(e.keyCode === 13 && this.register_btn) {
						this.register_btn.focus();
						this.tryRegister();
					}
				}} onChange={this.removeWhitechars} maxLength={256} />
			<button key='register_btn' style={offsetTop} className='fader-in'
				ref={el => this.register_btn = el} onClick={this.tryRegister.bind(this)}>CREATE</button>
		</section>;
	}

	private renderVerificationPrompt(account: AccountSchema) {
		return <>
			<hr/>
			<h2 key='not_verified_label' className='error fader-in'>Account is not verified</h2>
			<div key='verification_panel' className='fader-in'>
				<input type='text' placeholder='VERIFICATION CODE' style={{textAlign: 'center'}}
					ref={el => this.verification_code_input = el} onChange={this.removeWhitechars} />
				<button style={offsetTop} onClick={this.tryVerify.bind(this)}>VERIFY</button>
				{this.state.verification_resend ? 
					<div className='success' style={offsetTop}>
						Verification code has been sent. Expect an email soon.
					</div>
					:
					<>
						<p>No code?</p>
						<button onClick={
							this.tryResendVerificationCode.bind(this)}>RESEND VERIFICATION CODE</button>
						<div style={{marginTop: '5px'}}>
							Code will be sent to given email: {account.email}</div>
					</>
				}
			</div>
			<hr/>
		</>;
	}

	private renderAccountData(account: AccountSchema) {
		return <>
			<hr/>
			{this.state.verify_info === true && 
				<h2 key='verified_label' className='success fader-in'>Verification successfull</h2>}
			<div key='account_email' className='fader-in account-details'>
				<label>Email:</label><div>{account.email}</div>
			</div>
			<hr/>
		</>;
	}

	private renderAccountSection(account: AccountSchema) {
		const no_avatar_style = account.avatar ? {
			backgroundImage: `url(${ServerApi.getAvatarPath(account.avatar)})`,
			backgroundSize: 'contain'
		} : {
			backgroundImage: `url(${no_avatar_img})`,
			backgroundSize: '61%'
		};
		return <section>
			<h1 key='welcome-key' className='fader-in welcomer'>
				<span>Welcome {account.username}</span>
				<div className='avatar-choser' style={account.avatar ? {} : {
					backgroundColor: '#90A4AE',
					boxShadow: '0px 2px 4px #0008'
				}}>
					<div key={account.avatar || 'no-avatar'} 
						className='avatar' style={no_avatar_style}></div>
					{
						account.avatar ? <button className='avatar-select-btn'
							onClick={this.clearAvatar.bind(this)}>CLEAR</button> 
						:
						<button className='avatar-select-btn' 
							onClick={() => this.uploadAvatar()}>
							UPLOAD<br/>({Config.MAXIMUM_IMAGE_FILE_SIZE/1024/1024}MB&nbsp;>)
						</button>
					}
				</div>
			</h1>
			{account.verified ? this.renderAccountData(account) : this.renderVerificationPrompt(account)}
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