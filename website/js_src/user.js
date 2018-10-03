(function() {
	'use strict';

	let body_loader = null;

	function onUserNotFound() {
		$$('#user_info_error').setText('User not found');
	}

	function loadUserInfo(id, games_page) {
		$$('#user_nickname').append( body_loader = COMMON.createLoader() );

		$$.postRequest('/user_info', {id: id, fetch_games: true, page: games_page}, res => {
			if(body_loader)
				body_loader.remove();

			res = JSON.parse(res);

			//console.log(res);
			
			if(res.result !== "SUCCESS") {
				$$("#user_info_error").setText( "User not found" );
				return;
			}

			var extract = key => res[key];

			Object.entries({
				user_nickname: 'NICK', 
				user_register_date: 'REGISTER_DATE',
				user_last_seen_date: 'LAST_SEEN',
			}).forEach(entry => $$("#"+entry[0]).setText(extract(entry[1])) );

			try {
				$$("#user_level").setText( JSON.parse(res.CUSTOM_DATA).level );
				$$("#user_rank").setText( (JSON.parse(res.CUSTOM_DATA).rank||1000)|0 );
			}
			catch(e) {
				$$("#user_info_error").setText( "Incorrect CUSTOM_DATA format" );
				console.error(e);
			}

			//LAST GAMES
			if(res.GAMES === undefined || res.GAMES.length === 0) {
				$$('#last_games_preview').setText('No games in history')
					.setStyle({display: 'inline-block'});
			}
			else {
				let games_table = COMMON.createGamesList(res.GAMES, id|0);

				if(res.total_games > res.rows_per_page) {//at least two pages
					let pages_container = COMMON.createPagesRow(res.total_games, res.rows_per_page, 
						res.page, '/user/' + id + '?page=');
					games_table.append( $$.create('TR').append(pages_container) );
				}

				$$('#last_games_preview').setStyle({
					display: 'inline-grid'
				}).append( games_table );
			}
		});
	}

	$$.load(() => {
		let current_page = 0;
		try {
			current_page = parseInt( location.href.match(/\?page=([0-9]+)/i)[1] );
		}
		catch(e) {}

		try {
			let id = document.location.href.match(/user\/([0-9]+)[^0-9]*/i)[1];
			loadUserInfo(id, current_page);
		}
		catch(e) {
			console.log('?');
			onUserNotFound();
		}
	});
})();