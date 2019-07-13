import * as React from 'react';
import Account from '../../account';
import Social, {EVENT_NAMES, FriendSchema} from '../../social/social';
import ServerApi from '../../utils/server_api';
import ERROR_CODES from "../../../common/error_codes";
import UserSidepop from './user_sidepop';

import '../../styles/friends_section.scss';
import {PublicAccountSchema} from "../../../server/database/database";
import PotentialFriendsTable from "./potential_friends_table";
import NotificationsIndicator, {COMMON_LABELS} from "../widgets/notifications_indicator";

interface FriendsSectionProps {
	onError: (code: ERROR_CODES) => void;
}

interface FriendsSectionState {
	friends: FriendSchema[];
	potential_friends: PublicAccountSchema[];
	selected_player?: string;
}

export default class FriendsSection extends React.Component<FriendsSectionProps, FriendsSectionState> {
	private readonly onSocialUpdate: () => void;
	private readonly onRequestUpdate: () => void;
	
	state: FriendsSectionState = {
		friends: [],
		potential_friends: []
	};
	
	constructor(props: FriendsSectionProps) {
		super(props);
		
		this.onSocialUpdate = this.updateFriendsList.bind(this);
		this.onRequestUpdate = this.updateFriendRequests.bind(this);
	}
	
	componentDidMount() {
		//this.load().catch(console.error);
		this.updateFriendsList();
		this.updateFriendRequests();
		Social.on(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, this.onSocialUpdate);
		Social.on(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, this.onRequestUpdate);
		
		NotificationsIndicator.close(COMMON_LABELS.FRIEND_REQUEST);//friends request are read
		NotificationsIndicator.close(COMMON_LABELS.PENDING_FRIEND_REQUESTS);
	}
	
	componentWillUnmount() {
		Social.off(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, this.onSocialUpdate);
		Social.off(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, this.onRequestUpdate);
	}
	
	private updateFriendsList() {
		if( !Account.getAccount() )
			return this.props.onError(ERROR_CODES.NOT_LOGGED_IN);
		this.setState({friends: Social.getFriendsList()});
	}
	
	private updateFriendRequests() {
		if( !Account.getAccount() )
			return this.props.onError(ERROR_CODES.NOT_LOGGED_IN);
		this.setState({potential_friends: Social.getPotentialFriendsList()});
		NotificationsIndicator.close(COMMON_LABELS.FRIEND_REQUEST);//friends request are read
	}
	
	private renderFriendsList() {
		return this.state.friends.map(({friend_data, online}) => {
			return <button onClick={() => {
				this.setState({selected_player: friend_data.id});
			}} key={friend_data.id}>
				<img src={ServerApi.getAvatarPath(friend_data.avatar)} alt={'friend\'s avatar'} />
				<span>{friend_data.username}</span>
				<span className={'status-indicator'} style={{
					backgroundColor: online ? '#8BC34A' : '#e57373'
				}} />
			</button>;
		});
	}
	
	private renderFriendRequests() {
		return <>
			<label className={'separating-label'}>Pending friend requests</label>
			<div style={{//scroll view
				maxHeight: '50%',
				overflowY: 'auto'
			}}>
				<PotentialFriendsTable users={this.state.potential_friends} />
			</div>
			<hr/>
		</>;
	}
	
	render() {
		return <section className={'friends-section'}>
			<h1 key={'login_h'} className='fader-in'>Friends</h1>
			{
				this.state.potential_friends.length > 0 &&
					<div className={'fader-in'}>{this.renderFriendRequests()}</div>
			}
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