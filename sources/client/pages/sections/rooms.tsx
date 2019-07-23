import * as React from 'react';
import {Link} from 'react-router-dom';
import {offsetTop} from '../../components/sidepops/sidepops_common';
import Account from '../../account';
import ServerApi from '../../utils/server_api';
import Utils from '../../utils/utils';
import {RoomCustomData} from "../../../common/room_info";
import ERROR_CODES, {errorMsg} from "../../../common/error_codes";

interface RoomsProps {
	setError: (msg: string) => void;
}

interface RoomsState {
	rooms: RoomCustomData[];
}

export default class RoomsSection extends React.Component<RoomsProps, RoomsState> {
	
	state: RoomsState = {
		rooms: []
	};
	
	componentDidMount(): void {
		this.refresh().catch(console.error);
	}
	
	private async refresh() {
		interface RoomsDataResponse  {
			error: ERROR_CODES;
			rooms: RoomCustomData[]
		}
		
		let res: RoomsDataResponse = await ServerApi.postRequest('/get_rooms_data', {
			token: Account.getToken()//for authorization
		});
		
		if(res.error !== ERROR_CODES.SUCCESS || !res.rooms)
			return this.props.setError( errorMsg(res.error) );
		
		this.setState({rooms: res.rooms});
	}
	
	private renderList() {
		return this.state.rooms.map(room => {
			return <tr key={room.id}>
				<td><Link to={`/play/${room.id}`}>{Utils.trimString(room.name, 20)}</Link></td>
				<td>{room.map}</td>
				<td>{room.sits.filter(s => s).length}/{room.sits.length}</td>
				<td>{(room.duration / 60) | 0}&nbsp;min</td>
				<td>{room.max_enemies}</td>
				<td>{Utils.GAMEMODES_NAMES[room.gamemode]}</td>
			</tr>;
		});
	}
	
	render() {
		return <section>
			<button style={offsetTop} onClick={this.refresh.bind(this)}>REFRESH ROOMS</button>
			<div style={{maxHeight: '300px', overflowY: 'auto', ...offsetTop}}>
				<table className={'rooms-table'}>
					<thead><tr>
						<th>Name</th>
						<th>Map</th>
						<th>Sits</th>
						<th>Duration</th>
						<th>Enemies</th>
						<th>Gamemode</th>
					</tr></thead>
					<tbody>{this.renderList()}</tbody>
				</table>
			</div>
		</section>;
	}
}