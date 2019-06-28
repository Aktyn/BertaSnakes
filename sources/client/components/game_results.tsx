import * as React from 'react';

import RoomInfo from '../../common/room_info';

import Utils from '../utils/utils';
import {PlayerResultJSON} from '../../common/game/game_result';
import ResultsTable from "./results_table";

import '../styles/game_results.scss';

interface GameResultsProps {
	onClose: () => void;
	room: RoomInfo;
	data: PlayerResultJSON[];
}

export default class GameResults extends React.Component<GameResultsProps, any> {
	
	constructor(props: GameResultsProps) {
		super(props);
	}
	
	render() {
		return <div className='game-results-container'>
			<div className={'results-body'}>
				<h1>Results for: {Utils.trimString(this.props.room.name, 20)}</h1>
				<ResultsTable data={this.props.data} />
				<nav>
					<button style={{margin: '10px 0px'}} onClick={this.props.onClose}>CLOSE RESULTS</button>
				</nav>
			</div>
		</div>;
	}
}