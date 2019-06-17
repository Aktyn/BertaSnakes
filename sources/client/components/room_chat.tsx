import * as React from 'react';

import RoomInfo from '../../common/room_info';
import UserInfo from '../../common/user_info';
import Network from '../game/engine/network';

import UserBtn from './user_btn';

import '../styles/room_chat.scss';

interface RoomChatProps {
	room: RoomInfo;
	current_user: UserInfo | null;
}

interface RoomChatState {
	hide_chat: boolean;
	kicking_user: number;//stores user.id for kicking confirmation
}

export default class RoomChat extends React.Component<RoomChatProps, RoomChatState> {
	state: RoomChatState = {
		hide_chat: true,
		kicking_user: 0//no one has id == 0 so it's ok
	}

	constructor(props: RoomChatProps) {
		super(props);
	}

	renderUsersList() {
		let owner = this.props.room.getOwner();
		let am_i_owner = this.props.current_user && owner && owner.id === this.props.current_user.id;
		return this.props.room.mapUsers((user, index) => {
			//i am owner and this user is not me
			let can_be_kicked = am_i_owner && this.props.current_user && 
				this.props.current_user.id !== user.id;
			return <div key={index}>
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
					}}></button>}
			</div>;
		});
	}

	render() {
		return <div className={`${this.state.hide_chat ? 'hidden ' : ''}room-chat`}>
			<nav>
				<button className='rooms-chat-toggler glossy no-icon' onClick={() => {
					this.setState({hide_chat: !this.state.hide_chat});
				}}>{this.state.hide_chat ? 'SHOW' : 'HIDE'}</button>
			</nav>
			<section className='users-list' onMouseLeave={() => {
				this.setState({kicking_user: 0});
			}}>{this.renderUsersList()}</section>
			<section className='room-chat-main'>
				<div className='messages-container'>
					TODO - messages
				</div>
				<div className='bottom'>
					<input type='text' placeholder='Type message' />
					<button>SEND</button>
				</div>
			</section>
		</div>;
	}
}