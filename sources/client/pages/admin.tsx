import * as React from 'react';
import ContainerPage, {ContainerProps} from "./container_page";
import BashCommandsSection from "./sections/bash_commands";
import StatisticsSection from "./sections/statistics";
import OnlineAccountsSection from "./sections/online_users";
import RoomsSection from "./sections/rooms";

import '../styles/pages/admin_panel.scss';

interface AdminPageState extends ContainerProps {}

// noinspection JSUnusedGlobalSymbols
export default class AdminPage extends React.Component<any, AdminPageState> {
	
	state: AdminPageState = {
		error: undefined,
		loading: false,
		show_navigator: false
	};
	
	constructor(props: any) {
		super(props);
	}
	
	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}
	
	render() {
		return <ContainerPage key={'admin-panel'} className={'admin-panel'} {...this.state}>
			<div>
				<StatisticsSection setError={this.setError.bind(this)} />
				<hr />
			</div>
			<div>
				<BashCommandsSection setError={this.setError.bind(this)} />
				<hr />
				<OnlineAccountsSection setError={this.setError.bind(this)} />
				<hr/>
				<RoomsSection setError={this.setError.bind(this)} />
			</div>
		</ContainerPage>;
	}
}