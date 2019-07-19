import * as React from 'react';
import RoomInfo from '../../common/room_info';
import Network from '../game/engine/network';
import Utils from '../utils/utils';

import '../styles/rooms_list.scss';

interface RoomsListProps {
	rooms: RoomInfo[];
	current_room: RoomInfo | null;
}

export default class RoomsList extends React.Component<RoomsListProps, any> {
	
	constructor(props: RoomsListProps) {
		super(props);
	}

	render() {
		return <table className='rooms-list'><tbody>
			{this.props.rooms.map((room) => {
				let is_current = this.props.current_room && this.props.current_room.id === room.id;
				
				return <tr key={room.id} onClick={() => {
					if(!room.to_remove)
						Network.joinRoom(room.id);
				}} className={`${is_current ? 'current' : ''} 
					${room.to_remove ? 'to-remove' : ''}`.trim()}>
					<td>
						<div>{Utils.trimString(room.name, 20)}</div>
						<strong>{room.map}</strong>
						<span className='separator'/>
						<span>{room.max_enemies}</span>
					</td>
					<td>
						<div>
							{room.getTakenSits()}/{room.sits.length}
							<span className='separator'/>
							{(room.duration/60)|0} min
						</div>
						<span>{Utils.GAMEMODES_NAMES[room.gamemode]}</span>
					</td>
				</tr>;
			})}
		</tbody></table>;
	}
}