import * as React from 'react';
import {Link} from 'react-router-dom';
import {offsetTop} from '../../components/sidepops/sidepops_common';
import ServerApi from '../../utils/server_api';
import Utils from '../../utils/utils';
import Account, {AccountSchema} from '../../account';
import ERROR_CODES, {errorMsg} from "../../../common/error_codes";
import {RoomCustomData} from '../../../common/room_info';
import StatusIndicator from '../../components/widgets/status_indicator';

import '../../styles/pages/online_users_section.scss';

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
	open_account_options?: OnlineAccountData;
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
	
	private renderAccountOptions({account, room_data, is_playing}: OnlineAccountData) {
		//TODO: separate this code to another view and use in account_section.tsx
		let exp_percent = Math.round(account.exp*100) + '%';
		return <div className={'account-options'}>
			<nav>
				<span />
				<strong>
					<img style={{
						maxHeight: '20px',
						borderRadius: '20px',
						marginRight: '10px'
					}} src={ServerApi.getAvatarPath(account.avatar)} alt={'user avatar'} />
					{Utils.trimString(account.username, 25)}{account.admin && ' (ADMIN)'}
				</strong>
				<button className={'closer shaky-icon'}
				        onClick={() => this.setState({open_account_options: undefined})}>&times;</button>
			</nav>
			<div className='details-list'>
				<label>Email:</label>
				<div>{account.email}</div>
				
				<label>Registered since:</label>
				<div>{new Date(account.creation_time).toLocaleDateString()}</div>
				
				<label>Rank:</label>
				<div>{Math.round(account.rank)}</div>
	
				<label>Level:</label>
				<div>
					{account.level}
					<div className='experience-bar'><span style={{width: exp_percent}}>&nbsp;</span></div>
					({exp_percent})
				</div>
				
				<label>Coins:</label>
				<div>{account.coins}</div>
				
				<label>Total games:</label>
				<div>{account.total_games}</div>
			</div>
			{room_data && <div style={offsetTop}>
				<div>
					<span>{Utils.trimString(room_data.name, 20)}</span>
					<span className={'separator'}/>
					<span>{room_data.map}</span>
					<span className={'separator'}/>
					<span>{room_data.sits.filter(s => s).length}/{room_data.sits.length}</span>
					<span className={'separator'}/>
					<span>{(room_data.duration/60)|0}&nbsp;min</span>
					<span className={'separator'}/>
					<span>{Utils.GAMEMODES_NAMES[room_data.gamemode]}</span>
				</div>
				{!is_playing && <div style={offsetTop}>
					<Link to={'/play/' + room_data.id} className={'button-style'}>JOIN ROOM</Link>
				</div>}
			</div>}
		</div>;
	}
	
	private renderList() {
		return this.state.data.map(({account, room_data, is_playing}, index) => {
			return <tr key={account.id}>
				<td><img style={{
					maxHeight: '20px',
					borderRadius: '20px'
				}} src={ServerApi.getAvatarPath(account.avatar)} alt={'user avatar'} /></td>
				<td style={{textAlign: 'left'}}>
					<Link to={`/users/${account.id}`}>{Utils.trimString(account.username, 15)}</Link>
				</td>
				<td>{Math.round(account.rank)}</td>
				<td>{account.level}&nbsp;({Math.round(account.exp*100)}%)</td>
				<td>{room_data && <span>{room_data.name}</span>}</td>
				<td><StatusIndicator {...{online: true, is_playing, is_in_room: !!room_data}} /></td>
				<td className={'account-options-cell'}>
					<button className={'more-icon shaky-icon'} onClick={() => {
						this.setState({open_account_options: this.state.data[index]});
					}}/>
				</td>
			</tr>;
		});
	}
	
	render() {
		return <section className={'online-users-section'}>{
			this.state.open_account_options ? this.renderAccountOptions(this.state.open_account_options) :
			<>
				<button style={offsetTop} onClick={this.refresh.bind(this)}>REFRESH USERS</button>
				<div style={{maxHeight: '300px', overflowY: 'auto', ...offsetTop}}>
					<table className={'players-table'}>
						<thead><tr>
							<th />
							<th>Username</th>
							<th>Rank</th>
							<th>Level</th>
							<th>Room</th>
							<th />
							<th />
						</tr></thead>
						<tbody>{this.renderList()}</tbody>
					</table>
				</div>
			</>
		}</section>;
	}
}