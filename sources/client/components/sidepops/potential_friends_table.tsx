import * as React from 'react';
import ServerApi from '../../utils/server_api';
import {PublicAccountSchema} from "../../../server/database/core";
import Social from '../../social/social';
import UserSidepop from './user_sidepop';

interface PotentialFriendsTableState {
	selected_user?: string
}

export default class PotentialFriendsTable extends React.Component<{
	users: PublicAccountSchema[];
	show_user: boolean;
}, PotentialFriendsTableState> {
	static defaultProps = {
		show_user: true
	};
	
	state: PotentialFriendsTableState = {};
	
	render() {
		return <>
			<table style={{
				display: 'inline-table',
				width: 'auto'
			}}><tbody>{this.props.users.map(user => {
				return <tr key={user.id}>
					{this.props.show_user && <>
						<td><img style={{
							width: '20px',
							height: '20px',
							borderRadius: '20px'
						}} src={ServerApi.getAvatarPath(user.avatar)} alt={'user\'s avatar'} /></td>
						<td onClick={() => this.setState({selected_user: user.id})} style={{
							cursor: 'pointer'
						}}>{user.username}</td>
					</>}
					<td><button onClick={() => Social.acceptRequest(user.id)}>ACCEPT</button></td>
					<td><button onClick={() => Social.rejectRequest(user.id)}>REJECT</button></td>
				</tr>;
			})}</tbody></table>
			{this.state.selected_user &&
				<UserSidepop account_id={this.state.selected_user} onClose={() => {
					this.setState({selected_user: undefined});
				}} />
			}
		</>;
	}
}