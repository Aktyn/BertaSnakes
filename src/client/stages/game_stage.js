Stage.GAME_STAGE = Stage.GAME_STAGE || (function() {

	function makeRankWidget(rank, rank_reward) {
		let arrow = $$.create('SPAN').html(rank_reward >= 0 ? '&#9650;' : '&#9660;').setStyle({
			'margin': '0px 2px',
			'color': (rank_reward >= 0 ? '#9CCC65' : '#e57373')
		});
		let widget = $$.create('SPAN').append(
			$$.create('B').setText(Math.round(rank))
		).append(arrow).append(
			$$.create('SPAN').setText((rank_reward >= 0 ? '+' : '') + Math.round(rank_reward))
		);

		return widget;
	}

	function showGameResults(result) {
		let result_table = $$.create('TABLE').setClass('result_table').append(
			//table header
			$$.create('TR')
				.append( $$.create('TH').setText('') )//position
				.append( $$.create('TH').setText('Nick') )
				.append( $$.create('TH').setText('Points') )
				.append( $$.create('TH').setText('Kills') )
				.append( $$.create('TH').setText('Deaths') )
				.append( $$.create('TH').setText('EXP') )
				.append( $$.create('TH').setText('Coins') )
				.append( $$.create('TH').setText('Rank') )
		);

		let results_node = $$.create('DIV').setClass('game_result_table').append(
			$$.create('H6').setText('Game results')
		).append(
			$$.create('DIV').setClass('result_body').append( result_table )
		).append(
			$$.create('DIV').addClass('bottom_panel').append(//bottom panel for options
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
					.setText('EXIT').on('click', () => {
						try 	{	Network.leaveRoom();	}
						catch(e){	console.error('cannot send leave room request: ', e); }
					})
			)
		);

		var current_user = Network.getCurrentUser();

		result.players_results.sort((a, b) => b['points'] - a['points']).forEach((res, index) => {
			// console.log(res);
			result_table.append(
				$$.create('TR')
					.append( $$.create('TD').setText(index + 1) )//position
					.append( $$.create('TD').setText( res['nick'] ) )//nick
					.append( $$.create('TD').setText( res['points'] ) )//points
					.append( $$.create('TD').setText( res['kills'] ) )//kills
					.append( $$.create('TD').setText( res['deaths'] ) )//deaths
					.append( $$.create('TD').setText('+' + Math.floor(res['exp']*100) + '%') )//exp
					.append( $$.create('TD').setText('+' + res['coins']) )//coins
					.append( $$.create('TD').append(
						makeRankWidget(res['rank'], res['rank_reward'])//rank
					) )
			);

			//seems that current user leveled up
			if(current_user.id === res.user_id && current_user.custom_data['exp']+res['exp'] >= 1.0) {
				let new_lvl = current_user.level + 1;
				
				HeaderNotifications.addNotification('Your level is now ' + new_lvl);

				//display if new level actualy unlocking something
				if(Object.values(Skills).some(s => s.lvl_required === new_lvl) || 
						Player.SHIP_LVL_REQUIREMENTS.some(lr => lr === new_lvl)) {
					HeaderNotifications.addNotification(
						'Check out shop for new items which you have unlocked');
				}
			}
		});

		//NOTE - popup_container class from popup.css
		$$(document.body).append($$.create('DIV').setClass('popup_container')
			.append( results_node ));
		
		$$('CANVAS').setStyle({
			'filter': 'blur(10px)',
			'transition': 'filter 2s ease-in-out'
		});
		$$.expand($$('CANVAS'), $$.getScreenSize(), true);
	}

	return class extends Stage {
		constructor()  {
			super();
			console.log('GAME_STAGE');

			this.panel = new GamePanel();//extends Chat

			$$(document.body).setStyle({
				height: '100vh',
				width: '100vw',
				display: 'block',
				overflow: 'hidden'
			});

			$$(document.body).append( this.panel.createPanelWidget() );

			try {
				Network.getCurrentRoom().users.forEach(u => this.panel.addUser(u));
				this.panel.onRoomJoined();
			}
			catch(e) {
				console.error(e);
			}
				
			// this.game = new ClientGame(Maps['Open Maze'], result => {
			this.game = new ClientGame(Maps.getByName(Network.getCurrentRoom().map), result => {
				if(result !== true)
					throw new Error('Cannot start the game');

				//WHEN EVERYTHING LOADED CORRECTLY - SENDING CONFIMATION TO SERVER
				if(Network.amISitting())
					Network.confirmGameStart();
			});
		}

		destroy() {
			this.panel = null;
			if(this.game)
				this.game.destroy();
		}

		onServerDisconnect() {
			this.change(Stage.LOBBY_STAGE);
		}

		onServerMessage(data) {//JSON message
			//console.log(data);
			console.log(Object.keys(NetworkCodes).find((key,i)=>i===data.type), data);
			try {
				switch(data['type']) {
					case NetworkCodes.ACCOUNT_DATA:
						if(this.current_popup instanceof Stage.Popup.ACCOUNT)
							this.current_popup.onAccountData(data['data'], data['friends']);
						break;
					case NetworkCodes.TRANSACTION_ERROR:
						if(this.current_popup instanceof Stage.Popup.ACCOUNT)
							this.current_popup.onTransactionError(data['error_detail']);
						break;
					case NetworkCodes.START_GAME_FAIL:
						this.change(Stage.LOBBY_STAGE);
						break;
					case NetworkCodes.LEAVE_ROOM_CONFIRM:
						this.change(Stage.LOBBY_STAGE);
						break;
					case NetworkCodes.USER_JOINED_ROOM:
						this.panel.addUser( UserInfo.fromJSON(data['user_info']) );
						break;
					case NetworkCodes.USER_LEFT_ROOM:
						this.panel.removeUserByID( data['user_id'] );
						break;
					case NetworkCodes.RECEIVE_CHAT_MESSAGE:
						this.panel.onMessage(data);
						break;
					case NetworkCodes.START_ROUND_COUNTDOWN:
						this.game.startGame(
							data['game_duration'], data['round_delay'], data['init_data']);
						//showGameResults();//TEMP
						break;
					case NetworkCodes.END_GAME:
						this.game.end();
						showGameResults( GameResult.fromJSON( data['result']) );
						break;
				}
			}
			catch(e) {
				console.error(e);
			}
		}
	};
})();