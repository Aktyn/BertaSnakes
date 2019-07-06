import * as React from 'react';
import Social, {EVENT_NAMES} from "../social/social";
import {ChatMessageEvent} from '../social/chat';
import Utils from '../utils/utils';
import ServerUtils from '../utils/server_api';

import {offsetTop} from "./sidepops/sidepops_common";
import UserSidepop from './sidepops/user_sidepop';

import '../styles/recent_conversations.scss';

let recent_conversations: {friend_id: string, last_message: string}[] = [];
let view_instances: RecentConversations[] = [];

function waitForSocialToLoad() {
	if (typeof Social === 'undefined') {
		setTimeout(waitForSocialToLoad, 100);
		return;
	}
	
	Social.on(EVENT_NAMES.ON_CHAT_MESSAGE, ({friendship_id, message}: ChatMessageEvent) => {
		let friend = Social.getFriendByFriendshipID(friendship_id);
		if(!friend || friend.is_left === message.left)//no friend or I am author of this message
			return;
		
		let current_index = recent_conversations.findIndex(r => !!friend && r.friend_id === friend.friend_data.id);
		if(current_index !== -1)
			recent_conversations.splice(current_index, 1);
		
		//push at beginning
		recent_conversations.splice(0, 0, {
			friend_id: friend.friend_data.id,
			last_message: message.content[0] || 'Error: no message content'
		});
		
		view_instances.forEach(v => v.forceUpdate());
	});
}
waitForSocialToLoad();


function closeConversation(friendship_id: string) {
	let index = recent_conversations.findIndex(r => r.friend_id === friendship_id);
	if(index !== -1)
		recent_conversations.splice(index, 1);
	
	view_instances.forEach(v => v.forceUpdate());
}

interface RecentConversationsState {
	selected_user?: string;
}

export default class RecentConversations extends React.Component<any, RecentConversationsState> {
	state: RecentConversationsState = {
		selected_user: undefined
	};
	
	componentDidMount() {
		view_instances.push(this);
	}
	
	componentWillUnmount() {
		let i = view_instances.indexOf(this);
		if(i !== -1)
			view_instances.splice(i, 1);
	}
	
	private renderConversations() {
		return recent_conversations.map(conversation => {
			let friend = Social.getFriend(conversation.friend_id);
			if(!friend)
				return undefined;
			return <button key={friend.friend_data.id} onClick={() => {
				this.setState({selected_user: conversation.friend_id});
			}}>
				<div className={'top'}>
					<img src={ServerUtils.getAvatarPath(friend.friend_data.avatar)} alt={'avatar'} />
					<span>{friend.friend_data.username}</span>
					<span className={'closer'} onClick={(event) => {
						closeConversation(conversation.friend_id);
						event.stopPropagation();
					}} />
				</div>
				<div className={'last-msg'}>{Utils.trimString(conversation.last_message, 30)}</div>
			</button>;
		});
	}
	
	render() {
		if(recent_conversations.length === 0)
			return <span>No recent conversations</span>;
		return <>
			<div>Recent conversations</div>
			<div className={'recent-conversations'} style={offsetTop}>{this.renderConversations()}</div>
			{this.state.selected_user &&
				<UserSidepop account_id={this.state.selected_user} onClose={() => {
					this.setState({selected_user: undefined});
				}} focus_chat={true} />
			}
		</>;
	}
}