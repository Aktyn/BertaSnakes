import * as React from 'react';
import ContainerPage, {ContainerProps} from "./container_page";
import PagesController from "../components/widgets/pages_controller";
import ServerApi from '../utils/server_api';
import Utils from '../utils/utils';
import Config from '../../common/config';
import ERROR_CODES, {errorMsg} from '../../common/error_codes';
import {PublicAccountSchema} from "../../server/database";

import '../styles/rankings.scss';
import {Link} from "react-router-dom";

interface RankingsState extends ContainerProps {
	page: number;
	total_users: number;
	data: PublicAccountSchema[];
}

export default class Rankings extends React.Component<any, RankingsState> {
	state: RankingsState = {
		error: undefined,
		loading: false,
		show_navigator: false,
		total_users: 0,
		page: 0,
		data: []
	};
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
		this.loadRanking().catch(console.error);
	}
	
	componentDidUpdate(prevProps: any, prevState: Readonly<RankingsState>) {
		if(this.state.page !== prevState.page)
			this.loadRanking().catch(console.error);
	}
	
	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}
	
	async loadRanking() {
		this.setState({loading: true});
		try {
			if( false === await ServerApi.pingServer() )
				return this.setError(errorMsg(ERROR_CODES.SERVER_UNREACHABLE));
			let res = await ServerApi.postRequest('/get_ranking', {
				page: this.state.page
			});
			if (res.error !== ERROR_CODES.SUCCESS || !res.data)
				return this.setError( errorMsg(res.error) );
			//console.log(res);
			this.setState({loading: false, total_users: res.total_users || 0, data: res.data});
		}
		catch(e) {
			console.error(e);
			this.setError( errorMsg(ERROR_CODES.UNKNOWN) );
		}
	}
	
	private renderPage() {
		return this.state.data.map((user, index) => {
			let pos = index + this.state.page * Config.ITEMS_PER_RANKING_PAGE + 1;
			return <tr key={pos}>
				<td>{pos}</td>
				<td><img src={ServerApi.getAvatarPath(user.avatar)} alt='avatar' /></td>
				<td style={{textAlign: 'left'}}>{Utils.trimString(user.username, 15)}</td>
				<td>{Math.round(user.rank)}</td>
				<td>{user.level}&nbsp;({Math.round(user.exp*100)}%)</td>
				<td className={'hide-on-shrink'}>{new Date(user.creation_time).toLocaleString('pl-PL')
					.replace(',', '')}</td>
				<td><Link to={'/users/' + user.id}>...</Link></td>
			</tr>;
		});
	}
	
	render() {
		return <ContainerPage key={'rankings'} {...this.state}>
			<h3 className={'fader-in'}>Top ranks (X)</h3>{/*TODO: make a selection list from this header*/}
			<table className={'ranking-table fader-in'}>
				<thead><tr>
					<th>Pos.</th>
					<th/>
					<th>Username</th>
					<th>Rank</th>
					<th>Level</th>
					<th className={'hide-on-shrink'}>Registered since</th>
					<th/>
				</tr></thead>
				<tbody>{this.renderPage()}</tbody>
			</table>
			{
				this.state.total_users > Config.ITEMS_PER_RANKING_PAGE &&
				<div className={'fader-in'}><PagesController page={this.state.page} onChange={page => {
					this.setState({page});
				}} items={this.state.total_users} page_capacity={Config.ITEMS_PER_RANKING_PAGE} /></div>
			}
		</ContainerPage>;
	}
}