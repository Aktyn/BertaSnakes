import * as React from 'react';
import SidepopBase, {SidepopProps} from './sidepop_base';
import ServerApi from '../../utils/server_api';

import Utils from '../../utils/utils';
import Account, {AccountSchema} from '../../account';
import Config, { CoinPackSchema } from '../../../common/config';
import ERROR_CODES, {errorMsg} from '../../../common/error_codes';
import {PLAYER_TYPES} from "../../../common/game/objects/player";
import {SkillData} from "../../../common/game/common/skills";

//sections
import RegisterSection from './register_section';
import LoginSection from './login_section';
import AccountSection from "./account_section";
import GamesSection from "./games_section";
import ShopSection from "./shop_section";
import FriendsSection from "./friends_section";
import PasswordResetSection from "./password_reset_section";

import '../../styles/account_sidepop.scss';

export const enum VIEWS {//avoid 0 so this enum contains only truthy values
	GENERAL = 1,
	REGISTER,
	PASSWORD_RESET,
	SHOP,
	FRIENDS,
	GAMES
}

const enum MERCHANDISE_TYPE {
	SHIP,
	SKILL
}

interface AccountSidepopProps extends SidepopProps {
	force_view?: VIEWS;
}

interface AccountSidepopState {
	loading: boolean;
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
	
	private games_section: GamesSection | null = null;
	private shop_section: ShopSection | null = null;

	private register_confirm: NodeJS.Timeout | null = null;
	private clear_avatar_confirm: NodeJS.Timeout | null = null;

	private readonly onLogIn: (account: AccountSchema | null) => void;

	state: AccountSidepopState = {
		loading: false,
		view: VIEWS.SHOP,//GENERAL
		account: null,
		verify_info: false,
		verification_resend: false,
	};

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
				this.username_input.value = 'tester';
				//@ts-ignore
				this.password_input.value = 'password';
				//@ts-ignore
				this.password_confirm_input.value = 'password';
				//@ts-ignore
				this.email_input.value = 'xxxx@gmail.com';
			}
			catch(e) {}
		}

		(async () => {
			if( !await ServerApi.pingServer() )
				this.setError('Server is not available');
		})();
	}

	componentWillUnmount() {
		Account.removeLoginListener( this.onLogIn );
		for(let timeout of [this.register_confirm, this.clear_avatar_confirm]) {
			if(timeout)
				clearTimeout(timeout);
		}
	}

	private setError(msg?: string) {
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

		if(nick.length < Config.MIN_LOGIN_LENGTH) {
			this.username_input.focus();
			return this.setError('Username must be at least 3 characters long');
		}
		if(password.length < Config.MIN_PASSWORD_LENGTH) {
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
	
	private async updateSetup(ship_type: PLAYER_TYPES, skillsbar: (number | null)[]) {
		//update gui from local data instead of waiting for server response
		this.setState({account: this.state.account});
		
		let res = await Account.updateSetup(ship_type, skillsbar);
		if(res.error)
			return this.setError( errorMsg(res.error) );
		this.setState({error: undefined, account: Account.getAccount()});
	}
	
	private async buyMerchandise(request:
		                             {type: MERCHANDISE_TYPE.SHIP, ship_type: number} |
		                             {type: MERCHANDISE_TYPE.SKILL, skill: SkillData})
	{
		this.setState({loading: true, error: undefined});
		
		let res;
		switch (request.type) {
			case MERCHANDISE_TYPE.SHIP:
				res = await Account.buyShip(request.ship_type);
				break;
			case MERCHANDISE_TYPE.SKILL:
				res = await Account.buySkill(request.skill.id);
				break;
		}
		if(res.error)
			return this.setError( errorMsg(res.error) );
		
		this.setState({loading: false, error: undefined, account: Account.getAccount()});
		
		if(this.shop_section)
			this.shop_section.onTransactionSuccess();
	}
	
	private async buyShip(type: number) {
		this.buyMerchandise({type: MERCHANDISE_TYPE.SHIP, ship_type: type});
	}
	
	private async buySkill(skill: SkillData) {
		this.buyMerchandise({type: MERCHANDISE_TYPE.SKILL, skill: skill});
	}
	
	private async buyCoins(pack: CoinPackSchema, currency: string) {
		console.log('Buying coins pack:', pack);
		
		try {
			this.setState({loading: true, error: undefined});
			
			if( !Account.getAccount() )
				return this.setError( errorMsg(ERROR_CODES.NOT_LOGGED_IN) );
			let res = await ServerApi.postRequest('/purchase_coins', {
				token: Account.getToken(),
				coins: pack.coins,
				currency
			});
		
			console.log(res);
			
			if(res.error)
				return this.setError( errorMsg(res.error) );
			if(!res.approval_url)
				return this.setError( errorMsg(ERROR_CODES.INCORRECT_SERVER_RESPONSE) );
			
			if(this.shop_section)
				this.shop_section.onRedirecting(res.approval_url);
			else
				throw new Error('No shop section');
			//setTimeout(() => location.replace( res.approval_url ), 16);
			
			this.setState({loading: false, error: undefined});
		}
		catch(e) {
			this.setError( errorMsg(ERROR_CODES.SERVER_UNREACHABLE) );
		}
	}

	private async uploadAvatar(clear = false) {
		try {
			let image_data = clear ? null : await Utils.openImageFile();//URL string

			this.setState({loading: true, error: undefined});

			let res = await Account.uploadAvatar(image_data);
			if(res.error) {
				this.setError(errorMsg(res.error));
				return;
			}

			ServerApi.forceNewSalt();

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
		
		this.uploadAvatar(true).catch(console.error);
	}
	
	private changeView(view: VIEWS) {
		this.setState({
			view,
			error: undefined,
			loading: false,
			verify_info: false,
			verification_resend: false
		});
	}

	private canReturn() {
		//return this.state.register_view;
		return this.state.view !== VIEWS.GENERAL && this.props.force_view === undefined;
	}

	private return() {
		if( this.games_section && this.games_section.isGameFocused() ) {
			this.games_section.defocusGame();
			return;
		}
		//if(this.state.register_view) {
		if(this.state.view !== VIEWS.GENERAL) {
			this.changeView(VIEWS.GENERAL);
			return;
		}
	}

	private _renderAccountSection(account: AccountSchema) {
		return <AccountSection self={this} account={account} clearAvatar={this.clearAvatar.bind(this)}
			uploadAvatar={this.uploadAvatar.bind(this)} tryVerify={this.tryVerify.bind(this)}
			tryResendVerificationCode={this.tryResendVerificationCode.bind(this)}
			updateSetup={this.updateSetup.bind(this)} />;
	}

	private renderView(view: VIEWS) {
		if(this.props.force_view !== undefined)
			view = this.props.force_view;
		switch(view) {
			default:
			case VIEWS.GENERAL: {
				if(this.state.account)
					return this._renderAccountSection(this.state.account);
			} break;

			case VIEWS.REGISTER: {
				if(this.state.account) {//redirect when user is logged in
					this.state.view = VIEWS.GENERAL;
					return this._renderAccountSection(this.state.account);
				}
				return <RegisterSection self={this} tryRegister={this.tryRegister.bind(this)} />;
			}
			
			case VIEWS.PASSWORD_RESET:
				return <PasswordResetSection onError={msg => this.setError(msg)} onBackToLogin={() => {
					this.changeView(VIEWS.GENERAL);
				}} />;

			case VIEWS.FRIENDS:
				return <FriendsSection onError={code => this.setError(errorMsg(code))} />;

			case VIEWS.SHOP:
				if(this.state.account) {
					return <ShopSection ref={el => this.shop_section = el} account={this.state.account}
					    buyShip={this.buyShip.bind(this)} buySkill={this.buySkill.bind(this)}
					    buyCoins={this.buyCoins.bind(this)} onError={msg => this.setError(msg)}/>;
				}
				break;
			case VIEWS.GAMES: {
				if(this.state.account) {
					return <GamesSection account={this.state.account} total_games={this.state.account.total_games}
						onError={code => this.setError(errorMsg(code))} ref={el => this.games_section = el}/>;
				}
			} break;
		}
		return <LoginSection self={this} tryLogin={this.tryLogin.bind(this)} />;
	}

	render() {
		return <SidepopBase onClose={this.props.onClose} show_navigator={true}
			navigator_return={this.canReturn() ? this.return.bind(this) : undefined}
			error={this.state.error} loading={this.state.loading} >
			{this.renderView(this.state.view)}
		</SidepopBase>;
	}
}