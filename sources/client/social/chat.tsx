import * as React from 'react';
import {AccountSchema, FriendSchema, SocialMessage} from "../../server/database/database";
import Config from '../../common/config';
import Social, {EVENT_NAMES} from './social';
import {pushSocialMessage} from "../../common/social_utils";
import Utils from '../utils/utils';
import ServerApi from '../utils/server_api';

import '../styles/social_chat.scss';

//key is a friendship id
let conversations: Map<string, SocialMessage[]> = new Map();
setTimeout(() => {//fix for EVENT_NAMES not defined
	Social.on(EVENT_NAMES.ON_DISCONNECT, () => {
		conversations.clear();
		console.log('conversations data cleared');
	});
}, 1);
let last_pushed_message_id = '';

let chat_instances: Chat[] = [];

Social.on(EVENT_NAMES.ON_CHAT_MESSAGE, ({friendship_id, message}: ChatMessageEvent) => {
	let handled = false;
	for(let chat of chat_instances) {
		if( chat.onChatMessage(friendship_id, message) )
			handled = true;
	}
	
	//update cached conversation when there is no chat widget to handle it
	if( !handled ) {
		let current = conversations.get(friendship_id);
		if (current)
			pushSocialMessage(current, message);
		
		//TODO: quick notification
	}
});

export interface ChatMessageEvent {
	friendship_id: string,
	message: SocialMessage
}

interface ConversationEvent {
	friendship_id: string;
	conversation: SocialMessage[];
}

interface ChatProps {
	recipient: FriendSchema;
	account: AccountSchema;
	height: number;//default chat height in pixels
}

interface ChatState {
	messages: SocialMessage[];
}

export default class Chat extends React.Component<ChatProps, ChatState> {
	static defaultProps: Partial<ChatProps> = {
		height: 300
	};
	
	private chat_input: HTMLInputElement | null = null;
	private messages_container: HTMLDivElement | null = null;
	private readonly conversation_data_listener: (conversation: ConversationEvent | null) => void;
	
	private sticks = true;
	
	state: ChatState = {
		messages: []
	};
	
	constructor(props: ChatProps) {
		super(props);
		this.conversation_data_listener = this.onConversationData.bind(this);
	}
	
	componentDidMount() {
		chat_instances.push(this);
		Social.on(EVENT_NAMES.ON_CONVERSATION_DATA, this.conversation_data_listener);
		
		let current = conversations.get( this.props.recipient.friendship_id );
		if(!current)
			Social.requestFriendshipConversationData( this.props.recipient.friendship_id );
		else
			this.setState({messages: current});
	}
	
	componentWillUnmount() {
		let i = chat_instances.indexOf(this);
		if(i !== -1)
			chat_instances.splice(i, 1);
		
		Social.off(EVENT_NAMES.ON_CONVERSATION_DATA, this.conversation_data_listener);
	}
	
	componentDidUpdate() {
		if(this.sticks && this.messages_container) {
			this.messages_container.scrollTop =
				this.messages_container.scrollHeight + this.messages_container.clientHeight;
		}
	}
	
	private onConversationData(conversation_data: ConversationEvent | null) {
		if( !conversation_data || conversation_data.friendship_id !== this.props.recipient.friendship_id )
			return;
		
		//NOTE: there is assumption here that there are fever current messages that in conversation
		//so we are pushing current messages into just received conversation
		for(let msg of this.state.messages)
			pushSocialMessage(conversation_data.conversation, msg);
		conversations.set(conversation_data.friendship_id, conversation_data.conversation);
		this.setState({messages: conversation_data.conversation});//and set updated conversation in chat state
	}
	
	public onChatMessage(friendship_id: string, message: SocialMessage) {
		if( this.props.recipient.friendship_id !== friendship_id )
			return false;//does not fit here
		
		let current = conversations.get(friendship_id);
		if(!current) {
			//temporary setState with just received message
			let messages = this.state.messages;
			pushSocialMessage(messages, message);
			this.setState({messages});
			return true;
		}
		if(last_pushed_message_id !== message.id)
			pushSocialMessage(current, message);
		last_pushed_message_id = message.id;
		this.setState({messages: current});
		
		return true;
	}
	
	private send() {
		if( !this.chat_input )
			return;
		let content = this.chat_input.value.trim();
		if(content.length < 1)
			return;
		//if( !validate(content) )
		//	return;
		Social.sendChatMessage(this.props.recipient.friend_data.id, content);
		this.chat_input.value = '';
	}
	
	private getAuthor(msg: SocialMessage) {
		if(this.props.recipient.is_left !== msg.left)
			return this.props.recipient.friend_data;
		else
			return this.props.account;
	}
	
	private renderMessages() {
		return this.state.messages.map(msg => {
			let author = this.getAuthor(msg);
			return <div key={msg.id}>
				<img src={ServerApi.getAvatarPath(author.avatar)} alt='avatar' />
				<div>
					<label>
						<strong>{Utils.trimString(author.username, 15)}</strong>
						<span>{Utils.formatTime(msg.timestamp)}</span>
					</label>
					{msg.content.map((line, line_i) => {
						return <div key={line_i}>{line}</div>;
					})}
				</div>
			</div>;
		});
	}
	
	render() {
		return <div className={'social-chat'} style={{
			height: this.props.height + 'px'
		}}>
			<div className={'messages'} onClick={() => {
				if(this.chat_input)
					this.chat_input.focus();
			}} onScroll={() => {
				if(!this.messages_container)
					return;
				this.sticks = this.messages_container.clientHeight +
					this.messages_container.scrollTop+32 >= this.messages_container.scrollHeight;
			}} ref={el => this.messages_container = el}>{this.renderMessages()}</div>
			<div className={'bottom'}>
				<input type={'text'} placeholder={'Type your message here'} onKeyDown={e => {
					if(e.keyCode === 13)
						this.send();
					e.stopPropagation();
				}} maxLength={Config.MAXIMUM_MESSAGE_LENGTH} ref={el => this.chat_input = el} />
				<button onClick={this.send.bind(this)} />
			</div>
		</div>;
	}
}