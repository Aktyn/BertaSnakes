import ERROR_CODES from '../../common/error_codes';
import Config from '../../common/config';
import {ChartOptions} from 'chart.js';

const DEFAULT_LABELS = {
	hours: '',
	minutes: '',
	seconds: ''
};

function zeroPad(num: number) {
	return num < 10 ? `0${num}` : num.toString();
}

export default {
	GAMEMODES_NAMES: ['Cooperation', 'Competition'],
	
	SHIP_TEXTURES: [
		require('../img/textures/players/type_1.png'),
		require('../img/textures/players/type_2.png'),
		require('../img/textures/players/type_3.png'),
	],

	openImageFile(max_size = Config.MAXIMUM_IMAGE_FILE_SIZE): Promise<string> {
		return new Promise((resolve, reject) => {
			let file_input = document.createElement('input');
			file_input.setAttribute('type', 'file');
			file_input.setAttribute('accept', 'image/*');
			file_input.onchange = (e) => {
				try {
					//@ts-ignore
					let file: File = e.target.files[0];
					if (!file) {
						// reject(new Error('Cannot open file'));
						reject( ERROR_CODES.CANNOT_OPEN_FILE );
						return;
					}

					if(file.size > max_size) {
						// reject(new Error('File too large'));
						reject( ERROR_CODES.FILE_TOO_LARGE );
						return;
					}

					let reader = new FileReader();
					reader.onload = (e) => {
						//@ts-ignore
						resolve(e.target.result);
					};
					//reader.readAsText(file);
					reader.readAsDataURL(file);
				}
				catch(e) {
					console.error(e);
					reject( ERROR_CODES.UNKNOWN );
				}
			};
			file_input.click();
		});
	},

	secondsToTime(sec: number, delimiter = ':', labels = DEFAULT_LABELS) {
		sec |= 0;
		let min = (sec/60)|0;
		sec -= min*60;
		let hour = (min/60)|0;
		min -= hour*60;
		if(hour > 0)
			return `${zeroPad(hour)}${labels.hours}${delimiter}${
			zeroPad(min)}${labels.minutes}${delimiter}${zeroPad(sec)}${labels.seconds}`;
		else if(min > 0)
			return `${zeroPad(min)}${labels.minutes}${delimiter}${zeroPad(sec)}${labels.seconds}`;
		else
			return `${zeroPad(sec)}${labels.seconds}`;
	},
	
	formatTime(timestamp: number) {
		let dt = new Date(timestamp);
		let now = new Date();
		let same_day = dt.getDate() === now.getDate() &&
			dt.getMonth() === now.getMonth() &&
			dt.getFullYear() === now.getFullYear();
		let h = dt.getHours();
		let m = dt.getMinutes();
		return (same_day ? '' : `${ zeroPad(dt.getDate()) }.${ zeroPad(dt.getMonth()+1) }.${dt.getFullYear()} `) +
			`${ zeroPad(h) }:${ zeroPad(m) }`;
	},

	trimString(str: string, max_len: number, suffix = '...') {
		if(str.length > max_len)
			return str.substr(0, max_len-suffix.length) + suffix;
		return str;
	},

	getScreenSize() {
		return {width: window.innerWidth, height: window.innerHeight};
	},
	
	toInputFormat(timestamp: number) {//returns date in format: YYYY-MM-DD
		let dt = new Date(timestamp);
		return `${ zeroPad(dt.getFullYear()) }-${ zeroPad(dt.getMonth()+1) }-${ zeroPad(dt.getDate()) }`;
	},
	
	arrToDate(arr: Readonly<[number, number, number]>) {
			let dt = new Date(0);
			dt.setFullYear( arr[0] );
			dt.setMonth(arr[1]-1 );
			dt.setDate( arr[2] );
			dt.setHours(0);
			return dt;
		},

	inputToTimestamp(date_string: string, clamp_down: boolean) {//date in format: YYYY-MM-DD
		try {
			let parts = date_string.split('-');
			let out_dt = new Date();
			
			out_dt.setFullYear( parseInt(parts[0]) );
			out_dt.setMonth( parseInt(parts[1])-1 );
			out_dt.setDate( parseInt(parts[2]) );
			
			if(clamp_down) {
				out_dt.setHours(0);
				out_dt.setMinutes(0);
				out_dt.setSeconds(0);
				out_dt.setMilliseconds(0);
			}
			else {
				out_dt.setHours(23);
				out_dt.setMinutes(59);
				out_dt.setSeconds(59);
				out_dt.setMilliseconds(0);
			}
			
			return out_dt.getTime();
		}
		catch(e) {
			console.error(e);
			return 0;
		}
	},
	
	createLineChartOptions(title_text: string, display_legend = true): ChartOptions {
		return <ChartOptions>{
			// maintainAspectRatio: false,
			title: {
				text: title_text,
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
						displayFormats: {day: 'DD-MM-YYYY'},
						//minUnit: 'days'
					},
					gridLines: {
						display: false
					}
				}]
			},
			legend: {
				display: display_legend
			},
			// spanGaps
		}
	}
};