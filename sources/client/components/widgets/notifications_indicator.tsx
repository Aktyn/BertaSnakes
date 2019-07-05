import * as React from 'react';

import '../../styles/widgets/notifications_indicator.scss';

interface NotificationsProps {

}

interface NotificationsState {

}

export default class NotificationsIndicator extends React.Component<NotificationsProps, NotificationsState> {
	static defaultProps: Partial<NotificationsProps> = {
	
	};
	
	state: NotificationsState = {
	
	};
	
	constructor(props: NotificationsProps) {
		super(props);
	}
	
	render() {
		return <div className={'notifications-indicator'}>
			<button className={'indicator'} />
			<div className={'side-notification'}>Some notification message</div>
			<div className={'list'}>
				<div>Preparing</div>
				<div>notifications</div>
				<div>system</div>
			</div>
		</div>;
	}
}