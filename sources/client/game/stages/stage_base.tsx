import * as React from 'react';
import UserInfo from '../../../common/user_info';
import RoomInfo from '../../../common/room_info';
import HeaderNotifications from './header_notifications';

// import PopupBase from './popups/popup_base';
import {UserProfileProps} from './popups/user_profile';

export interface PopupOpenArgs {
	openPopupStage?: (_popup_class: any, _popup_props?: UserProfileProps) => void;
}

interface StageContextSchema extends PopupOpenArgs {
	onPrivateConversation: (user: UserInfo) => void;
}

export const StageContext = React.createContext<StageContextSchema>({
	onPrivateConversation: (/*arg*/) => void(0),
});

export interface BaseProps extends PopupOpenArgs {
	account: UserInfo | null,
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

	abstract onChatMessage(from: string, is_room_msg: boolean, id: number, msg: string): void;// {}
}