import * as React from 'react';
import SidepopBase, {SidepopProps} from './sidepop_base';
import ServerApi from '../../utils/server_api';
import Loader from '../loader';
import Utils from '../../utils/utils';
import Account, {AccountSchema} from '../../account';
// import {offsetTop, removeWhitechars} from './sidepops_common';
import {errorMsg} from '../../../common/error_codes';
// import Config from '../../../common/config';
import ERROR_CODES from '../../../common/error_codes';

//sections
import renderRegisterSection from './register_section';
import renderAccountSection from './account_section';
import renderLoginSection from './login_section';

import './../../styles/account_sidepop.scss';


export const enum VIEWS {//avoid 0 so this enum contains only truthy values
	GENERAL = 1,
	REGISTER,
	SHOP,
	FRIENDS,
	GAMES
}

interface AccountSidepopProps extends SidepopProps {
	force_view?: VIEWS;
}

interface AccountSidepopState {
	loading: boolean;
	//register_view: boolean;
	view: VIEWS;
	error?: string;
	account: AccountSchema | null;
	verify_info: boolean;
	verification_resend: boolean;
}

export default class AccountSidepop extends React.Component<AccountSidepopProps, AccountSidepopState> {
	public username_input: 		HTMLInputElement | null = null;
	public password_input: 		HTMLInputElement | null = null;
	public password_confirm_input: HTMLInputElement | null = null;
	public email_input: 			HTMLInputElement | null = null;
	public register_btn: 			HTMLButtonElement | null = null;
	public verification_code_input:HTMLInputElement | null = null;
	public clear_avatar_btn:		HTMLButtonElement | null = null;

	private register_confirm: NodeJS.Timeout | null = null;
	private clear_avatar_confirm: NodeJS.Timeout | null = null;

	private onLogIn: (account: AccountSchema | null) => void;

	state: AccountSidepopState = {
		loading: false,
		view: VIEWS.GENERAL,
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
		for(let timeout of [this.register_confirm, this.clear_avatar_confirm]) {
			if(timeout)
				clearTimeout(timeout);
		}
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
		
		this.setState({
			loading: false, 
			error: undefined, 
			verify_info: true, 
			account: Account.getAccount()
		});
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
		if(!this.clear_avatar_confirm) {
			if(this.clear_avatar_btn)
				this.clear_avatar_btn.innerText = 'REMOVE AVATAR?';
			this.clear_avatar_confirm = setTimeout(() => {
				if(this.clear_avatar_btn)
					this.clear_avatar_btn.innerText = 'CLEAR';
				this.clear_avatar_confirm = null;
			}, 5000) as never;
			return;
		}
		
		this.uploadAvatar(true);
	}

	private canReturn() {
		//return this.state.register_view;
		return this.state.view !== VIEWS.GENERAL && this.props.force_view === undefined;
	}

	private return() {
		//if(this.state.register_view) {
		if(this.state.view !== VIEWS.GENERAL) {
			this.setState({
				//register_view: false,
				view: VIEWS.GENERAL,
				error: undefined,
				loading: false,
				verify_info: false,
				verification_resend: false
			});
			return;
		}
	}

	private _renderAccountSection(account: AccountSchema) {
		return renderAccountSection(this, account, 
			this.clearAvatar.bind(this), this.uploadAvatar.bind(this),
			this.tryVerify.bind(this), this.tryResendVerificationCode.bind(this));
	}

	private renderView(view: VIEWS) {
		if(this.props.force_view !== undefined)
			view = this.props.force_view
		switch(view) {
			default:
			case VIEWS.GENERAL: {
				if(this.state.account)
					return this._renderAccountSection(this.state.account);
				else
					return renderLoginSection(this, this.tryLogin.bind(this));
			}

			case VIEWS.REGISTER: {
				if(this.state.account) {//redirect when user is logged in
					this.state.view = VIEWS.GENERAL;
					return this._renderAccountSection(this.state.account);
				}
				return renderRegisterSection(this, this.tryRegister.bind(this));
			}

			case VIEWS.FRIENDS:
				return <section>TODO - friends section</section>;

			case VIEWS.SHOP:
				return <section>
					<h1>💸&nbsp;SHOP&nbsp;💸</h1>
					<span>TODO - shop section</span>
				</section>;

			case VIEWS.GAMES:
				return <section>TODO - games history section</section>;
		}
	}

	render() {
		return <SidepopBase onClose={this.props.onClose} show_navigator={true}
			navigator_return={this.canReturn() ? this.return.bind(this) : undefined} >
			{this.state.loading && <Loader color='#ef5350' />}
			{this.state.error && <div className='error'>{this.state.error}</div>}
			{this.renderView(this.state.view)}
		</SidepopBase>;
	}
}