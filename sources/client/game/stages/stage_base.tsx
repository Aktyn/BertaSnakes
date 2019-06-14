import * as React from 'react';
import UserInfo from '../../../common/user_info';
import RoomInfo from '../../../common/room_info';
import HeaderNotifications from '../../components/header_notifications';

export interface BaseProps {
	current_user: UserInfo | null,
	room: RoomInfo | null,//current room
	rooms_list: RoomInfo[];
}

export interface BaseState {
	
}

export default abstract class<Props, State> extends React.Component<Props, State> {
	public notifications: HeaderNotifications | null = null;

	constructor(props: Props) {
		super(props);
	}
}