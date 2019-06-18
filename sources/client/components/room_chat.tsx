import * as React from 'react';

import RoomInfo from '../../common/room_info';
import UserInfo from '../../common/user_info';
import Network from '../game/engine/network';

import ServerApi from '../utils/server_api';

import UserBtn from './user_btn';

import '../styles/room_chat.scss';

interface MessageSchema {
	author: UserInfo;
	timestamp: number;
	content: string[];
}

interface RoomChatProps {
	room: RoomInfo;
	current_user: UserInfo | null;
}

interface RoomChatState {
	hide_chat: boolean;
	kicking_user: number;//stores user.id for kicking confirmation
	messages: MessageSchema[];
}

function formatMessage(msg: string) {
	return msg.trim();
}

function formatTime(timestamp: number) {
	let dt = new Date(timestamp);
	let h = dt.getHours();
	let m = dt.getMinutes();
	return `${h < 10 ? '0':''}${h}:${m < 10 ? '0':''}${m}`;
}

export default class RoomChat extends React.Component<RoomChatProps, RoomChatState> {
	private chat_input: HTMLInputElement | null = null;

	state: RoomChatState = {
		hide_chat: true,
		kicking_user: 0,//no one has id == 0 so it's ok
		messages: []
	}

	constructor(props: RoomChatProps) {
		super(props);
	}

	componentDidMount() {
		//test
		if(!this.chat_input)
			return;
		this.chat_input.value = 'Test message';
		this.send();
	}

	renderUsersList() {
		let owner = this.props.room.getOwner();
		let am_i_owner = this.props.current_user && owner && owner.id === this.props.current_user.id;
		return this.props.room.mapUsers((user, index) => {
			//i am owner and this user is not me
			let can_be_kicked = am_i_owner && this.props.current_user && 
				this.props.current_user.id !== user.id;

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
					}}></button>}
			</div>;
		});
	}

	private getPreviousMsgIndex(timestamp: number) {
		for(let i=this.state.messages.length-1; i>=0; i--) {
			if(this.state.messages[i].timestamp < timestamp)
				return i;
		}

		return -1;
	}

	private pushMessage(msg: MessageSchema) {//TODO: make public
		let last_i = this.getPreviousMsgIndex(msg.timestamp);
		let messages = this.state.messages;

		//same user wrote again since last message
		if(last_i !== -1 && messages[last_i].author.id === msg.author.id)
			messages[last_i].content.push(...msg.content);
		else {//adding new message
			messages.splice(last_i+1, 0, msg);
		}
		this.setState({messages});
	}

	private send() {
		if(!this.chat_input || !this.props.current_user)
			return;
		let msg = formatMessage( this.chat_input.value );
		if(msg.length < 1)
			return;

		console.log(msg);

		this.chat_input.value = '';

		//just for tests:
		this.pushMessage({
			author: this.props.current_user,
			timestamp: Date.now(),//TODO - set timestamp server-side
			content: [msg]
		});
	}

	private renderMessage(msg: MessageSchema) {
		return <div key={msg.timestamp}>
			<img src={ServerApi.getAvatarPath(msg.author.avatar)} />
			<div>
				<label>
					<strong>{msg.author.nick}</strong>
					<span>{formatTime(msg.timestamp)}</span>
				</label>
				{msg.content.map((line, line_i) => {
					return <div key={line_i}>{line}</div>;
				})}
			</div>
		</div>;
	}

	render() {
		return <div className={`${this.state.hide_chat ? 'hidden ' : ''}room-chat-container`}>
			<div className='room-chat-body'>
				<nav>
					<button className='rooms-chat-toggler glossy no-icon' onClick={() => {
						this.setState({hide_chat: !this.state.hide_chat});
					}}>{this.state.hide_chat ? 'SHOW' : 'HIDE'}</button>
				</nav>
				<section className='users-list' onMouseLeave={() => {
					this.setState({kicking_user: 0});
				}}>{this.renderUsersList()}</section>
				<section className='room-chat-main'>
					<div className='messages-container'>{this.state.messages.map(this.renderMessage.bind(this))}</div>
					<div className='bottom'>
						<input type='text' placeholder='Type message' ref={el => this.chat_input = el}
							onKeyDown={e => {
								if(e.keyCode === 13)
									this.send();
							}} maxLength={2048} />
						<button className='send-btn' onClick={this.send.bind(this)}></button>
					</div>
				</section>
			</div>
		</div>;
	}
}