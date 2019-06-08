import * as React from 'react';

import Network from './../game/engine/network';
import UserInfo from './../../common/user_info';

import {StageContext} from './../game/stages/stage_base';
import UserProfile, {UserProfileProps} from './../game/stages/popups/user_profile';

// import './../styles/users_list.scss';

interface UsersListProps {
	users: UserInfo[];
	//onChatOpenRequest?: (user_info: UserInfo) => void;
	me: UserInfo | null;
	am_i_owner: boolean;
}

interface UsersListState {
	show_more_of: number;
}

export default class extends React.Component<UsersListProps, UsersListState> {
	static defaultProps = {
		am_i_owner: false
	}

	state: UsersListState = {
		show_more_of: 0
	}

	constructor(props: UsersListProps) {
		super(props);
	}

	kickUser(id: number) {
		Network.requestUserKick(id);
	}

	render() {
		return <StageContext.Consumer>{stage_ctx => (
			<table className='users-list'><tbody>
				<tr><th>Nick</th><th>Rank</th><th>Lvl</th><th></th></tr>
				{this.props.users.map((user, i) => {
					let is_it_me = this.props.me && this.props.me.id === user.id;
					return <tr key={i}>
						{this.state.show_more_of === user.id ? 
							<td colSpan={3}><div className='user-options'>
								{
									this.props.am_i_owner && !is_it_me &&
									<button onClick={() => {
										this.kickUser(user.id);
										this.setState({show_more_of: 0});//close options view
									}}>Kick</button>
								}
								{
									!is_it_me && <button onClick={() => {
										stage_ctx.onPrivateConversation(user);
									}}>Private message</button>
								}
								<button onClick={() => {
									if(stage_ctx.openPopupStage) {
										stage_ctx.openPopupStage(UserProfile.prototype, {user:user} as 
											UserProfileProps);
									}
								}}>Show profile</button>
							</div></td> :
							<>
								<td>{user.nick}</td>
								<td>{user.rank}</td>
								<td>{user.level}</td>
							</>
						}
						<td><button className={`${this.state.show_more_of === user.id ? 
							'close-btn' : 'more-btn'} shaky-icon`} onClick={() => 
						{
							if(this.state.show_more_of === user.id)
								this.setState({show_more_of: 0});//close
							else
								this.setState({show_more_of: user.id});
						}}></button></td>
					</tr>;
				})}
			</tbody></table>
		)}</StageContext.Consumer>;
	}
}