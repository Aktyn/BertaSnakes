import * as React from 'react';

import PopupBase from './popup_base';
import UserInfo from './../../../../common/user_info';

import Network from './../../engine/network';

export interface UserProfileProps {
	user: UserInfo;
}

export default class extends React.Component<UserProfileProps, any> {

	constructor(props: UserProfileProps) {
		super(props);
	}

	renderLoginOptions(am_i_guest: boolean) {
		if(!am_i_guest) {//only logout button
			return <button>LOGOUT</button>;
		}
		return <label>TODO</label>;
	}

	render() {
		console.log(this.props.user);
		let me = Network.getCurrentUser();
		let is_me = me ? (me.id === this.props.user.id) : false;
		//TODO - user.avatar
		return <PopupBase title={`${this.props.user.nick}' profile`}>
			<div className='overall-info'>
				<label>Rank:</label><span>{this.props.user.rank}</span>
				<label>Level:</label><span>{this.props.user.level}</span>
			</div>
			<hr />
			<div>
				{!is_me && <button onClick={() => {
					//TODO - add chat bookmark and close popup
				}}>Open chat</button>}
			</div>
			{is_me && <>
				<hr />
				<div>{this.renderLoginOptions(!!(me && me.id < 0))}</div>
			</>}
		</PopupBase>;
	}
}