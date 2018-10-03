(function() {
	'use strict';

	let body_loader = null;

	function loadAccountInfo(games_page) {
		$$('#account_nickname').append( body_loader = COMMON.createLoader() );

		$$.postRequest('/restore_session', {fetch_games: true, page: games_page}, res => {
			if(body_loader)
				body_loader.remove();

			res = JSON.parse(res);

			//console.log(res);

			if(res.result !== 'SUCCESS') {
				location.href = '/login';
				return;
			}

			var extract = key => res[key];

			Object.entries({
				account_nickname: 'NICK', 
				account_register_date: 'REGISTER_DATE',
				account_email: 'EMAIL'
			}).forEach(entry => { $$("#"+entry[0]).innerText = extract(entry[1]); });

			try {
				$$("#account_level").setText( JSON.parse(res.CUSTOM_DATA).level );
				$$("#account_rank").setText( (JSON.parse(res.CUSTOM_DATA).rank||1000)|0 );
				$$('#account_games').setText( res.total_games );
			}
			catch(e) {
				console.error(e);
			}

			//GAMES LIST
			if(res.GAMES === undefined || res.GAMES.length === 0) {
				$$('#last_games_preview').setText('No games in history')
					.setStyle({display: 'inline-block'});
			}
			else {
				let games_table = COMMON.createGamesList(res.GAMES, res.ID);

				if(res.total_games > res.rows_per_page) {//at least two pages
					let pages_container = COMMON.createPagesRow(res.total_games, res.rows_per_page, 
						res.page, '/account?page=');
					games_table.append( $$.create('TR').append(pages_container) );
				}

				$$('#last_games_preview').setStyle({
					display: 'inline-grid'
				}).append( games_table );
			}
		});
	}

	function logout() {
		$$.postRequest('/logout_request', {}, res => {
			res = JSON.parse(res);
			console.log(res);
			if(res.result !== "SUCCESS")
				throw Error("Cannot logout");
			//remove cookie
			document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
			location.href = '/login';
		});
	}

	$$.load(() => {
		let current_page = 0;
		try {
			current_page = parseInt( location.href.match(/\?page=([0-9]+)/i)[1] );
		}
		catch(e) {}

		loadAccountInfo(current_page);

		$$('#account_logout').on('click', logout);
	});
})();