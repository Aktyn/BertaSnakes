///<reference path="../chart.ts"/>

interface VisitJSON {
	IP: string, 
	TIME: string
}

interface AdminState {
	visits: VisitJSON[] | undefined;
	ban_info?: string;
}

class Admin extends React.Component<any, AdminState> {

	state: AdminState = {
		visits: undefined,
		ban_info: undefined
	};

	private fromDate: HTMLInputElement | null = null;
	private toDate: HTMLInputElement | null = null;

	private chartContainer: HTMLDivElement | null = null;
	private banUserInput: HTMLInputElement | null = null;

	constructor(props: any) {
		super(props);
	}

	componentDidMount() {
		try {
			let today_date = new Date().toLocaleDateString();//DD.MM.YYYY
			let date_in_array = today_date.split('.').reverse()//['YYYY', 'MM', 'DD']
				.map(xx => xx.length < 2 ? '0' + xx : xx);

			if(this.toDate)
				this.toDate.value = date_in_array.join('-');//YYYY-MM-DD

			date_in_array[2] = '01';
			if(this.fromDate)
				this.fromDate.value = date_in_array.join('-');//YYYY-MM-01

		}
		catch(e) {
			console.error(e);
		}

		this.loadStatistics();
	}

	loadStatistics() {
		if(this.fromDate === null || this.toDate === null)
			return;

		$$.postRequest('statistics_request', {
			from: this.fromDate.value + ' 00:00',
			to: this.toDate.value + ' 23:59'
		}, (unparsed_res) => {
			if(unparsed_res === undefined)
				return;
			let res: {result: string, VISITS: VisitJSON[]} = JSON.parse(unparsed_res);

			//console.log( res );

			if(res.result !== 'SUCCESS')
				return;

			this.setState({
				visits: res.VISITS
			});

			this.renderVisitsChart(res.VISITS);
		});
	}

	banUser(user_name: string) {

		$$.postRequest('ban_user_admin_request', {username: user_name}, (unparsed_res) => {
			if(unparsed_res === undefined)
				return;
			let res = JSON.parse(unparsed_res);

			if(res.result !== 'SUCCESS') {
				if(res.result === 'USER_NOT_FOUND')
					this.setState({ban_info: 'Cannot find user or he is already banned'});
				else
					this.setState({ban_info: 'Only Admin can ban other users.'});
				return;
			}

			//$$('#ban_info').setText('User banned');
			this.setState({ban_info: 'User banned'});
		});
	}

	renderVisitsTable() {
		if(!this.state.visits)
			return undefined;

		var cell_style: React.CSSProperties = {whiteSpace: 'nowrap', textAlign: 'left'};

		return <div style={{maxHeight: '500px', overflowY: 'auto'}}>
			<table className='dark_evens' style={{width: '100%'}}>
				<tr><th>IP</th><th>TIME</th></tr>
				{this.state.visits.map(v => {
					return <tr>
						<td style={cell_style}>{v.IP}</td>
						<td style={cell_style}>{v.TIME}</td>
					</tr>;
				})}
			</table>
		</div>;
	}

	renderVisitsChart(visits: VisitJSON[]) {
		//console.log('generating visits chart', visits);

		let chart = new Chart(800, 400);

		let daily_visits: {[index: string]: number} = {};

		visits.map((visit) => visit.TIME.replace(/\ [0-9]{2}:[0-9]{2}/, ''))
			.forEach(date => daily_visits[date] = (daily_visits[date] || 0) + 1);

		let chart_data: DataJSON[] = Object.keys(daily_visits).sort((a, b) => {
			return a.localeCompare(b);
		}).map(key => {
			return {x_value: key, y_value: daily_visits[key]};
		});
		chart.feedWithData(chart_data);

		//return chart.getCanvas();
		if(this.chartContainer !== null) {
			this.chartContainer.innerHTML = '';
			this.chartContainer.appendChild(chart.getCanvas());
		}
	}

	render() {
		return <div className='container' style={{padding: '0px'}}>
			<article style={{
				display: 'grid',
				gridTemplateColumns: 'auto min-content'
			}}>
				<section>
					<h1>Charts</h1>
					<div style={{padding: '0px 10px'}}>
						<div className='prompt' style={{minWidth: '600px', width: 'auto'}}>
							<label>From: </label><input type='date'
								ref={(input) => { this.fromDate = input; }} /><br />
							<label>To: </label><input type='date' 
								ref={(input) => { this.toDate = input; }} />
						</div>
						<button id='stats_refresh_btn' onClick={this.loadStatistics.bind(this)}>
							REFRESH
						</button>

						<div id='visits_chart_container' style={{margin: '20px 0px'}}
							ref={(container) => this.chartContainer = container}></div>
					</div>
				</section>
				<aside style={{borderLeft: '1px solid #bbb'}}>
					<h1 style={{padding: '0px'}}>Admin's power</h1>
					<div className='error_msg' id='ban_info'>
						{this.state.ban_info}
					</div>
					<div style={{padding: '10px'}} className='prompt'>
						<input name='user_to_ban' type='text' placeholder='username' style={{
							width: '100%'
						}} ref={(input) => this.banUserInput = input} /><br />
						<button style={{marginTop: '10px'}} onClick={() => {
							if(this.banUserInput !== null)
								this.banUser( this.banUserInput.value );
						}}>BAN USER</button>
					</div>
					<hr />
					<div id='visits_table_container'>
						{this.renderVisitsTable()}
					</div>
				</aside>
			</article>
		</div>;
	}
}