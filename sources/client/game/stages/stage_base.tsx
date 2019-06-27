import * as React from 'react';
import UserInfo from '../../../common/user_info';
import RoomInfo from '../../../common/room_info';

import {MessageSchema} from '../../components/room_chat';

export interface BaseProps {
	onChange: (target: StageBase<any, any>) => void;
	current_user: UserInfo | null,
	current_room: RoomInfo | null,//current room
	rooms_list: RoomInfo[];
}

export interface BaseState {}

export default abstract class StageBase<Props, State> extends React.Component<Props, State> {
	protected constructor(props: Props) {
		super(props);
	}

	// noinspection JSUnusedGlobalSymbols
	protected abstract onChatMessage(msg: MessageSchema): void;
}