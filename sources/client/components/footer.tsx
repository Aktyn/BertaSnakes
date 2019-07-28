import * as React from 'react';
import SwManager, { BeforeInstallPromptEvent } from '../sw_manager';

import '../styles/footer.scss';

const aktyn_logo = require('../img/icons/aktyn.png');

declare var _UPDATE_TIME_: number;//compile-time variable passed from webpack config

function padZ(n: number) {//pad zero at the beginning
	return ('0'+n).slice(-2);
}

interface FooterState {
	install_event: BeforeInstallPromptEvent | null;
}

export default class extends React.Component<any, FooterState> {
	private readonly ready_to_install_listener: (e: BeforeInstallPromptEvent) => void;
	
	state: FooterState = {
		install_event: null
	};

	constructor(props: any) {
		super(props);
		
		this.ready_to_install_listener = (e) => {
			this.setState({install_event: e});
		};
	}
	
	componentDidMount() {
		SwManager.onReadyToInstall(this.ready_to_install_listener);
	}
	
	componentWillUnmount() {
		SwManager.offReadyToInstall(this.ready_to_install_listener);
	}
	
	render() {
		let dt = new Date(_UPDATE_TIME_);

		let update_time = `${padZ(dt.getDate())}-${padZ(dt.getMonth()+1)}-${padZ(dt.getFullYear())} ` +
			`${padZ(dt.getHours())}:${padZ(dt.getMinutes())}`;

		return <div className='footer'>
			{this.state.install_event && <div className={'top'}><button onClick={async () => {
				if(!this.state.install_event)
					return;
				try {
					this.state.install_event.prompt();
					let choice = await this.state.install_event.userChoice;
					//console.log(choice);
					if(choice.outcome === 'accepted')
						this.setState({install_event: null});
				}
				catch(e) {
					console.error(e);
				}
			}}>INSTALL APP</button></div>}
			<div className={'bottom'}>
				<span>Last update: {update_time}</span>
				<span>Copyright &copy; 2019 - Aktyn <img alt='author logo' src={aktyn_logo} /> - All rights reserved</span>
				<a href='https://github.com/Aktyn' target='_blank' rel="noreferrer">https://github.com/Aktyn</a>
			</div>
		</div>;
	}
}