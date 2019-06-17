import * as React from 'react';
import SidepopBase, {SidepopProps} from './sidepop_base';

import './../../styles/user_sidepop.scss';

interface UserSidepopProps extends SidepopProps {
	account_id: string;
}

interface UserSidepopState {
	loading: boolean;
	error?: string;
}

export default class UserSidepop extends React.Component<UserSidepopProps, UserSidepopState> {
	state: UserSidepopState = {
		loading: false,
	}

	constructor(props: UserSidepopProps) {
		super(props);
	}

	componentDidMount() {
		this.setState({error: undefined, loading: true});

		console.log('TODO - load public data from:', this.props.account_id);
		//TODO
	}

	/*private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}*/

	render() {
		return <SidepopBase onClose={this.props.onClose} show_navigator={true}
			//navigator_return={this.canReturn() ? this.return.bind(this) : undefined}
			error={this.state.error} loading={this.state.loading} >
			<div key='main-content' className='fader-in'>
				TODO - user's public info and interaction options
			</div>
		</SidepopBase>;
	}
}