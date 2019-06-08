import * as React from 'react';

import Network from './../engine/network';
import RoomInfo from './../../../common/room_info';
// import UserInfo from './../../../common/user_info';
interface UserChat {
	id: number;
	nick: string;
}

// import './../../styles/chat.scss';

const COLORS_PALETTE = ['#1a8ead', '#1aad83', '#ad431a', '#ad941a', '#3a1aad', '#831aad'];

/*interface Message {
	author: string;
	content: string;
}*/
function validate(msg: string) {//returns true if message is valid to send
	return typeof msg === 'string' && msg.length > 0;
};

interface ChatProps {
	room: RoomInfo | null;
}

interface ChatState {
	current_bookmark: Bookmark | null;
	header_state?: {text: string, id: number};
	hidden: boolean;
}

export default class extends React.Component<ChatProps, ChatState> {

	private bookmarks: Bookmark[] = [];

	private input_msg: HTMLInputElement | null = null;
	private chat_body: HTMLDivElement | null = null;

	state: ChatState = {
		current_bookmark: null,
		hidden: false
	}

	constructor(props: ChatProps) {
		super(props);
	}

	componentWillReceiveProps(props: ChatProps) {
		if(this.props.room !== null && props.room === null) {//room leaved
			if(this.input_msg)
				this.input_msg.value = '';
			if(this.bookmarks.length > 0 && this.bookmarks[0].isRoomBookmark()) {
				if(this.state.current_bookmark === this.bookmarks[0]) {
					if(this.bookmarks.length === 1)
						this.state.current_bookmark = null;
					else {
						this.state.current_bookmark = this.bookmarks[1];
						if(this.state.header_state && 
							this.state.header_state.id === this.bookmarks[1].getID()) 
						{
							this.state.header_state = undefined;
						}
					}
				}
				this.bookmarks.shift();//remove room bookmark
			}
		}
		else if(this.props.room === null && props.room !== null) {//room joined
			if(this.bookmarks.length === 0 || !this.bookmarks[0].isRoomBookmark()) {
				this.bookmarks.splice(0, 0, new Bookmark(props.room));
				if(this.state.current_bookmark === null) {
					if(this.input_msg)
						this.input_msg.value = '';
					this.state.current_bookmark = this.bookmarks[0];
				}
			}
		}
		else if(this.props.room && props.room && this.props.room.id !== props.room.id) {//room changed
			if(this.bookmarks.length > 0 && this.bookmarks[0].isRoomBookmark()) {
				let new_bookmark = new Bookmark(props.room);
				if(this.state.current_bookmark === this.bookmarks[0]) {
					if(this.input_msg)
						this.input_msg.value = '';
					this.state.current_bookmark = new_bookmark;
				}
				this.bookmarks[0] = new_bookmark;
			}
		}
	}

	componentDidUpdate(prev_props: ChatProps, prev_state: ChatState) {
		if(this.chat_body && this.state.current_bookmark && this.state.current_bookmark.getID() !== 
			(prev_state.current_bookmark ? prev_state.current_bookmark.getID() : null) ) 
		{//bookmark changed
			let body_rect = this.chat_body.getBoundingClientRect();
			let body_height = body_rect.bottom - body_rect.top;
			this.chat_body.scrollTop = this.chat_body.scrollHeight + body_height;
		}
	}

	selectBookmark(bookmark: Bookmark) {
		if(this.state.current_bookmark === bookmark)
			return;

		this.setState({
			current_bookmark: bookmark,
			header_state: this.state.header_state && this.state.header_state.id === bookmark.getID() ?
				undefined : this.state.header_state
		});
	}

	openBookmark(user_id: number, user_nick: string) {
		if(this.bookmarks.find(b => !b.isRoomBookmark() && b.getID() === user_id))
			return;
		let bookmark = new Bookmark({id: user_id, nick: user_nick});
		this.bookmarks.push(bookmark);
		this.setState({current_bookmark: bookmark});
	}

	switchChat() {
		let notif_bookmark = this.state.hidden && 
			this.state.header_state && this.state.current_bookmark &&
			this.state.header_state.id === this.state.current_bookmark.getID();
		if(!this.state.hidden && this.input_msg)
			this.input_msg.value = '';
		this.setState({
			hidden: !this.state.hidden, 
			header_state: notif_bookmark ? undefined : this.state.header_state
		});
	}

	trySend() {
		if(!this.input_msg || this.state.current_bookmark === null)
			return;

		let msg = this.input_msg.value;
		msg = msg.trim();
		if(validate(msg) === false)
			return false;
			
		try {
			if(this.state.current_bookmark.isRoomBookmark()) {//room message
				//this.current_bookmark.name - room name (only for server verification)
				Network.sendRoomMessage(msg);
			}
			else {
				//2nd argument - target user's id
				Network.sendPrivateMessage(msg, this.state.current_bookmark.getID());
			}

			this.input_msg.value = '';

			return true;
		}
		catch(e) {
			console.error(e);
			return false;
		}
	}

	onMessageAdded(from: string, is_room_msg: boolean, id: number, msg: string) {
		this.forceUpdate();

		if(!this.chat_body)
			return;

		let body_rect = this.chat_body.getBoundingClientRect();
		let body_height = body_rect.bottom - body_rect.top;

		var sticks = body_height + this.chat_body.scrollTop + 27 + 13 >= 
			this.chat_body.scrollHeight;

		//console.log(sticks);

		if(sticks && !this.state.hidden) {
			this.chat_body.scrollTop = this.chat_body.scrollHeight + body_height;
			if(this.state.header_state)
				this.setState({header_state: undefined});
		}
		if(!sticks || this.state.hidden/* || book !== this.current_bookmark*/)
			this.setState({header_state: {
				text: `${!is_room_msg ? '(priv)' : ''} ${from}: ${msg}`,
				id: id
			}});
	}

	onMessage(from: string, is_room_msg: boolean, id: number, msg: string) {
		try {
			var bookmark = this.bookmarks.find(b => 
				b.isRoomBookmark() === is_room_msg && b.getID() === id);
			if(!bookmark) {
				bookmark = new Bookmark({id: id, nick: from});
				this.bookmarks.push(bookmark);
				if(this.state.current_bookmark === null)
					this.state.current_bookmark = bookmark;
			}
			bookmark.addMessage(from, msg);
			if(this.state.current_bookmark === bookmark)
				this.onMessageAdded(from, is_room_msg, id, msg);
			else {
				this.setState({header_state: {
					text: `${!is_room_msg ? '(priv)' : ''} ${from}: ${msg}`,
					id: id
				}});
			}
		}
		catch(e) {
			console.error('Chat message receiving error: ', e);
		}
	}

	render() {
		return <div className={`chat_container ${this.state.hidden ? 'hidden' : ''}`}>
			
			<header>
				<button className='slide-btn' onClick={this.switchChat.bind(this)}></button>
				<label onClick={() => {
					if(this.state.hidden)
						this.switchChat();//TODO - switching to notification tab
				}}>{this.state.header_state && this.state.header_state.text}</label>
				{
					this.state.current_bookmark && !this.state.current_bookmark.isRoomBookmark() && 
						<button className='close-btn shaky-icon' onClick={() => {
							if(!this.state.current_bookmark || 
								this.state.current_bookmark.isRoomBookmark())
							{
								return;
							}
							//closing current bookmark
							let current_index = this.bookmarks.indexOf(this.state.current_bookmark);
							this.bookmarks.splice(current_index, 1);
							if(current_index > 0)
								this.setState({current_bookmark: this.bookmarks[current_index-1]});
							else if(this.bookmarks.length > current_index)
								this.setState({current_bookmark: this.bookmarks[current_index]});
							else
								this.setState({current_bookmark: null});
						}}></button>
				}
			</header>
			<nav>
				{this.bookmarks.map((bookmark, i) => {
					return <button key={i} onClick={() => this.selectBookmark(bookmark)}
						className={this.state.current_bookmark === bookmark ? 'current' : ''}
						style={bookmark.color ? {
							backgroundColor: bookmark.color
						} : {}}>
						{bookmark.getName()}
					</button>;
				})}
			</nav>
			<div className='chat-body' ref={el => this.chat_body = el} onScroll={() => {
				if(this.state.header_state && this.state.current_bookmark && 
					this.state.header_state.id === this.state.current_bookmark.getID()) 
				{
					this.setState({header_state: undefined});
				}
			}}>{
				this.state.current_bookmark === null ? <label>No conversations</label> :
				<table>
					<tbody>{this.state.current_bookmark.render()}</tbody>
				</table>
			}</div>
			<input type='text' placeholder='type here' maxLength={2048} 
				disabled={this.state.current_bookmark===null || this.state.hidden}
				ref={el=>this.input_msg=el} onKeyDown={e => {
					if(e.keyCode === 13)
						this.trySend();
				}} />
		</div>;
	}
}

class Bookmark {
	private static color_iterator = 0;
	readonly color: string | undefined;

	private source: RoomInfo | UserChat;
	private messages: Array<[string, string]> = [];

	constructor(source: RoomInfo | UserChat) {
		this.source = source;
		
		if(!(this.source instanceof RoomInfo)) {
			this.color = COLORS_PALETTE[Bookmark.color_iterator];
			Bookmark.color_iterator = (Bookmark.color_iterator+1) % COLORS_PALETTE.length;
		}
	}

	isRoomBookmark() {
		return this.source instanceof RoomInfo;
	}

	getName() {
		if(this.source instanceof RoomInfo)
			return 'Current room';//this.source.name;
		else
			return this.source.nick;//TODO - avatars can be used from here
	}

	getID() {
		return this.source.id;
	}

	addMessage(author: string, content: string) {
		this.messages.push([author, content]);
	}

	render() {//NOTE - this is not a react element therefore this is not react render method
		return this.messages.map((msg, i) => {
			return <tr key={i}><td>{msg[0]}:</td><td>{msg[1]}</td></tr>;
		});
	}
}