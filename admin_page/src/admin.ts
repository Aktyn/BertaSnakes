///<reference path="utils.ts"/>
///<reference path="chart.ts"/>

interface VisitJSON {
	IP: string, 
	TIME: string
}

function createVisitsChart(VISITS: VisitJSON[]) {
	let chart = new Chart(800, 400);

	let daily_visits: {[index: string]: number} = {};

	VISITS.map((visit) => visit.TIME.replace(/\ [0-9]{2}:[0-9]{2}/, ''))
		.forEach(date => daily_visits[date] = (daily_visits[date] || 0) + 1);

	let chart_data: DataJSON[] = Object.keys(daily_visits).sort((a, b) => {
		return a.localeCompare(b);
	}).map(key => {
		return {x_value: key, y_value: daily_visits[key]};
	});
	chart.feedWithData(chart_data);

	return chart.getCanvas();
}

function createVisitsTable(VISITS: VisitJSON[]) {
	let visits_table = $.create('TABLE').addClass('dark_evens').setStyle({'width': '100%'}).add(
		$.create('TR')
			.add( $.create('TH').setText('IP') )
			.add( $.create('TH').setText('TIME') )
	);

	const cell_style = {
		'white-space': 'nowrap', 
		'text-align': 'left'};

	VISITS.forEach((visit: VisitJSON) => {
		//console.log(visit);
		visits_table.add(
			$.create('TR')
				.add( $.create('TD').setStyle(cell_style).setText( visit.IP ) )
				.add( $.create('TD').setStyle(cell_style).setText( visit.TIME ) )
		);
	});

	return visits_table;
}

function refreshStatistics() : void {
	$('#statistics_container').setText('loading...');

	$.postRequest('statistics_request', {
		from: $('input[name="stats_from_date"]').value + ' 00:00',
		to: $('input[name="stats_to_date"]').value + '23:59'
	}, (unparsed_res) => {
		if(unparsed_res === undefined)
			return;
		let res : {result: string, VISITS: VisitJSON[]} = JSON.parse(unparsed_res);

		if(res.result !== 'SUCCESS') {
			$('#statistics_container').setText('Cannot fetch data');
			return;
		}

		$('#visits_table_container').html('').add( 
			$.create('DIV').add( createVisitsTable(res.VISITS) ).setStyle({
				'max-height': '500px',
				'overflow-y': 'auto'
			}) 
		);
		$('#visits_chart_container').html('').add( createVisitsChart(res.VISITS) );
	});
}

$.load(() => {
	try {
		let today_date = new Date().toLocaleDateString();//DD.MM.YYYY
		let date_in_array = today_date.split('.').reverse();//['YYYY', 'MM', 'DD']

		$('input[name="stats_to_date"]').attribute('value', date_in_array.join('-'));//YYYY-MM-DD

		date_in_array[2] = '01';
		$('input[name="stats_from_date"]').attribute('value', date_in_array.join('-'));//YYYY-MM-01
	}
	catch(e) {
		console.error(e);
	}

	$('#ban_user_btn').on('click', e => {
		let user_name = $('input[name="user_to_ban"]').value;
		$.postRequest('ban_user_admin_request', {username: user_name}, (unparsed_res) => {
			if(unparsed_res === undefined)
				return;
			let res = JSON.parse(unparsed_res);

			if(res.result !== 'SUCCESS') {
				if(res.result === 'USER_NOT_FOUND')
					$('#ban_info').setText('Cannot find user or he is already banned');
				else
					$('#ban_info').setText('Only Admin can ban other users.');
				return;
			}

			$('#ban_info').setText('User banned');
		});
	});

	$('#stats_refresh_btn').on('click', refreshStatistics);

	refreshStatistics();//refresh after page load
});