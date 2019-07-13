import * as React from 'react';
import ContainerPage, {ContainerProps} from "./container_page";

import { Line as LineChart } from 'react-chartjs-2';
import {ChartOptions} from 'chart.js';

import '../styles/admin_panel.scss';

const CHART_OPTIONS: ChartOptions = {
	// maintainAspectRatio: false,
	title: {
		text: 'Pages visit',
		display: true,
		fontStyle: 'normal',
		padding: 10
	},
    scales: {
        yAxes: [{
            ticks: {
                beginAtZero: true
            },
            gridLines: {
            	display: true,
            	color: '#bbb',
            	lineWidth: 1,
            	zeroLineWidth: 0,
            	drawBorder: true
            }
        }],
        xAxes: [{
        	type: 'time',
        	time: {
	         	unit: 'day',
	         	displayFormats: { day: 'DD-MM-YYYY' },
	         	//minUnit: 'days'
            },
        	gridLines: {
            	display: false
            }
        }]
    },
    legend: {
    	display: true
    },
    // spanGaps
};

const DEFAULT_DATA = {
    datasets: [{
        label: 'All',
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

interface AdminPageState extends ContainerProps {

}

// noinspection JSUnusedGlobalSymbols
export default class AdminPage extends React.Component<any, AdminPageState> {
	state: AdminPageState = {
		error: undefined,
		loading: false,
		show_navigator: false,
	};
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
	
	}
	
	/*private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}*/
	
	render() {
		return <ContainerPage key={'rankings'} className={'admin-panel'} {...this.state}>
			<div className={'statistics'}>
				<LineChart width={600} height={400} /*ref={(chart: any) => this.visits_chart = chart}*/
			           data={DEFAULT_DATA} options={CHART_OPTIONS} />
			</div>
		</ContainerPage>;
	}
}