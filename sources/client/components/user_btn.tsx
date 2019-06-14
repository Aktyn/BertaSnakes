import * as React from 'react';
import UserInfo from '../../common/user_info';
import AccountSidepop from './sidepops/account_sidepop';
import ServerApi from '../utils/server_api';
import Network from '../game/engine/network';

import '../styles/user_btn.scss';
const no_avatar_img = require('../img/icons/account.svg');

interface UserBtnProps {
	user: UserInfo | null;
}

interface UserBtnState {
	show_sidepop: boolean;
}

export default class extends React.Component<UserBtnProps, UserBtnState> {
	state: UserBtnState = {
		show_sidepop: false
	}

	constructor(props: any) {
		super(props);
	}

	renderUserBtn(user: UserInfo) {
		if(user.isGuest())
			return user.nick;

		return <>
			<img src={user.avatar ? ServerApi.getAvatarPath(user.avatar) : no_avatar_img} />
			<span>{user.nick}</span>
			<span className='separator' style={{marginTop: '-1px'}}></span>
			<span>{user.rank}</span>
			<span className='separator' style={{marginTop: '-1px'}}></span>
			<span>Lv. {user.level}</span>
		</>
	}

	render() {
		return <>
			<button className='user-btn' onClick={() => this.setState({show_sidepop: true})}>
				{this.props.user ? 
					this.renderUserBtn(this.props.user) : 'OFFLINE'
				}
			</button>
			{this.state.show_sidepop && <AccountSidepop 
			onClose={() => {
				this.setState({show_sidepop: false});
				Network.requestAccountData();
			}} />}
		</>;
	}
}