import * as React from 'react';
// import { Link } from 'react-router-dom';

import Account from '../account';
import ServerAPi from '../utils/server_api';

import AccountSidepop from './sidepops/account_sidepop';

import './../styles/account_widget.scss';
const no_avatar = require('../img/icons/account.svg');

interface AccountWidgetState {
	show_sidepop: boolean;
}

export default class AccountWidget extends React.Component<any, AccountWidgetState> {

	state: AccountWidgetState = {
		show_sidepop: false
	}

	private onLogIn: () => void;

	constructor(props: any) {
		super(props);

		this.onLogIn = () => this.forceUpdate();
	}

	componentDidMount() {
		Account.addLoginListener( this.onLogIn );
	}

	componentWillUnmount() {
		Account.removeLoginListener( this.onLogIn );
	}

	render() {
		let acc = Account.getAccount();
		return <div className='account-widget'>
			<div className='account-widget-content' onClick={() => this.setState({show_sidepop: true})}>
				<div className={`indicator ${acc ? '' : 'no-account'}`}>
					{acc ? <span className={`avatar-circle ${!acc || !acc.avatar ? 'empty' : ''}`}>
						<img src={acc.avatar ? 
						ServerAPi.getAvatarPath(acc.avatar) : no_avatar} /></span> : 
						<button>LOG IN</button>}
				</div>
			</div>
			{this.state.show_sidepop && <AccountSidepop onClose={() => {
				this.setState({show_sidepop: false});
			}} />}
		</div>;
	}
}