///<reference path="../../include/game/game_result.ts"/>
///<reference path="../../include/game/common/skills.ts"/>
///<reference path="../../include/game/objects/player.ts"/>
///<reference path="../engine/network.ts"/>
///<reference path="../game_panel.ts"/>
///<reference path="../game/client_game.ts"/>
///<reference path="../game_panel.ts"/>
///<reference path="../game/client_game.ts"/>
///<reference path="../common/utils.ts"/>

///<reference path="lobby_stage.ts"/>

namespace Stages {
	export class GAME_STAGE extends Stages.StageBase {
		private static makeRankWidget = (rank: number, rank_reward: number) => {
			let arrow = $$.create('SPAN').html(rank_reward >= 0 ? '&#9650;' : '&#9660;').setStyle({
				'margin': '0px 2px',
				'color': (rank_reward >= 0 ? '#9CCC65' : '#e57373')
			});
			let widget = $$.create('SPAN').addChild(
				$$.create('B').setText(Math.round(rank))
			).addChild(arrow).addChild(
				$$.create('SPAN').setText((rank_reward >= 0 ? '+' : '') + Math.round(rank_reward))
			);

			return widget;
		};

		private static showGameResults = (results: PlayerResultJSON[]) => {
			let result_table = $$.create('TABLE').setClass('result_table').addChild(
				//table header
				$$.create('TR')
					.addChild( $$.create('TH').setText('') )//position
					.addChild( $$.create('TH').setText('Nick') )
					.addChild( $$.create('TH').setText('Points') )
					.addChild( $$.create('TH').setText('Kills') )
					.addChild( $$.create('TH').setText('Deaths') )
					.addChild( $$.create('TH').setText('EXP') )
					.addChild( $$.create('TH').setText('Coins') )
					.addChild( $$.create('TH').setText('Rank') )
			);

			let results_node = $$.create('DIV').setClass('game_result_table').addChild(
				$$.create('H6').setText('Game results')
			).addChild(
				$$.create('DIV').setClass('result_body').addChild( result_table )
			).addChild(
				$$.create('DIV').addClass('bottom_panel').addChild(//bottom panel for options
					$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
						.setText('EXIT').on('click', () => {
							try 	{	Network.leaveRoom();	}
							catch(e){	console.error('cannot send leave room request: ', e); }
						})
				)
			);

			var current_user = Network.getCurrentUser();

			results.sort((a, b) => b['points'] - a['points']).forEach((res, index) => {
				// console.log(res);
				result_table.addChild(
					$$.create('TR')
						.addChild( $$.create('TD').setText(index + 1) )//position
						.addChild( $$.create('TD').setText( res['nick'] ) )//nick
						.addChild( $$.create('TD').setText( res['points'] ) )//points
						.addChild( $$.create('TD').setText( res['kills'] ) )//kills
						.addChild( $$.create('TD').setText( res['deaths'] ) )//deaths
						.addChild( $$.create('TD').setText('+' + Math.floor(res['exp']*100) + '%') )
						.addChild( $$.create('TD').setText('+' + res['coins']) )//coins
						.addChild( $$.create('TD').addChild(
							GAME_STAGE.makeRankWidget(res['rank'], res['rank_reward'])//rank
						) )
				);

				//seems that current user leveled up
				if(current_user !== null && current_user.id === res.user_id && 
					current_user.custom_data['exp']+res['exp']>=1.0) 
				{
					let new_lvl = current_user.level + 1;
					
					HeaderNotifications.addNotification('Your level is now ' + new_lvl);

					//display if new level actualy unlocking something
					if(Object.keys(Skills).map(key => Skills[key]).some(s => 
						(<any>s).lvl_required === new_lvl) || 
						Objects.Player.SHIP_LVL_REQUIREMENTS.some((lr: any) => lr === new_lvl)) {
						HeaderNotifications.addNotification(
							'Check out shop for new items which you have unlocked');
					}
				}
			});

			//NOTE - popup_container class from popup.css
			$$(document.body).addChild($$.create('DIV').setClass('popup_container')
				.addChild( results_node ));
			
			$$('CANVAS').setStyle({
				'filter': 'blur(10px)',
				'transition': 'filter 2s ease-in-out'
			});
			$$.expand($$('CANVAS'), $$.getScreenSize(), true);
		};

		private static makeGameLoaderIndication = () => {
			return $$.create('DIV').addClass('popup_container').setStyle({'background': 'none'})
				.addChild(
					$$.create('SPAN').setStyle({
						'background': '#216e72',
					    'padding': '20px 20px 0px 20px',
					    'border': '1px solid #fff5',
					    'border-radius': '10px'
					}).setText('Waiting for everyone to load game.').addChild(
						COMMON.createLoader('#f4f4f4')
					)
				);
		};

		private panel: GamePanel;
		private game?: ClientGame.Game;

		constructor()  {
			//GamePanel
			super();
			console.log('GAME_STAGE');

			this.panel = new GamePanel();//extends Chat

			$$(document.body).addChild( this.panel.panel_widget );
			$$(document.body).addChild( 
				GAME_STAGE.makeGameLoaderIndication().setAttrib('id', 'waiting_indicator') 
			);

			try {
				//@ts-ignore
				Network.getCurrentRoom().users.forEach(u => this.panel.addUser(u));
				this.panel.onRoomJoined();
			}
			catch(e) {
				console.error(e);
			}
				
			// this.game = new ClientGame(Maps['Open Maze'], result => {
			var curr_room = Network.getCurrentRoom();
			if(curr_room !== null) {

				var map = Maps.getByName(curr_room.map);
				if(!map)
					throw new Error('Map not found: ' + curr_room.map);
				
				this.game = new ClientGame.Game(map, (result: boolean) => {
					if(result !== true)
						throw new Error('Cannot start the game');

					//WHEN EVERYTHING LOADED CORRECTLY - SENDING CONFIMATION TO SERVER
					if(Network.amISitting())
						Network.confirmGameStart();
				});
			}
		}

		destroy() {
			this.panel.destroy();
			//@ts-ignore
			this.panel = null;
			if(this.game)
				this.game.destroy();
		}

		onServerConnected() {}

		onServerDisconnect() {
			this.change(LOBBY_STAGE);
		}

		onServerMessage(data: NetworkPackage) {//JSON message
			//console.log(data);
			// console.log(Object.keys(NetworkCodes).find((key,i)=>i===data.type), data);
			try {
				switch(data['type']) {
					case NetworkCodes.ACCOUNT_DATA:
						if(this.current_popup instanceof Popup.Account)
							this.current_popup.onAccountData(data['data'], data['friends']);
						break;
					case NetworkCodes.TRANSACTION_ERROR:
						if(this.current_popup instanceof Popup.Account)
							this.current_popup.onTransactionError(data['error_detail']);
						break;
					case NetworkCodes.START_GAME_FAIL:
						this.change(LOBBY_STAGE);
						break;
					case NetworkCodes.LEAVE_ROOM_CONFIRM:
						this.change(LOBBY_STAGE);
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
						try {
							$$('#waiting_indicator').delete();
						}
						catch(e) {}
						if(this.game)
							this.game.startGame(
								data['game_duration'], data['round_delay'], data['init_data']);
						//showGameResults();//TEMP
						break;
					case NetworkCodes.END_GAME:
						if(this.game)
							this.game.end();
						GAME_STAGE.showGameResults(
							GameResult.fromJSON( data['result'] ).players_results );
						break;
				}
			}
			catch(e) {
				console.error(e);
			}
		}
	}
}