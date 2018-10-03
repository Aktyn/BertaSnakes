(function() {
	'use strict';

	const gamemode_names = ['Cooperation', 'Competition'];

	let body_loader = null;

	function onGameNotFound() {
		$$('#game_info_error').setText('Game not found');
	}

	function loadGameInfo(id) {
		$$('#game_details').append( body_loader = COMMON.createLoader() );

		$$.postRequest('/game_info', {id: id}, res => {
			if(body_loader)
				body_loader.remove();

			res = JSON.parse(res);

			console.log(res);
			
			if(res.result !== "SUCCESS") {
				onGameNotFound();
				return;
			}

			var result_rows = [];

			try {
				let results = JSON.parse( res.RESULT );
				results.players_results.forEach((p_r, index) => {//for each player's result
					result_rows.push(
						$$.create('TR')
							.append( $$.create('TD').setText(index+1) )
							.append( $$.create('TD').setText(p_r.nick) )
							.append( $$.create('TD').setText(p_r.level) )
							.append( $$.create('TD').setText(p_r.points) )
							.append( $$.create('TD').setText(p_r.kills) )
							.append( $$.create('TD').setText(p_r.deaths) )
							.append( $$.create('TD').append( 
								p_r.rank ? COMMON.makeRankWidget(p_r.rank, p_r.rank_reward) :
									$$.create('SPAN').setText('NO RANK DATA')
							) )
							.append( $$.create('TD').append(
								p_r.user_id > 0 ? COMMON.makeUserLink(p_r.user_id) :
									$$.create('SPAN')
							) )
					);
				});
			}
			catch(e) {
				console.error(e);
			}

			$$('#game_details').append(
				//cointans game info table and result table
				$$.create('DIV').setStyle({margin: '0px'}).append(
					$$.create('TABLE').setStyle({width: '100%'}).append(//game info
						$$.create('TR')
							//.append( $$.create('TH').setText('ID') )
							.append( $$.create('TH').setText('Name') )
							.append( $$.create('TH').setText('Map') )
							.append( $$.create('TH').setText('Game Mode') )
							.append( $$.create('TH').setText('Duration') )
							.append( $$.create('TH').setText('Time') )
					).append(
						$$.create('TR')
							//.append( $$.create('TD').setText(game_info.ID) )
							.append( $$.create('TD').setText(res.NAME) )
							.append( $$.create('TD').setText(res.MAP) )
							.append( $$.create('TD').setText( gamemode_names[res.GAMEMODE] ) )
							.append( $$.create('TD').setText(res.DURATION) )
							.append( $$.create('TD').setText(res.TIME) )
					)
				).append(
					$$.create('TABLE').setStyle({width: '100%'}).addClass('dark_evens').append(
						$$.create('TR').append( 
							$$.create('TH').setText('Result')
								.attribute('colspan', 8)
						)
					).append(
						$$.create('TR')
							.append( $$.create('TH').setText('') )
							.append( $$.create('TH').setText('Nick') )
							.append( $$.create('TH').setText('Level') )
							.append( $$.create('TH').setText('Points') )
							.append( $$.create('TH').setText('Kills') )
							.append( $$.create('TH').setText('Deaths') )
							.append( $$.create('TH').setText('Rank') )
							.append( $$.create('TH').setText('') )
					)
					.append(
						result_rows
					)
				)
			);
		});
	}

	$$.load(() => {
		try {
			let id = document.location.href.match(/game\/([0-9]+)[^0-9]*/i)[1];
			loadGameInfo(id);
		}
		catch(e) {
			onGameNotFound();
		}
	});
})();