import * as React from 'react';
import Utils from '../../utils/utils';
import Config from '../../../common/config';

import '../../styles/widgets/notifications_indicator.scss';

const POPUP_LIFETIME = 5000;

export const enum COMMON_LABELS {
	CHAT_MESSAGE = 'Message from: ',
	FRIEND_REQUEST = 'New friend request',
	FRIEND_REQUEST_ACCEPTED = 'New friend: ',
	FRIEND_REQUEST_REJECTED = ' rejected friend request',
	FRIEND_REMOVED = ' ended friendship',
	PENDING_FRIEND_REQUESTS = 'Pending friends: '
}

export interface NotificationSchema<DataType> {
	unique_id: number;
	content: string;
	custom_data?: DataType;//data passed to render function
	render?: (custom_data: DataType, onClose: () => void) => React.ReactNode;
}
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
let notification_id = 0;

type GenericNotificationSchema = NotificationSchema<any>;

let notifications: GenericNotificationSchema[] = [];
let notification_indicators: Set<NotificationsIndicator> = new Set();

let sound_path = require('../../sounds/notification.ogg');
let notification_sound = (() => {
	let element = document.createElement('audio');
	element.setAttribute('src', sound_path);
	element.setAttribute('preload', 'auto');
	element.setAttribute('controls', 'none');
	element.volume = 0.3;
	return element;
})();

// setTimeout(() => {//tests
// 	NotificationsIndicator.push({
// 		content: 'test notification',
// 		/*custom_data: {user_id: '5d138487cca5bb47a155b609'},
// 		render: (custom_data, onClose) => {
// 			return <UserSidepop account_id={custom_data.user_id} onClose={onClose} />;
// 		}*/
// 	} /*as NotificationSchema<{user_id: string}>*/);
// 	NotificationsIndicator.push({
// 		content: 'test notification 2'
// 	});
// 	NotificationsIndicator.push({
// 		content: 'test notification 3'
// 	});
// }, 1000);

document.addEventListener('visibilitychange', () => {
	if( document.visibilityState === 'visible' )//user focused tab
		document.title = Config.PAGE_TITLE;
}, false);

interface NotificationsState {
	currently_popping_notification: GenericNotificationSchema | null;
	active_notification: GenericNotificationSchema | null;
	open_list: boolean;
}

export default class NotificationsIndicator extends React.Component<any, NotificationsState> {
	
	public static push(notification: Omit<GenericNotificationSchema, 'unique_id'>) {
		let unique_notification: GenericNotificationSchema = {
			unique_id: notification_id++,
			...notification
		};
		
		if( document.visibilityState !== 'visible' ) {
			document.title = notification.content;
			notification_sound.play().catch(console.error);
		}
		
		//check whether notification already exists
		if( notifications.findIndex(n => n.content === notification.content) !== -1 ) {
			notification_indicators.forEach(indicator => indicator.onNotification(unique_notification));
			return;
		}
		
		notifications.push(unique_notification);
		notification_indicators.forEach(indicator => indicator.onNotification(unique_notification));
	}
	
	public static close(content: string) {//close notification by its content
		let index = notifications.findIndex(n => n.content.includes(content));
		if(index === -1)
			return false;
		
		notifications.splice(index, 1);
		
		notification_indicators.forEach(indicator => {
			if(indicator.isListOpen() || notifications.length === 0)
				indicator.forceUpdate();//force update list rendering
		});
		return true;
	}
	
	///////////////////////////////////////////////////////////////////
	
	state: NotificationsState = {
		currently_popping_notification: null,
		active_notification: null,
		open_list: false
	};
	
	private list_div: HTMLDivElement | null = null;
	private notifications_to_popup: GenericNotificationSchema[] = [];
	private close_tm: NodeJS.Timeout | null = null;
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
		notification_indicators.add(this);
	}
	
	componentWillUnmount() {
		notification_indicators.delete(this);
		
		if(this.close_tm)
			clearTimeout(this.close_tm);
	}
	
	componentDidUpdate() {
		if(this.state.open_list) {
			if (notifications.length === 0)
				this.setState({open_list: false});
			if(this.list_div) {
				let left_dist = this.list_div.getBoundingClientRect().left;
				if(left_dist < 0)
					this.list_div.style.transform = `translateX(calc(-50% + ${-left_dist}px))`;
			}
		}
	}
	
	public onNotification(notification: GenericNotificationSchema) {
		if(this.state.currently_popping_notification) {
			if(this.state.currently_popping_notification.content === notification.content)
				return;//do not show same notification again so early
			this.notifications_to_popup.push(notification);
		}
		else
			this.popNotification(notification);
		this.forceUpdate();//force refresh of notifications list
	}
	
	public isListOpen() {
		return this.state.open_list;
	}
	
	public closeList() {
		this.setState({open_list: false});
	}
	
	private popNotification(notification: GenericNotificationSchema) {
		this.setState({currently_popping_notification: notification});
		//set timeout to finish popup eventually
		this.close_tm = setTimeout(() => {
			this.close_tm = null;
			this.closePopping();
		}, POPUP_LIFETIME) as never;
	}

	private closePopping() {
		if(this.close_tm) {
			clearTimeout(this.close_tm);
			this.close_tm = null;
		}
		
		if( this.notifications_to_popup.length > 0 ) {//popup next in queue
			let next = this.notifications_to_popup.shift();
			if(!next)
				throw new Error('Impossible error with array\'s shift method');
			this.popNotification(next);
		}
		else
			this.setState({currently_popping_notification: null});
	}
	
	private closeNotification(notification: GenericNotificationSchema) {
		for(let i=0; i<this.notifications_to_popup.length; i++) {
			if(this.notifications_to_popup[i] === notification) {
				this.notifications_to_popup.splice(i, 1);
				break;
			}
		}
		NotificationsIndicator.close(notification.content);
	}
	
	private closeActive() {
		this.setState({active_notification: null});
	}
	
	private renderPopping(notification: GenericNotificationSchema) {
		//NOTE: unique key may be needed to restart popup animation
		return <div className={'side-notification'} key={notification.unique_id} onClick={() => {
			if(notification.render)
				this.setState({active_notification: notification});
			this.closePopping();
			this.closeNotification(notification);
		}}>
			<span>{Utils.trimString(notification.content, 30)}</span>
			<button className={'closer'} onClick={(event) => {
				this.closePopping();
				this.closeNotification(notification);
				event.stopPropagation();
			}} />
		</div>;
	}
	
	private renderList() {
		return <div className={'list'} ref={el => this.list_div = el}>{notifications.map(notification => {
			return <div key={notification.unique_id} onClick={() => {
				if(notification.render)
					this.setState({active_notification: notification});
				this.closeNotification(notification);
			}}>
				<span className={'content'}>{Utils.trimString(notification.content, 30)}</span>
				<button className={'closer'} onClick={(event) => {
					this.closeNotification(notification);
					event.stopPropagation();
				}} />
			</div>;
		})}
			{notifications.length > 1 && <div style={{display: 'block'}}>
				<span className={'content'} style={{textAlign: 'center'}} onClick={(event) => {
					notifications.forEach(n => this.closeNotification(n));
					event.stopPropagation();
				}}>DISCARD ALL</span>
			</div>}
		</div>;
	}
	
	render() {
		if(notifications.length === 0) {
			if(this.state.active_notification && this.state.active_notification.render) {
				return this.state.active_notification.render(
					this.state.active_notification.custom_data, this.closeActive.bind(this));
			}
			return <span/>;
		}
		return <div className={'notifications-indicator'}>
			<button className={`indicator${this.state.open_list ? ' opened' : ''}`}
			        onClick={() => this.setState({open_list: !this.state.open_list})} />
			{this.state.currently_popping_notification && this.renderPopping(this.state.currently_popping_notification)}
			{this.state.open_list && this.renderList()}
			{
				this.state.active_notification && this.state.active_notification.render &&
					this.state.active_notification.render(
						this.state.active_notification.custom_data, this.closeActive.bind(this) )
			}
		</div>;
	}
}