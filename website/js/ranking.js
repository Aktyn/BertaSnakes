"use strict";
///<reference path="utils.ts"/>
///<reference path="main.ts"/>
(function () {
    var body_loader = null;
    function loadRanking(page_nr) {
        $$.postRequest('/ranking_request', { page: page_nr }, function (pre_res) {
            if (body_loader)
                body_loader.remove();
            if (pre_res === undefined)
                return;
            var res = JSON.parse(pre_res);
            if (res.result !== 'SUCCESS')
                return;
            console.log(res);
            var ranking_table = $$.create('TABLE').addClass('dark_evens').setStyle({
                backgroundColor: '#fff',
                boxShadow: '0px 2px 6px #0003',
                color: '#555'
            }).addChild($$.create('TR')
                .addChild($$.create('TH').setText(''))
                .addChild($$.create('TH').setText('Username'))
                .addChild($$.create('TH').setText('Rank'))
                .addChild($$.create('TH').setText('')));
            res.user_infos.forEach(function (user, index) {
                ranking_table.addChild($$.create('TR')
                    .addChild($$.create('TD').setText(res.page * res.rows_per_page + index + 1))
                    .addChild($$.create('TD').setText(user.NICK))
                    .addChild($$.create('TD').setText(user.RANK))
                    .addChild($$.create('TD').addChild(COMMON.makeUserLink(user.ID)).setStyle({
                    padding: '5px'
                })));
            });
            //pages panel
            var pages_container = COMMON.createPagesRow(res.total_users, res.rows_per_page, res.page, '/ranking?page=');
            ranking_table.addChild($$.create('TR').addChild(pages_container));
            $$(document.body).addChild($$.create('MAIN').addChild(ranking_table));
        });
    }
    //----------------------------------------------------------------//
    $$.load(function () {
        $$("#topbar").getChildren('a[href="ranking"]').addClass('current'); //highlight topbar bookmark
        $$(document.body).addChild(body_loader = COMMON.createLoader('#f4f4f4'));
        var current_page = 0;
        try {
            //@ts-ignore
            current_page = parseInt(location.href.match(/\?page=([0-9]+)/i)[1]);
        }
        catch (e) { }
        loadRanking(current_page);
    });
})();
