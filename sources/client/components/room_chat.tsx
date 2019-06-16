import * as React from 'react';

import '../styles/room_chat.scss';

interface RoomChatState {
	hide_chat: boolean;
}

export default class RoomChat extends React.Component<any, RoomChatState> {
	state: RoomChatState = {
		hide_chat: true
	}

	constructor(props: any) {
		super(props);
	}

	render() {
		return <div className={`${this.state.hide_chat ? 'hidden ' : ''}room-chat`}>
			<nav>
				<button className='rooms-chat-toggler glossy no-icon' onClick={() => {
					this.setState({hide_chat: !this.state.hide_chat});
				}}>{this.state.hide_chat ? 'SHOW' : 'HIDE'}</button>
			</nav>
			<section className='users-list'>
				TODO - list of users
			</section>
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