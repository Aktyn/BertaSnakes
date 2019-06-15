import * as React from 'react';
import UserInfo from '../../../common/user_info';
import RoomInfo from '../../../common/room_info';

export interface BaseProps {
	current_user: UserInfo | null,
	current_room: RoomInfo | null,//current room
	rooms_list: RoomInfo[];
}

export interface BaseState {
	
}

export default abstract class<Props, State> extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
	}
}