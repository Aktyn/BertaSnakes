import * as React from 'react';

import ERROR_CODES, {errorMsg} from "../../common/error_codes";
import ServerApi from '../utils/server_api';
import ContainerPage, {ContainerProps} from "./container_page";
import {GameSchema} from "../../server/database";
import ResultsTable from "../components/results_table";
import GameInfoList from "../components/game_info_list";

// import './../styles/homepage.scss';

interface GameDetailsState extends ContainerProps {
	game: GameSchema | null;
}

export default class GameDetails extends React.Component<any, GameDetailsState> {
	
	state: GameDetailsState = {
		loading: false,
		error: undefined,
		game: null
	};
	
	constructor(props: any) {
		super(props);
	}
	
	async componentDidMount() {
		try {
			if(false === await ServerApi.pingServer())
				return this.setError( errorMsg(ERROR_CODES.SERVER_UNREACHABLE) );
			if(typeof this.props.match.params.id !== 'string')
				return;
			let res = await ServerApi.postRequest('/game_details', {
				game_id: this.props.match.params.id,
			});
			if (res.error !== ERROR_CODES.SUCCESS)
				return this.setError( errorMsg(res.error) );
			if(res.game)
				this.setState({game: res.game});
		}
		catch(e) {
			console.error(e);
			this.setError( errorMsg(ERROR_CODES.UNKNOWN) );
		}
		
	}
	
	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}
	
	render() {
		return <ContainerPage error={this.state.error} loading={this.state.loading}>
			{this.state.game && <>
				<GameInfoList game={this.state.game} />
				<hr/>
				<div className={'fader-in'}>
					<ResultsTable data={this.state.game.results} no_avatars no_animation />
				</div>
			</>}
		</ContainerPage>;
	}
}