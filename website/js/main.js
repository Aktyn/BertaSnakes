"use strict";
///<reference path="utils.ts"/>
var COMMON = {
    createLoader: function (color) {
        var spin_style = { backgroundColor: color || '#f44336' };
        return $$.create('DIV').addClass('spinner').addChild($$.create('DIV').addClass('double-bounce1').setStyle(spin_style)).addChild($$.create('DIV').addClass('double-bounce2').setStyle(spin_style));
    },
    makeUserLink: function (id, vertical) {
        if (vertical === void 0) { vertical = false; }
        return $$.create('A').setStyle({
            backgroundImage: vertical ? 'url(/img/icons/more_vert.png)'
                : 'url(/img/icons/more_hor.png)',
            backgroundSize: 'cover',
            display: 'inline-block',
            height: '30px',
            width: '30px'
        }).addClass('icon_btn').setAttrib('href', '/user/' + id);
    },
    makeGameLink: function (id) {
        return $$.create('A').setStyle({
            'backgroundImage': 'url(/img/icons/more_hor.png)',
            'backgroundSize': 'cover',
            'display': 'inline-block',
            'height': '30px',
            'width': '30px'
        }).addClass('icon_btn').setAttrib('href', '/game/' + id);
    },
    makeRankWidget: function (rank, rank_reward) {
        var arrow = $$.create('SPAN').html(rank_reward >= 0 ? '&#9650;' : '&#9660;').setStyle({
            'margin': '0px 2px',
            'color': (rank_reward >= 0 ? '#9CCC65' : '#e57373')
        });
        var widget = $$.create('SPAN').addChild($$.create('SPAN').setText(Math.round(rank))).addChild(arrow).addChild($$.create('SPAN').setText((rank_reward >= 0 ? '+' : '') + Math.round(rank_reward)));
        //widget.innerText += rank_reward;
        return widget;
    },
    createGamesList: function (games_array, user_id) {
        var _this = this;
        var gamemode_names = ['Cooperation', 'Competition'];
        var table = $$.create('TABLE').setStyle({ display: 'inline-table' }).addChild(//game info
        $$.create('TR')
            .addChild($$.create('TH').setText('Name'))
            .addChild($$.create('TH').setText('Map'))
            .addChild($$.create('TH').setText('Game Mode'))
            .addChild($$.create('TH').setText('Duration'))
            .addChild($$.create('TH').setText('Finish time'))
            .addChild($$.create('TH').setText('Pos.'))
            .addChild($$.create('TH').setText('Rank'))
            .addChild($$.create('TH').setText(''))).addClass('dark_evens');
        games_array.forEach(function (game_info) {
            //console.log(game_info);
            var duration = game_info.DURATION >= 60 ? (game_info.DURATION / 60 + ' min') :
                game_info.DURATION + ' sec';
            var result = JSON.parse(game_info.RESULT).players_results;
            for (var pos = 0; pos < result.length; pos++) {
                if (result[pos].user_id === user_id) {
                    //let rank_gain = result[pos].rank|0;
                    table.addChild($$.create('TR')
                        //.addChild( $$.create('TD').setText(game_info.ID) )
                        .addChild($$.create('TD').setText(game_info.NAME))
                        .addChild($$.create('TD').setText(game_info.MAP))
                        .addChild($$.create('TD').setText(gamemode_names[game_info.GAMEMODE]))
                        .addChild($$.create('TD').setText(duration))
                        .addChild($$.create('TD').setText(game_info.TIME))
                        .addChild($$.create('TD').setText(pos + 1 + '/' + result.length))
                        .addChild($$.create('TD').addChild(_this.makeRankWidget(result[pos].rank || 0, result[pos].rank_reward || 0)))
                        .addChild($$.create('TD').setStyle({ padding: '0px 10px' })
                        .addChild(_this.makeGameLink(game_info.ID))));
                    break;
                }
            }
        });
        //container.addChild(table);
        return table;
    },
    createPagesRow: function (total_items, items_per_page, page_id, base_redirect_url) {
        var total_pages = Math.ceil(total_items / items_per_page);
        var pages_container = $$.create('TD').setAttrib('colspan', 42).addClass('pages_control');
        var visible_page_buttons = 5; //should be odd integer
        var page_shift = Math.floor(visible_page_buttons / 2);
        var min_page = Math.max(0, page_id - page_shift);
        var max_page = Math.min(total_pages - 1, page_id + page_shift);
        var makeBlock = function (i) {
            var block = $$.create('A').setText(i);
            if (typeof base_redirect_url === 'string')
                block.attribute('href', base_redirect_url + (i - 1));
            else if (typeof base_redirect_url === 'function')
                block.on('click', function () { return base_redirect_url(i - 1); });
            else
                throw new Error('last argument must be either type of string or function');
            return block;
        };
        if (min_page > 0) {
            pages_container.addChild(makeBlock(1)).addChild($$.create('SPAN').setText('...'));
        }
        for (var i = min_page; i <= max_page; i++) {
            var page_btn = makeBlock(i + 1);
            if (i === page_id)
                page_btn.addClass('current');
            pages_container.addChild(page_btn);
        }
        if (max_page < total_pages - 1) {
            pages_container.addChild($$.create('SPAN').setText('...')).addChild(makeBlock(total_pages));
        }
        return pages_container;
    }
};
$$.load(function () {
    'use strict';
    //additional toys
    var type_str = "";
    window.addEventListener('keydown', function (e) {
        if (!e || !e.key)
            return;
        type_str += e.key.toLowerCase();
        if (!"tetris".startsWith(type_str) && !"fractal".startsWith(type_str))
            type_str = "";
        if (type_str === 'tetris')
            $$.loadScript('webjs/tetris.js', true);
        //$.loadScript('js/utilsV2.js', true, () => $.loadScript('js/tetris.js', true));
        else if (type_str === 'fractal')
            $$.loadScript('webjs/egg.js', true);
    }, false);
    //$$.loadScript('js/bg.js', true);
    function onSession(logged_in) {
        $$("#account_icon").attribute("src", logged_in ? "img/account_on.png" : "img/account.png");
        $$("#account_href").attribute("href", logged_in ? "/account" : "login");
        //if user is logged in but in /login page
        if (logged_in === true && location.href.match(/\/login([\/?]|$)/i) !== null)
            location.href = '/account'; //redirect to account info
    }
    if (document.cookie.match(/user_session/i) !== null) { //detect user_session cookie
        $$.postRequest('restore_session', {}, function (pre_res) {
            if (pre_res === undefined)
                return;
            var res = JSON.parse(pre_res);
            onSession(res.result === 'SUCCESS');
        });
    }
    else
        onSession(false);
});
