import * as React from 'react';
import {AccountSchema, FriendSchema, SocialMessage} from "../../server/database/database";
import Config from '../../common/config';
import Social, {EVENT_NAMES} from './social';
import {pushSocialMessage} from "../../common/social_utils";
import Utils from '../utils/utils';
import ServerApi from '../utils/server_api';
import NotificationsIndicator, {COMMON_LABELS, NotificationSchema} from '../components/widgets/notifications_indicator';
import UserSidepop from '../components/sidepops/user_sidepop';

import '../styles/social_chat.scss';

//key is a friendship id
let conversations: Map<string, SocialMessage[]> = new Map();
let last_pushed_message_id = '';
let chat_instances: Chat[] = [];

function waitForSocialToLoad() {
	if(typeof Social === 'undefined') {
		setTimeout(waitForSocialToLoad, 100);
		return;
	}
	
	Social.on(EVENT_NAMES.ON_DISCONNECT, () => {
		conversations.clear();
		console.log('conversations data cleared');
	});
	
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
			
			let friendship = Social.getFriendByFriendshipID(friendship_id);
			if(friendship) {
				NotificationsIndicator.push({
					content: Chat.getNotificationText(friendship.friend_data.username),
					custom_data: {user_id: friendship.friend_data.id},
					render: (custom_data, onClose) => {
						return <UserSidepop account_id={custom_data.user_id} onClose={onClose} focus_chat={true} />;
					}
				} as NotificationSchema<{ user_id: string }>);
			}
		}
		else if( document.visibilityState !== 'visible' ) {//force title notification even if chat is open
			let friendship = Social.getFriendByFriendshipID(friendship_id);
			if(friendship)
				document.title = Chat.getNotificationText(friendship.friend_data.username);
		}
	});
}
waitForSocialToLoad();

// noinspection RegExpRedundantEscape
const url_regex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);

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
	minHeight: number ;//default chat height in pixels
	autofocus: boolean;
}

interface ChatState {
	messages: SocialMessage[];
	spam_warning: boolean;
}

export default class Chat extends React.Component<ChatProps, ChatState> {
	static defaultProps: Partial<ChatProps> = {
		minHeight: 300,
		autofocus: false,
	};
	
	public static getNotificationText(username: string) {
		return COMMON_LABELS.CHAT_MESSAGE + Utils.trimString(username, 15)
	}
	
	private chat_input: HTMLInputElement | null = null;
	private messages_container: HTMLDivElement | null = null;
	private readonly conversation_data_listener: (conversation: ConversationEvent | null) => void;
	private readonly spam_warning_listener: () => void;
	
	private spam_warning_tm: NodeJS.Timeout | null = null;
	
	private sticks = true;
	
	state: ChatState = {
		messages: [],
		spam_warning: false
	};
	
	constructor(props: ChatProps) {
		super(props);
		this.conversation_data_listener = this.onConversationData.bind(this);
		this.spam_warning_listener = this.onSpamWarning.bind(this);
	}
	
	componentDidMount() {
		chat_instances.push(this);
		Social.on(EVENT_NAMES.ON_CONVERSATION_DATA, this.conversation_data_listener);
		Social.on(EVENT_NAMES.ON_SPAM_WARNING, this.spam_warning_listener);
		
		let current = conversations.get( this.props.recipient.friendship_id );
		if(!current)
			Social.requestFriendshipConversationData( this.props.recipient.friendship_id );
		else
			this.setState({messages: current});
		
		//mark notification as read
		let marked = NotificationsIndicator.close(
			Chat.getNotificationText(this.props.recipient.friend_data.username));
		
		if(this.chat_input && (this.props.autofocus || marked))
			this.chat_input.focus();
	}
	
	componentWillUnmount() {
		let i = chat_instances.indexOf(this);
		if(i !== -1)
			chat_instances.splice(i, 1);
		
		Social.off(EVENT_NAMES.ON_CONVERSATION_DATA, this.conversation_data_listener);
		Social.off(EVENT_NAMES.ON_SPAM_WARNING, this.spam_warning_listener);
		
		if(this.spam_warning_tm)
			clearTimeout(this.spam_warning_tm);
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
		
		/*console.log( conversation_data.conversation.reduce((prev, curr) => {
			prev.content = prev.content.concat(curr.content);
			return prev;
		}).content.length );*/
		
		//NOTE: there is assumption here that there are fever current messages that in conversation
		//so we are pushing current messages into just received conversation
		/*for(let msg of this.state.messages)
			pushSocialMessage(conversation_data.conversation, msg);
		conversations.set(conversation_data.friendship_id, conversation_data.conversation);
		this.setState({messages: conversation_data.conversation});*///and set updated conversation in chat state
		
		let messages = this.state.messages;
		conversations.set(conversation_data.friendship_id, messages);
		
		const chunk = 64;
		let pushChunk = (index: number) => {
			for(let i=index; i<index+chunk; i++) {
				if(i >= conversation_data.conversation.length) {
					this.setState({messages});
					return;
				}
				pushSocialMessage(messages, conversation_data.conversation[i]);
			}
			//this.setState({messages});
			setTimeout(pushChunk,16,index+chunk);
		};
		pushChunk(0);
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
	
	private onSpamWarning() {
		this.setState({spam_warning: true});
		if(this.spam_warning_tm)
			clearTimeout(this.spam_warning_tm);
		this.spam_warning_tm = setTimeout(() => {
			this.setState({spam_warning: false});
			this.spam_warning_tm = null;
		}, 5000) as never;
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
	
	private static renderLinkMessage(line: string, line_i: number, links: string[]) {
		let texts: string[] = [];
		for(let match of links) {
			let split = line.split(match);
			texts.push( split.shift() || '' );
			line = split.join('');
		}
		texts.push(line);
		
		return <div key={line_i}>{texts.map((text, index) => {
			if(!links)
				return undefined;
			return <React.Fragment key={index}>
				<span>{text}</span>
				{links[index] &&
					<a href={links[index]} target={'_blank'}>{
						links[index].replace(/^https?:\/\/(www\.)?/i, '')
					}</a>
				}
			</React.Fragment>;
		})}</div>;
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
						let link_matches = line.match(url_regex);
						if( link_matches )
							return Chat.renderLinkMessage(line, line_i, link_matches);
						return <div key={line_i}>{line}</div>;
					})}
				</div>
			</div>;
		});
	}
	
	render() {
		return <div className={'social-chat'} style={{
			minHeight: this.props.minHeight
		}}>
			<div className={'messages'} onClick={() => {
				if(this.messages_container) {
					if( window.getSelection().toString().length > 0 )
						return;
				}
				if(this.chat_input)
					this.chat_input.focus();
			}} onScroll={() => {
				if(!this.messages_container)
					return;
				this.sticks = this.messages_container.clientHeight +
					this.messages_container.scrollTop+32 >= this.messages_container.scrollHeight;
			}} ref={el => this.messages_container = el}>
				{this.renderMessages()}
				{this.state.spam_warning &&
					<div className={'spam-warning'}>You are sending messages to fast. Calm down.</div>}
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