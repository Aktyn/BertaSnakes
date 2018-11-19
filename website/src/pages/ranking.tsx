///<reference path="../loader.tsx"/>
///<reference path="../pages_link.tsx"/>
///<reference path="../link.tsx"/>
///<reference path="../page_navigator.ts"/>

interface RankingState {
	loaded: boolean;
	raw_result?: string;
}

class Ranking extends React.Component<any, RankingState> {
	private static extractPageID = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/ranking\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 0;
		}
	}

	state = {
		loaded: false,
		raw_result: undefined
	};

	constructor(props: any) {
		super(props);

		this.loadRanking();

		PageNavigator.onUrlChange( () => this.loadRanking(), 'ranking_page_changer' );
	}

	componentWillUnmount() {
		PageNavigator.removeUrlChangeListener('ranking_page_changer');
	}

	loadRanking() {
		$$.postRequest('/ranking_request', {page: Ranking.extractPageID()}, (pre_res) => {
			this.setState({
				loaded: true,
				raw_result: pre_res
			});
		});
	}

	renderResult() {
		interface ResUserInfo {
			NICK: string;
			RANK: string;
			ID: number;
		}

		interface RequestResult {
			result: string;
			user_infos: ResUserInfo[];
			page: number;
			rows_per_page: number;
			total_users: number;
		}
		
		var res: RequestResult = JSON.parse(this.state.raw_result || '{}');
		if(res.result !== 'SUCCESS')
			return;

		return <table className='dark_evens' style={{
				backgroundColor: '#fff',
				boxShadow: '0px 2px 6px #0003',
				color: '#555'
			}}>
			<tr>
				<th></th>
				<th>Username</th>
				<th>Rank<span style={{opacity: 0.4}}>&nbsp;&#9650;</span></th>
				<th></th>
			</tr>
			{res.user_infos.map((user, index) => {
				return <tr>
					<td>{res.page * res.rows_per_page + index+1}</td>
					<td>{user.NICK}</td>
					<td>{user.RANK}</td>
					<td><Link href={'/user/'+user.ID} type='user_link' /></td>
				</tr>;
			})}
			<tr>
				<PagesLink 
					page={res.page} 
					items_per_page={res.rows_per_page} 
					total_items={res.total_users} 
					href_base='/ranking/' />
			</tr>
		</table>;
	}

	render() {
		return <div>
			{this.state.loaded === false ? <Loader /> : this.renderResult()}
		</div>;
	}
}