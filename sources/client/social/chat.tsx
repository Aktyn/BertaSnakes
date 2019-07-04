import * as React from 'react';
import {FriendSchema, SocialMessage} from "../../server/database/database";
import Config from '../../common/config';
import Social, {EVENT_NAMES} from './social';

import '../styles/social_chat.scss';
import {pushSocialMessage} from "../../common/social_utils";

//key is a friendship id
let conversations: Map<string, SocialMessage[]> = new Map();

interface ChatProps {
	recipient: FriendSchema;
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
	private readonly chat_message_listener: (data: {friendship_id: string, message: SocialMessage}) => void;
	
	state: ChatState = {
		messages: []
	};
	
	constructor(props: ChatProps) {
		super(props);
		this.chat_message_listener = this.onChatMessage.bind(this);
	}
	
	componentDidMount() {
		Social.on(EVENT_NAMES.ON_CHAT_MESSAGE, this.chat_message_listener);
		
		let current = conversations.get( this.props.recipient.friendship_id );
		if(!current) {
			//TODO: request friendship conversation data from server
		}
		else
			this.setState({messages: current});
	}
	
	componentWillUnmount() {
		Social.off(EVENT_NAMES.ON_CHAT_MESSAGE, this.chat_message_listener);
	}
	
	onChatMessage(data: {friendship_id: string, message: SocialMessage}) {
		if( this.props.recipient.friendship_id !== data.friendship_id )
			return;//does not fit here
		
		console.log( data );
		
		let current = conversations.get(data.friendship_id);
		if(!current) {
			//temporary setState with just received message
			let messages = this.state.messages;
			pushSocialMessage(messages, data.message);
			this.setState({messages});
			return;
		}
		
		pushSocialMessage(current, data.message);
		this.setState({messages: current});
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
	
	render() {
		return <div className={'social-chat'} style={{
			height: this.props.height + 'px'
		}}>
			<div className={'messages'}>
				{new Array(100).fill(0).map((_, index) => {
					return <div key={index}>test message</div>;
				})}
			</div>
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