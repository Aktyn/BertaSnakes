"use strict";
///<reference path="utils.ts"/>
///<reference path="main.ts"/>
(function () {
    var gamemode_names = ['Cooperation', 'Competition'];
    var body_loader = null;
    $$('#game_info_error').setStyle({ 'margin': '0px' });
    function onGameNotFound() {
        $$('#game_info_error').setText('Game not found');
    }
    function loadGameInfo(id) {
        $$('#game_details').addChild(body_loader = COMMON.createLoader());
        $$.postRequest('/game_info', { id: id }, function (raw_res) {
            if (body_loader)
                body_loader.remove();
            if (raw_res === undefined)
                return;
            var res = JSON.parse(raw_res);
            //console.log(res);
            if (res.result !== "SUCCESS") {
                onGameNotFound();
                return;
            }
            var result_rows = [];
            try {
                var results = JSON.parse(res.RESULT);
                results.players_results.forEach(function (p_r, index) {
                    result_rows.push($$.create('TR')
                        .addChild($$.create('TD').setText(index + 1))
                        .addChild($$.create('TD').setText(p_r.nick))
                        .addChild($$.create('TD').setText(p_r.level))
                        .addChild($$.create('TD').setText(p_r.points))
                        .addChild($$.create('TD').setText(p_r.kills))
                        .addChild($$.create('TD').setText(p_r.deaths))
                        .addChild($$.create('TD').addChild(p_r.rank ? COMMON.makeRankWidget(p_r.rank, p_r.rank_reward) :
                        $$.create('SPAN').setText('NO RANK DATA')))
                        .addChild($$.create('TD').addChild(p_r.user_id > 0 ? COMMON.makeUserLink(p_r.user_id) :
                        $$.create('SPAN'))));
                });
            }
            catch (e) {
                console.error(e);
            }
            $$('#game_details').addChild(
            //cointans game info table and result table
            $$.create('DIV').setStyle({ 'margin': '0px' }).addChild($$.create('TABLE').setStyle({ 'width': '100%' }).addChild(//game info
            $$.create('TR')
                //.addChild( $$.create('TH').setText('ID') )
                .addChild($$.create('TH').setText('Name'))
                .addChild($$.create('TH').setText('Map'))
                .addChild($$.create('TH').setText('Game Mode'))
                .addChild($$.create('TH').setText('Duration'))
                .addChild($$.create('TH').setText('Time'))).addChild($$.create('TR')
                //.addChild( $$.create('TD').setText(game_info.ID) )
                .addChild($$.create('TD').setText(res.NAME))
                .addChild($$.create('TD').setText(res.MAP))
                .addChild($$.create('TD').setText(gamemode_names[res.GAMEMODE]))
                .addChild($$.create('TD').setText(res.DURATION))
                .addChild($$.create('TD').setText(res.TIME)))).addChild($$.create('TABLE').setStyle({ 'width': '100%' }).addClass('dark_evens').addChild($$.create('TR').addChild($$.create('TH').setText('Result')
                .setAttrib('colspan', 8))).addChild($$.create('TR')
                .addChild($$.create('TH').setText(''))
                .addChild($$.create('TH').setText('Nick'))
                .addChild($$.create('TH').setText('Level'))
                .addChild($$.create('TH').setText('Points'))
                .addChild($$.create('TH').setText('Kills'))
                .addChild($$.create('TH').setText('Deaths'))
                .addChild($$.create('TH').setText('Rank'))
                .addChild($$.create('TH').setText('')))
                .addChild(result_rows)));
        });
    }
    $$.load(function () {
        try {
            //@ts-ignore
            var id = document.location.href.match(/game\/([0-9]+)[^0-9]*/i)[1];
            loadGameInfo(id);
        }
        catch (e) {
            onGameNotFound();
        }
    });
})();
