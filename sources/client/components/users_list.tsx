import * as React from 'react';

import RoomInfo from '../../common/room_info';
import UserInfo from '../../common/user_info';
import Network from '../game/engine/network';
import UserBtn from './widgets/user_btn';

import '../styles/users_list.scss';

interface UsersListProps {
	room: RoomInfo;
	current_user: UserInfo | null;
	disable_players_kicking: boolean;
}

interface UsersListState {
	kicking_user: number;//stores user.id for kicking confirmation
}

export default class UsersList extends React.Component<UsersListProps, UsersListState> {
	static defaultProps = {
		disable_players_kicking: false
	};
	
	state: UsersListState = {
		kicking_user: 0,//no one has id == 0 so it's ok
	};

	constructor(props: UsersListProps) {
		super(props);
	}

	render() {
		let owner = this.props.room.getOwner();
		let am_i_owner = this.props.current_user && owner && owner.id === this.props.current_user.id;
		return <section className='users-list' onMouseLeave={() => {
			this.setState({kicking_user: 0});
		}}>{this.props.room.mapUsers((user) => {
			//i am owner and this user is not me and it is not a player
			let can_be_kicked = am_i_owner && this.props.current_user && 
				this.props.current_user.id !== user.id &&
				!(this.props.disable_players_kicking && this.props.room.isUserSitting(user.id));

			return <div key={user.id}>
				<UserBtn user={user} />
				{can_be_kicked && <button className='kick-btn'
					data-text={this.state.kicking_user === user.id ? 'YOU SURE?' : 'KICK USER?'} 
					onClick={() => {
						if(this.state.kicking_user === user.id) {
							Network.kickUser(user.id);
							this.setState({kicking_user: 0});
						}
						else
							this.setState({kicking_user: user.id});
					}}/>}
			</div>;
		})}</section>;
	}
}