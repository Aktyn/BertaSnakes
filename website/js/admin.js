"use strict";
///<reference path="utils.ts"/>
///<reference path="chart.ts"/>
function createVisitsChart(VISITS) {
    var chart = new Chart(800, 400);
    var daily_visits = {};
    VISITS.map(function (visit) { return visit.TIME.replace(/\ [0-9]{2}:[0-9]{2}/, ''); })
        .forEach(function (date) { return daily_visits[date] = (daily_visits[date] || 0) + 1; });
    var chart_data = Object.keys(daily_visits).sort(function (a, b) {
        return a.localeCompare(b);
    }).map(function (key) {
        return { x_value: key, y_value: daily_visits[key] };
    });
    chart.feedWithData(chart_data);
    return chart.getCanvas();
}
function createVisitsTable(VISITS) {
    var visits_table = $$.create('TABLE').addClass('dark_evens').setStyle({ 'width': '100%' }).addChild($$.create('TR')
        .addChild($$.create('TH').setText('IP'))
        .addChild($$.create('TH').setText('TIME')));
    var cell_style = {
        'white-space': 'nowrap',
        'text-align': 'left'
    };
    VISITS.forEach(function (visit) {
        //console.log(visit);
        visits_table.addChild($$.create('TR')
            .addChild($$.create('TD').setStyle(cell_style).setText(visit.IP))
            .addChild($$.create('TD').setStyle(cell_style).setText(visit.TIME)));
    });
    return visits_table;
}
function refreshStatistics() {
    $$('#statistics_container').setText('loading...');
    $$.postRequest('statistics_request', {
        from: $$('input[name="stats_from_date"]').value + ' 00:00',
        to: $$('input[name="stats_to_date"]').value + '23:59'
    }, function (unparsed_res) {
        if (unparsed_res === undefined)
            return;
        var res = JSON.parse(unparsed_res);
        if (res.result !== 'SUCCESS') {
            $$('#statistics_container').setText('Cannot fetch data');
            return;
        }
        $$('#visits_table_container').html('').addChild($$.create('DIV').addChild(createVisitsTable(res.VISITS)).setStyle({
            'max-height': '500px',
            'overflow-y': 'auto'
        }));
        $$('#visits_chart_container').html('').addChild(createVisitsChart(res.VISITS));
    });
}
$$.load(function () {
    try {
        var today_date = new Date().toLocaleDateString(); //DD.MM.YYYY
        var date_in_array = today_date.split('.').reverse() //['YYYY', 'MM', 'DD']
            .map(function (xx) { return xx.length < 2 ? '0' + xx : xx; });
        $$('input[name="stats_to_date"]').setAttrib('value', date_in_array.join('-')); //YYYY-MM-DD
        date_in_array[2] = '01';
        $$('input[name="stats_from_date"]').setAttrib('value', date_in_array.join('-')); //YYYY-MM-01
    }
    catch (e) {
        console.error(e);
    }
    $$('#ban_user_btn').on('click', function () {
        var user_name = $$('input[name="user_to_ban"]').value;
        $$.postRequest('ban_user_admin_request', { username: user_name }, function (unparsed_res) {
            if (unparsed_res === undefined)
                return;
            var res = JSON.parse(unparsed_res);
            if (res.result !== 'SUCCESS') {
                if (res.result === 'USER_NOT_FOUND')
                    $$('#ban_info').setText('Cannot find user or he is already banned');
                else
                    $$('#ban_info').setText('Only Admin can ban other users.');
                return;
            }
            $$('#ban_info').setText('User banned');
        });
    });
    $$('#stats_refresh_btn').on('click', refreshStatistics);
    refreshStatistics(); //refresh after page load
});