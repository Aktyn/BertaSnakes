import * as React from 'react';
import {withRouter} from "react-router";

import {errorMsg} from "../../common/error_codes";
import ContainerPage, {ContainerProps} from "./container_page";

import UserSection from "../components/sidepops/user_section";

interface UserDetailsState extends ContainerProps {
	account_id?: string
}

class UserDetails extends React.Component<any, UserDetailsState> {
	private user_section: UserSection | null = null;
	
	state: UserDetailsState = {
		loading: false,
		error: undefined,
		show_navigator: true
	};
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
		if(typeof this.props.match.params.id === 'string')
			this.setState({account_id: this.props.match.params.id});
		else
			this.setError('No user id specified in navigation bar');
	}
	
	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}
	
	private canReturn() {
		return !!(this.user_section && this.user_section.canReturn());
	}
	
	private return() {
		if(this.user_section && this.user_section.canReturn())
			this.user_section.return();
	}
	
	render() {
		return <ContainerPage key={'user-details'} error={this.state.error} loading={this.state.loading}
			show_navigator={true} navigator_return={this.canReturn() ? this.return.bind(this) : undefined}>
			{this.state.account_id &&
				<UserSection ref={el => this.user_section = el} onError={(code) => {
					this.setError(errorMsg(code));
				}} account_id={this.state.account_id} container_mode />}
		</ContainerPage>;
	}
}

export default withRouter(UserDetails);