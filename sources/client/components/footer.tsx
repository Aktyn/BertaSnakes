import * as React from 'react';
import SwManager, { BeforeInstallPromptEvent } from '../sw_manager';
import ServerApi from '../utils/server_api';

import '../styles/footer.scss';

const aktyn_logo = require('../img/icons/aktyn.png');

declare var _UPDATE_TIME_: number;//compile-time variable passed from webpack config
declare var _APP_VERSION_: string;
declare var PAYPAL_DONATE: string | undefined;

const paypal_donate = typeof PAYPAL_DONATE === 'string' ? PAYPAL_DONATE : undefined;

function padZ(n: number) {//pad zero at the beginning
	return ('0'+n).slice(-2);
}

interface FooterState {
	install_event: BeforeInstallPromptEvent | null;
	server_version: string;
}

export default class extends React.Component<any, FooterState> {
	private readonly ready_to_install_listener: (e: BeforeInstallPromptEvent) => void;
	
	state: FooterState = {
		install_event: null,
		server_version: _APP_VERSION_
	};

	constructor(props: any) {
		super(props);
		
		this.ready_to_install_listener = (e) => {
			this.setState({install_event: e});
		};
	}
	
	componentDidMount() {
		SwManager.onReadyToInstall(this.ready_to_install_listener);
		
		ServerApi.postRequest('/get_version', {}).then(res => {
			this.setState({server_version: res.version});
		}).catch(void 0);//ignore error
	}
	
	componentWillUnmount() {
		SwManager.offReadyToInstall(this.ready_to_install_listener);
	}
	
	render() {
		let dt = new Date(_UPDATE_TIME_);

		let update_time = `${padZ(dt.getDate())}-${padZ(dt.getMonth()+1)}-${padZ(dt.getFullYear())} ` +
			`${padZ(dt.getHours())}:${padZ(dt.getMinutes())}`;
		let version_mismatch = this.state.server_version !== _APP_VERSION_;
		
		return <div className='footer'>
			<div className={'top'} style={{
				display: (this.state.install_event || version_mismatch || paypal_donate) ? 'grid' : 'none'
			}}>
				{this.state.install_event && <button className={'install-btn'} onClick={async () => {
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
				}}>INSTALL APP</button>}
				{version_mismatch &&
					<div className={'version-error '}>
						<span>Server version is: {this.state.server_version}</span><br />
						<span>Please clear website cache to update client files.</span>
					</div>
				}
				{paypal_donate && <a href={paypal_donate} rel='noopener' target={'_blank'}
				                   className={'paypal-donate-link button-style'}>Donate project via PayPal</a>}
			</div>
			<div className={'bottom'}>
				<span>Last update:&nbsp;{update_time}, version:&nbsp;{_APP_VERSION_}</span>
				<span>Copyright &copy; 2019 - Aktyn <img alt='author logo' src={aktyn_logo} /> - All rights reserved</span>
				<a href='https://github.com/Aktyn' target='_blank' rel="noreferrer">https://github.com/Aktyn</a>
			</div>
		</div>;
	}
}