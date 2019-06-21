import * as React from 'react';

import RoomInfo from '../../common/room_info';
import UserInfo from '../../common/user_info';

import UsersList from './users_list';
import RoomChat, {MessageSchema} from './room_chat';
export {MessageSchema} from './room_chat';

import '../styles/menu_right_panel.scss';

interface MenuRightPanelProps {
	room: RoomInfo;
	current_user: UserInfo | null;
}

interface MenuRightPanelState {
	hide_chat: boolean;
}

export default class MenuRightPanel extends React.Component<MenuRightPanelProps, MenuRightPanelState> {
	private chatHandle: RoomChat | null = null;

	state: MenuRightPanelState = {
		hide_chat: true,
	}

	constructor(props: MenuRightPanelProps) {
		super(props);
	}


	public pushMessage(msg: MessageSchema) {
		if(this.chatHandle)
			this.chatHandle.pushMessage(msg);
	}

	render() {
		return <div className={`${this.state.hide_chat ? 'hidden ' : ''}room-chat-container`}>
			<div className='room-chat-body'>
				<nav>
					<button className='rooms-chat-toggler glossy no-icon' onClick={() => {
						this.setState({hide_chat: !this.state.hide_chat});
					}}>{this.state.hide_chat ? 'SHOW' : 'HIDE'}</button>
				</nav>
				<UsersList {...this.props} />
				<RoomChat ref={el => this.chatHandle = el} current_user={this.props.current_user} />
			</div>
		</div>;
	}
}