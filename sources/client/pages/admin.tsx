import * as React from 'react';
import ContainerPage, {ContainerProps} from "./container_page";
import { Line as LineChart } from 'react-chartjs-2';
import {offsetTop} from "../components/sidepops/sidepops_common";
import ServerApi from '../utils/server_api';
import Utils from '../utils/utils';
import Account from '../account';
import ERROR_CODES, {errorMsg} from "../../common/error_codes";

import '../styles/admin_panel.scss';

const DEFAULT_DATA = {
    datasets: [{
        label: 'Total',
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
    },
    {
    	label: 'Unique',
        data: [{
		    x: new Date(Date.now()-1000*60*60*24*7),
		    y: 0
		}, {
		    x: new Date(),
		    y: 0
		}],
        backgroundColor: [
            '#00695C60',
        ],
        borderColor: [
            '#00695C',
        ],
        borderWidth: 1
    }]
};

interface AdminPageState extends ContainerProps {}

// noinspection JSUnusedGlobalSymbols
export default class AdminPage extends React.Component<any, AdminPageState> {
	private from_input: HTMLInputElement | null = null;
	private to_input: HTMLInputElement | null = null;
	private visits_chart: LineChart | null = null;
	
	state: AdminPageState = {
		error: undefined,
		loading: false,
		show_navigator: false,
	};
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
		if(this.to_input)
			this.to_input.value = Utils.toInputFormat(Date.now());
		if(this.from_input)
			this.from_input.value = Utils.toInputFormat(Date.now() - 1000*60*60*24*7);
		
		this.refresh().catch(console.error);
	}
	
	private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}
	
	private async refresh() {
		if(!this.from_input || !this.to_input)
			return;
		
		//console.log( new Date(inputToTimestamp(this.from_input.value, true)),
		//	new Date(inputToTimestamp(this.to_input.value, false)) );
		interface StatsResponseSchema {
			error: ERROR_CODES;
			data: {
				total_visits: number,
				unique_visits: number,
				date: Readonly<[number, number, number]>//YYYY, MM, DD
			}[]
		}
		
		let res: StatsResponseSchema = await ServerApi.postRequest('/get_visit_statistics', {
			token: Account.getToken(),//for authorization
			from: Utils.inputToTimestamp(this.from_input.value, true),
			to: Utils.inputToTimestamp(this.to_input.value, false)
		});
		
		console.log( res );
		if(res['error'] !== ERROR_CODES.SUCCESS) {
			this.setError(errorMsg(res.error));
			return;
		}
		
		const arrToDate = (arr: Readonly<[number, number, number]>) => {
			let dt = new Date();
			dt.setFullYear( arr[0] );
			dt.setMonth(arr[1]-1 );
			dt.setDate( arr[2] );
			return dt;
		};
		
		if(this.visits_chart && this.visits_chart.chartInstance.data.datasets) {
			this.visits_chart.chartInstance.data.datasets[0].data = res['data'].map(d => {
				return {
					x: arrToDate(d.date),
					y: d.total_visits
				}
			});
			this.visits_chart.chartInstance.data.datasets[1].data = res['data'].map(d => {
				return {
					x: arrToDate(d.date),
					y: d.unique_visits
				}
			});
			this.visits_chart.chartInstance.update();
		}
	}
	
	render() {
		return <ContainerPage key={'rankings'} className={'admin-panel'} {...this.state}>
			<div className={'statistics'}>
				<div style={offsetTop}>
					<div style={{
						display: 'inline-grid',
						gridTemplateColumns: '1fr 1fr',
						gridTemplateRows: 'fit-content(100%) auto',
						gridColumnGap: '15px'
					}}>
						<label>FROM:</label>
						<label>TO:</label>
						<input type={'date'} ref={el => this.from_input = el} />
						<input type={'date'} ref={el => this.to_input = el} />
					</div>
					<br/>
					<button style={offsetTop} onClick={this.refresh.bind(this)}>REFRESH</button>
				</div>
				<LineChart width={600} height={400} ref={chart => this.visits_chart = chart}
			           data={DEFAULT_DATA} options={Utils.LINE_CHART_OPTIONS} />
			</div>
		</ContainerPage>;
	}
}