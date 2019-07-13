import * as React from 'react';
import ContainerPage, {ContainerProps} from "./container_page";
import PagesController from "../components/widgets/pages_controller";
import ServerApi from '../utils/server_api';
import Utils from '../utils/utils';
import Config, {RANKING_TYPES} from '../../common/config';
import ERROR_CODES, {errorMsg} from '../../common/error_codes';
import {PublicAccountSchema} from "../../server/database/core";

import '../styles/rankings.scss';
import {Link} from "react-router-dom";

const default_type = RANKING_TYPES.TOP_RANK;

const ranking_type_labels: [RANKING_TYPES, string][] = [
	[RANKING_TYPES.TOP_RANK, 'TOP RANK'],
	[RANKING_TYPES.HIGHEST_LEVEL, 'HIGHEST LEVEL'],
	[RANKING_TYPES.NEW_ACCOUNTS, 'NEW ACCOUNTS'],
];

interface RankingsState extends ContainerProps {
	total_users: number;
	data: PublicAccountSchema[];
	open_selector: boolean;
}

export default class Rankings extends React.Component<any, RankingsState> {
	state: RankingsState = {
		error: undefined,
		loading: false,
		show_navigator: false,
		total_users: 0,
		data: [],
		open_selector: false
	};
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
		this.loadRanking().catch(console.error);
	}
	
	componentDidUpdate(prevProps: any, prevState: Readonly<RankingsState>) {
		//routed
		if(this.props.location !== prevProps.location)
			this.loadRanking().catch(console.error);
	}
	
	private get type() {
		const type = parseInt(this.props.match.params.type);
		return !isNaN(type) ? type : default_type;
	}
	
	private get page() {
		const page = parseInt(this.props.match.params.page);
		return !isNaN(page) ? page : 0;
	}
	
	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}
	
	async loadRanking() {
		this.setState({loading: true, open_selector: false});
		try {
			if( false === await ServerApi.pingServer() )
				return this.setError(errorMsg(ERROR_CODES.SERVER_UNREACHABLE));
			let res = await ServerApi.postRequest('/get_ranking', {
				page: this.page,
				type: this.type
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
	
	private renderRows() {
		return this.state.data.map((user, index) => {
			let pos = index + this.page * Config.ITEMS_PER_RANKING_PAGE + 1;
			return <tr key={pos}>
				<td>{pos}</td>
				<td><img src={ServerApi.getAvatarPath(user.avatar)} alt='avatar' /></td>
				<td style={{textAlign: 'left'}}>{Utils.trimString(user.username, 15)}</td>
				<td>{Math.round(user.rank)}</td>
				<td>{user.level}&nbsp;({Math.round(user.exp*100)}%)</td>
				<td className={'hide-on-shrink'}>{
					new Date(user.creation_time).toLocaleDateString('pl-PL')
				}
				</td>
				<td><Link to={'/users/' + user.id} className={'more-icon shaky-icon'}/></td>
			</tr>;
		});
	}
	
	render() {
		let current_rank_type = ranking_type_labels.find(l => l[0] === this.type);
		return <ContainerPage key={'rankings'} className={'rankings-page'} {...this.state}>
			<div className={`type-selector${this.state.open_selector ? ' opened' : ''}`}>
				<button className={'fader-in current'} onClick={() => {
					this.setState({open_selector: !this.state.open_selector});
				}}>{current_rank_type && current_rank_type[1]}</button>
				<div className={'options'}>{ranking_type_labels.filter(([type]) => {
					return type !== this.type;
				}).map(([type, label], index) => {
					return <Link key={index} to={'/rankings/'+type}>{label}</Link>;
				})}</div>
			</div>
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
				<tbody>{this.renderRows()}</tbody>
			</table>
			{
				this.state.total_users > Config.ITEMS_PER_RANKING_PAGE &&
				<div className={'fader-in'}><PagesController page={this.page} onChange={page => {
					this.props.history.push('/rankings/' + this.type + '/' + page);
				}} items={this.state.total_users} page_capacity={Config.ITEMS_PER_RANKING_PAGE} /></div>
			}
		</ContainerPage>;
	}
}