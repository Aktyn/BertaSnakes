import * as React from 'react';
import {offsetTop} from "../sidepops/sidepops_common";
import {GameSchema} from "../../../server/database";
import Utils from '../../utils/utils';

export function convertDate(timestamp: number) {
	return new Date(timestamp).toLocaleString('pl-PL').replace(',', '');
}

export default class GameInfoList extends React.Component<{game: GameSchema}, any> {
	render() {
		return <div className={'fader-in details-list bold'} style={offsetTop}>
			<label>Name:</label>
			<span>{Utils.trimString(this.props.game.name, 20)}</span>
			<label>Date:</label>
			<span>{convertDate(this.props.game.finish_timestamp)}</span>
			<label>Map:</label>
			<span>{this.props.game.map}</span>
			<label>Duration:</label>
			<span>{Math.round(this.props.game.duration/60)}&nbsp;min</span>
			<label>Mode:</label>
			<span>{Utils.GAMEMODES_NAMES[this.props.game.gamemode]}</span>
		</div>;
	}
}