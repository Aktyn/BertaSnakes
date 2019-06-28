import * as React from 'react';
import SidepopBase, {SidepopProps} from './sidepop_base';

import UserSection from "./user_section";
import {errorMsg} from "../../../common/error_codes";

interface UserSidepopProps extends SidepopProps {
	account_id: string;
}

interface UserSidepopState {
	loading: boolean;
	error?: string;
}

export default class UserSidepop extends React.Component<UserSidepopProps, UserSidepopState> {
	private user_section: UserSection | null = null;
	
	state: UserSidepopState = {
		loading: false,
	};

	constructor(props: UserSidepopProps) {
		super(props);
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
		return <SidepopBase onClose={this.props.onClose} show_navigator={true}
			navigator_return={this.canReturn() ? this.return.bind(this) : undefined}
			error={this.state.error} loading={this.state.loading} >
			<UserSection ref={el => this.user_section = el} onError={(code) => {
				this.setError(errorMsg(code));
			}} account_id={this.props.account_id} />
		</SidepopBase>;
	}
}