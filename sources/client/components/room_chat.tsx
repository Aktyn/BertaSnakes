import * as React from 'react';

import UserInfo from '../../common/user_info';
import Config from '../../common/config';
import Network from '../game/engine/network';

import ServerApi from '../utils/server_api';
import Utils from '../utils/utils';

import '../styles/room_chat.scss';

export interface MessageSchema {
	author: UserInfo;
	timestamp: number;
	content: string[];
}

interface RoomChatProps {
	current_user: UserInfo | null;
}

interface RoomChatState {
	messages: MessageSchema[];
	spam_warning: boolean;
}

function formatMessage(msg: string) {
	return msg.trim();
}

export default class RoomChat extends React.Component<RoomChatProps, RoomChatState> {
	private chat_input: HTMLInputElement | null = null;
	private messages_container: HTMLDivElement | null = null;
	private spam_warning_tm: NodeJS.Timeout | null = null;

	private sticks = true;

	state: RoomChatState = {
		messages: [],
		spam_warning: false
	};

	constructor(props: RoomChatProps) {
		super(props);
	}

	componentWillUnmount() {
		if(this.spam_warning_tm)
			clearTimeout(this.spam_warning_tm);
	}
	
	componentDidUpdate() {
		if(this.sticks && this.messages_container) {
			this.messages_container.scrollTop = 
				this.messages_container.scrollHeight + this.messages_container.clientHeight;
		}
	}

	private getPreviousMsgIndex(timestamp: number) {
		for(let i=this.state.messages.length-1; i>=0; i--) {
			if(this.state.messages[i].timestamp < timestamp)
				return i;
		}

		return -1;
	}

	public pushMessage(msg: MessageSchema) {
		let last_i = this.getPreviousMsgIndex(msg.timestamp);
		let messages = this.state.messages;

		//same user wrote again since last message
		if(last_i !== -1 && messages[last_i].author.id === msg.author.id)
			messages[last_i].content.push(...msg.content);
		else//adding new message
			messages.splice(last_i+1, 0, msg);
		this.setState({messages});
	}
	
	public spamWarning() {
		this.setState({spam_warning: true});
		if(this.spam_warning_tm)
			clearTimeout(this.spam_warning_tm);
		this.spam_warning_tm = setTimeout(() => {
			this.setState({spam_warning: false});
			this.spam_warning_tm = null;
		}, 5000) as never;
	}

	private send() {
		if(!this.chat_input || !this.props.current_user)
			return;
		let msg = formatMessage( this.chat_input.value );
		if(msg.length < 1)
			return;

		//console.log(msg);

		Network.sendRoomChatMessage(msg);

		this.chat_input.value = '';
	}

	private static renderMessage(msg: MessageSchema) {
		return <div key={msg.timestamp}>
			<img src={ServerApi.getAvatarPath(msg.author.avatar)} alt='avatar' />
			<div>
				<label>
					<strong>{Utils.trimString(msg.author.nick, 15)}</strong>
					<span>{Utils.formatTime(msg.timestamp)}</span>
				</label>
				{msg.content.map((line, line_i) => {
					return <div key={line_i}>{line}</div>;
				})}
			</div>
		</div>;
	}

	render() {
		return <section className='room-chat-main'>
			<div className='messages-container' onScroll={() => {
				if(!this.messages_container)
					return;
				this.sticks = this.messages_container.clientHeight + 
					this.messages_container.scrollTop+32 >= this.messages_container.scrollHeight;
			}} onClick={() => {
				if(this.messages_container) {
					let selection = window.getSelection();
					if( selection && selection.toString().length > 0 )
						return;
				}
				if(this.chat_input)
					this.chat_input.focus();
			}} ref={el => this.messages_container = el}>
				{this.state.messages.map(RoomChat.renderMessage.bind(this))}
				{this.state.spam_warning &&
					<div className={'spam-warning'}>You are sending messages too fast.<br/>Calm down.</div>}
			</div>
			<div className='bottom'>
				<input type='text' placeholder='Type message' ref={el => this.chat_input = el}
					onKeyDown={e => {
						if(e.keyCode === 13)
							this.send();
						e.stopPropagation();
					}} maxLength={Config.MAXIMUM_MESSAGE_LENGTH} />
				<button className='send-btn' onClick={this.send.bind(this)}/>
			</div>
		</section>;
	}
}