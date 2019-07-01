import * as React from 'react';

//@ts-ignore
import variables from '../styles/header_notification.scss';

interface NotificationsState {
	current?: string;
}

try {
	var DURATION = parseInt(variables.duration) || (1000 * 8);
}
catch(e) {
	console.error(e);
	var DURATION = 1000 * 8;
}
// console.log(variables, DURATION);

export default class HeaderNotifications extends React.Component<any, NotificationsState> {
	private static instances: Set<HeaderNotifications> = new Set();

	private queue: string[] = [];
	private queueTimeout: number | null = null;

	private holder: HTMLDivElement | null = null;

	state: NotificationsState = {};

	constructor(props: any) {
		super(props);

		//test
		/*setTimeout(() => {
			for(let i=1; i<=10; i++)
				this.add('notification test ' + i);
		}, 1000);*/
	}

	componentDidMount() {
		HeaderNotifications.instances.add(this);
	}

	componentWillUnmount() {
		if(this.queueTimeout)
			clearTimeout(this.queueTimeout);
		HeaderNotifications.instances.delete(this);
	}

	private onExpire() {
		if(this.queue.length > 0) {
			if(this.holder) {
				this.holder.classList.remove('notification');
				void this.holder.offsetWidth;
				this.holder.classList.add('notification');
			}
			this.setState({current: this.queue.shift()});
			this.queueTimeout = setTimeout(this.onExpire.bind(this), DURATION) as never;
		}
		else
			this.setState({current: undefined});
	}

	public add(msg: string[]) {
		if(this.state.current) {
			this.queue.push(...msg);
		}
		else {
			let first = msg.shift();
			this.queue.push(...msg);
			this.setState({current: first});
			
			this.queueTimeout = setTimeout(this.onExpire.bind(this), DURATION) as never;
		}
	}

	public render() {
		return (this.state.current === undefined ? <div/> :
			<div ref={el=>this.holder=el} className='notification'>{this.state.current}</div>
		);
	}

	public static push(...msg: string[]) {
		if(HeaderNotifications.instances.size === 0) {
			console.error('No HeaderNotification instance, cannot push notification message');
			return;
		}

		HeaderNotifications.instances.forEach(instance => instance.add(msg));
	}
}