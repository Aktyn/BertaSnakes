import * as React from 'react';
import {GameSchema} from "../../../server/database";
import {convertDate} from "./game_info_list";
import Utils from '../../utils/utils';
import RewardIndicator from "../widgets/reward_indicator";

interface GameListItemProps {
	game: GameSchema;
	position: number | undefined;
	onClick: () => void;
}

export default class GameListItem extends React.Component<GameListItemProps, any> {
	static defaultProps: Partial<GameListItemProps> = {
		position: undefined
	};
	
	render() {
		let game = this.props.game;
		return <tr onClick={this.props.onClick}>
			<td style={{textAlign: 'left'}}>
				<div style={{fontWeight: 'bold'}}>{Utils.trimString(game.name, 20)}</div>
				<div>{convertDate(game.finish_timestamp)}</div>
			</td>
			<td>
				<div style={{
					display: 'inline-grid',
					gridTemplateColumns: 'auto fit-content(100%) auto',
					gridTemplateRows: '1fr 1fr',
					alignItems: 'center'
				}}>
					<span>{game.map}</span>
					<span className={'separator'} style={{backgroundColor: '#B0BEC5'}}/>
					<span>{Math.round(game.duration / 60)}&nbsp;min</span>
					
					<span>{Utils.GAMEMODES_NAMES[game.gamemode]}</span>
					<span className={'separator'} style={{backgroundColor: '#B0BEC5'}}/>
					<span>{game.max_enemies}</span>
				</div>
			</td>
			{this.props.position !== undefined && <td>
				<div>Pos:&nbsp;{this.props.position + 1}/{game.results.length}</div>
				<div>
					Rank: {Math.round(game.results[this.props.position].rank)}&nbsp;
					<RewardIndicator reward={game.results[this.props.position].rank_reward}/>
				</div>
			</td>}
		</tr>;
	}
}