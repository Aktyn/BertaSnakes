import * as React from 'react';
import RoomInfo from '../../common/room_info';
// import Network from './../engine/network';

import '../styles/rooms_list.scss';

interface RoomsListProps {
	rooms: RoomInfo[];
	current_room: RoomInfo | null;
}

export default class RoomsList extends React.Component<RoomsListProps, any> {
	state = {}

	constructor(props: RoomsListProps) {
		super(props);
	}

	render() {
		return <table className='rooms-list'><tbody>
			{this.props.rooms.map((room, i) => {
				let is_current = this.props.current_room && this.props.current_room.id === room.id;
				return <tr key={i} /*onClick={()=>Network.joinRoom(room.id)}*/
						className={is_current ? 'current' : ''}>
					<td>{room.name}</td>
					<td>{room.getTakenSits()}/{room.sits.length}</td>
					<td>{(room.duration/60)|0} min</td>
					<td>{room.map}</td>
					<td>{room.gamemode}</td>
				</tr>;
			})}
		</tbody></table>;
	}

}