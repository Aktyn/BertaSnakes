import * as React from 'react';

interface NotificationsState {
	current?: string;
}

const DURATION = 1000 * 8;

export default class HeaderNotifications extends React.Component<any, NotificationsState> {
	private quene: string[] = [];
	private queneTimeout: number | null = null;

	private holder: HTMLDivElement | null = null;

	state: NotificationsState = {}

	constructor(props: any) {
		super(props);
	}

	componentWillUnmount() {
		if(this.queneTimeout)
			clearTimeout(this.queneTimeout);
	}

	private onExpire() {
		if(this.quene.length > 0) {
			if(this.holder) {
				this.holder.classList.remove('notification');
				void this.holder.offsetWidth;
				this.holder.classList.add('notification');
			}
			this.setState({current: this.quene.shift()});
			this.queneTimeout = setTimeout(this.onExpire.bind(this), DURATION) as never;
		}
		else
			this.setState({current: undefined});
	}

	add(...msg: string[]) {
		if(this.state.current) {
			this.quene.push(...msg);
		}
		else {
			let first = msg.shift();
			this.quene.push(...msg);
			this.setState({current: first});
			
			this.queneTimeout = setTimeout(this.onExpire.bind(this), DURATION) as never;
		}
	}

	render() {
		return <div ref={el=>this.holder=el} className='notification'>{this.state.current}</div>;
	}
}