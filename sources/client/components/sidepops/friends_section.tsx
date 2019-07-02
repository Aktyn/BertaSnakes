import * as React from 'react';
import Account from '../../account';
import ServerApi from '../../utils/server_api';
import ERROR_CODES from "../../../common/error_codes";
import {PublicAccountSchema} from '../../../server/database';
import UserSidepop from './user_sidepop';

import '../../styles/friends_section.scss';

interface FriendsSectionProps {
	onError: (code: ERROR_CODES) => void;
}

interface FriendsSectionState {
	friends: PublicAccountSchema[],
	selected_player?: string
}

export default class FriendsSection extends React.Component<FriendsSectionProps, FriendsSectionState> {
	
	state: FriendsSectionState = {
		friends: []
	};
	
	componentDidMount() {
		this.load().catch(console.error);
	}
	
	private async load() {
		let res = await Account.getFriendsList();
		if(res.error !== ERROR_CODES.SUCCESS)
			return this.props.onError(res.error);
		
		if( !Array.isArray(res.friends) )
			return this.props.onError(ERROR_CODES.INCORRECT_SERVER_RESPONSE);
		
		this.setState({friends: res.friends});
	}
	
	private renderFriendsList() {
		return this.state.friends.map((friend, index) => {
			return <button onClick={() => {
				this.setState({selected_player: friend.id});
			}} key={/*TODO: restore friend.id key*/index}>
				<img src={ServerApi.getAvatarPath(friend.avatar)} alt={'friend\'s avatar'} />
				<span>{friend.username}</span>
			</button>;
		});
	}
	
	render() {
		return <section className={'friends-section'}>
			<h1 key={'login_h'} className='fader-in'>Friends</h1>
			<div className={'friends-list fader-in'}>{
				this.state.friends.length > 0 ? this.renderFriendsList() : <span>No friends yet.</span>
			}</div>
			{this.state.selected_player &&
				<UserSidepop account_id={this.state.selected_player} onClose={() => {
					this.setState({selected_player: undefined});
				}} />
			}
		</section>;
	}
}