import * as React from 'react';
import {offsetTop} from '../../components/sidepops/sidepops_common';
import ServerApi from '../../utils/server_api';
import Utils from '../../utils/utils';
import Account, {AccountSchema} from '../../account';
import ERROR_CODES, {errorMsg} from "../../../common/error_codes";
import {RoomCustomData} from '../../../common/room_info';
import StatusIndicator from '../../components/widgets/status_indicator';

interface OnlineAccountData {
	account: AccountSchema;
	room_data: RoomCustomData | null;
	is_playing: boolean;
}

interface OnlineAccountsProps {
	setError: (msg: string) => void;
}

interface OnlineAccountsState {
	data: OnlineAccountData[];
}

export default class OnlineAccountsSection extends React.Component<OnlineAccountsProps, OnlineAccountsState> {
	
	state: OnlineAccountsState = {
		data: []
	};
	
	componentDidMount(): void {
		this.refresh().catch(console.error);
	}
	
	private async refresh() {
		interface OnlineAccountsResponse  {
			error: ERROR_CODES;
			data: OnlineAccountData[]
		}
		
		let res: OnlineAccountsResponse = await ServerApi.postRequest('/get_online_accounts_data', {
			token: Account.getToken()//for authorization
		});
		
		if(res.error !== ERROR_CODES.SUCCESS || !res.data)
			return this.props.setError( errorMsg(res.error) );
		
		this.setState({data: res.data});
	}
	
	private renderList() {
		return this.state.data.map(({account, room_data, is_playing}) => {
			return <tr key={account.id}>
				<td><img style={{
					maxHeight: '20px',
					borderRadius: '20px'
				}} src={ServerApi.getAvatarPath(account.avatar)} alt={'user avatar'} /></td>
				<td style={{textAlign: 'left'}}>{Utils.trimString(account.username, 15)}</td>
				<td>{Math.round(account.rank)}</td>
				<td>{account.level}&nbsp;({Math.round(account.exp*100)}%)</td>
				<td>{room_data && <span>{room_data.name}</span>}</td>
				<td><StatusIndicator {...{online: true, is_playing, is_in_room: !!room_data}} /></td>
			</tr>;
		});
	}
	
	render() {
		return <section>
			<button style={offsetTop} onClick={this.refresh.bind(this)}>REFRESH USERS</button>
			<div style={{maxHeight: '200px', overflowY: 'auto', ...offsetTop}}><table>
				<thead><tr>
					<th />
					<th>Username</th>
					<th>Rank</th>
					<th>Level</th>
					<th>Room</th>
					<th/>
				</tr></thead>
				<tbody>{this.renderList()}</tbody>
			</table></div>
		</section>;
	}
}