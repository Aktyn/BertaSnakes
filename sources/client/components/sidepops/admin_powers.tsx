import * as React from 'react';

import {Line as LineChart} from 'react-chartjs-2';
import {offsetTop} from './sidepops_common';
import Utils from '../../utils/utils';
import ServerApi from '../../utils/server_api';
import Account from '../../account';
import ERROR_CODES from '../../../common/error_codes';
import {PublicAccountSchema} from '../../../server/database/core';

const DEFAULT_DATA = {
    datasets: [{
        label: 'Visits',
        data: [{
		    x: new Date(Date.now()-1000*60*60*24*7),
		    y: 0
		}, {
		    x: new Date(),
		    y: 0
		}],
        backgroundColor: [
            '#e5393560',
        ],
        borderColor: [
            '#e53935',
        ],
        fill: 1,
        borderWidth: 1
    }]
};

interface AdminPowersProps {
	onError: (code: ERROR_CODES) => void;
	user: PublicAccountSchema;
	container: boolean;
}

// noinspection JSUnusedGlobalSymbols //this component is part of user_section view, styles are in user_section.scss
export default class AdminPowers extends React.Component<AdminPowersProps, any> {
	private from_input: HTMLInputElement | null = null;
	private to_input: HTMLInputElement | null = null;
	private visits_chart: LineChart | null = null;
	
	componentDidMount() {
		if(this.to_input)
			this.to_input.value = Utils.toInputFormat(Date.now());
		if(this.from_input)
			this.from_input.value = Utils.toInputFormat(Date.now() - 1000*60*60*24*7);
		
		this.refresh().catch(console.error);
	}
	
	private async refresh() {
		if(!this.from_input || !this.to_input)
			return;
		
		//console.log( new Date(inputToTimestamp(this.from_input.value, true)),
		//	new Date(inputToTimestamp(this.to_input.value, false)) );
		interface StatsResponseSchema {
			error: ERROR_CODES;
			data: {
				count: number;
				date: Readonly<[number, number, number]>;//YYYY, MM, DD
			}[]
		}
		
		let res: StatsResponseSchema = await ServerApi.postRequest('/get_user_visit_statistics', {
			token: Account.getToken(),//for authorization
			user_id: this.props.user.id,
			from: Utils.inputToTimestamp(this.from_input.value, true),
			to: Utils.inputToTimestamp(this.to_input.value, false)
		});
		
		//console.log( res );
		if(res['error'] !== ERROR_CODES.SUCCESS) {
			this.props.onError(res.error);
			return;
		}
		
		if(this.visits_chart && this.visits_chart.chartInstance.data.datasets) {
			this.visits_chart.chartInstance.data.datasets[0].data = res['data'].map(d => {
				return {
					x: Utils.arrToDate(d.date),
					y: d.count
				}
			});
			this.visits_chart.chartInstance.update();
		}
	}
	
	render() {
		return <div style={offsetTop} className={'admin-powers'}>
			<div style={offsetTop}>
				<div style={{
					display: 'inline-grid',
					gridTemplateColumns: '1fr 1fr',
					gridTemplateRows: 'fit-content(100%) auto',
					gridColumnGap: '15px'
				}}>
					<label>FROM:</label>
					<label>TO:</label>
					<input type={'date'} ref={el => this.from_input = el}/>
					<input type={'date'} ref={el => this.to_input = el}/>
				</div>
				<br/>
				<button style={offsetTop} onClick={this.refresh.bind(this)}>REFRESH</button>
			</div>
			<LineChart width={this.props.container ? 600 : 400} height={400} ref={chart => this.visits_chart = chart}
			           data={DEFAULT_DATA} options={Utils.LINE_CHART_OPTIONS} />
		</div>;
	}
}