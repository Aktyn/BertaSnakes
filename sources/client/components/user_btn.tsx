import * as React from 'react';
import UserInfo from '../../common/user_info';
import AccountSidepop from './sidepops/account_sidepop';
import UserSidepop from './sidepops/user_sidepop';
import ServerApi from '../utils/server_api';
import Network from '../game/engine/network';
import Utils from '../utils/utils';

import '../styles/user_btn.scss';

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

	private canOpenDetails() {
		if( !this.props.user )
			return false;
		if(this.props.user.account_id)
			return true;
		let current = Network.getCurrentUser();
		return (current && current.id === this.props.user.id);
	}

	renderUserBtn(user: UserInfo) {
		if(user.isGuest())
			return user.nick;

		return <>
			<img src={ServerApi.getAvatarPath(user.avatar)} />
			<span>{Utils.trimString(user.nick, 12)}</span>
			<span className='separator' style={{marginTop: '-1px'}}></span>
			<span>{user.rank}</span>
			<span className='separator' style={{marginTop: '-1px'}}></span>
			<span>Lv. {user.level}</span>
		</>
	}

	renderSidepop() {
		let current = Network.getCurrentUser();
		if( !current || !this.props.user )//offline user cannot see other users
			return undefined;

		if(current.id === this.props.user.id) {//show self account data
			return <AccountSidepop onClose={() => {
				this.setState({show_sidepop: false});
				Network.requestAccountData();
			}} />;
		}

		if(typeof this.props.user.account_id === 'string')//show other account data
			return <UserSidepop account_id={this.props.user.account_id} onClose={() => {
				this.setState({show_sidepop: false});
			}} />

		return undefined;
	}

	render() {
		return <>
			<button className={`user-btn${this.canOpenDetails() ? '' : ' disabled'}`} 
				onClick={() => this.setState({show_sidepop: true})}>
				{this.props.user ? 
					this.renderUserBtn(this.props.user) : 'OFFLINE'
				}
			</button>
			{this.state.show_sidepop && this.renderSidepop()}
		</>;
	}
}