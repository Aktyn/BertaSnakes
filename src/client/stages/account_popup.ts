///<reference path="../common/utils.ts"/>
///<reference path="../common/common.ts"/>
///<reference path="../common/gui_widgets_creator.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="../chat.ts"/>
///<reference path="stage.ts"/>
///<reference path="shop_popup.ts"/>

///<reference path="../engine/network.ts"/>

///<reference path="../../include/user_info.ts"/>

// Stage.Popup.ACCOUNT = Stage.Popup.ACCOUNT || (function() {
namespace Popup {

	function createFriendWidget(friend_data: FriendInfoI, self: Account) {
		let friend_panel = $$.create('DIV').addChild(
			$$.create('H2')
				.setText(friend_data.nick + (friend_data.online !== true ? ' (offline)' : ''))
		).addChild(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('Open Chat').setStyle({
					'margin': '15px 20px',
					'display': (friend_data.online === true ? 'inline-block' : 'none')
				}).on('click', () => {
					if(Chat.currentInstance === null)
						return;
					let new_bookmark = Chat.currentInstance.addBookmark(
						friend_data.id, friend_data.nick, false);
					if(new_bookmark)
						Chat.currentInstance.selectBookmark( new_bookmark );
					Chat.currentInstance.setHidden(false);
					// self.exitConfirmation();
					self.close();
				})
		).addChild(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('Delete').setStyle({'margin': '15px 20px'}).on('click', () => {
					//TODO - delete friend confirmation
					Network.sendRemoveFriendRequest(friend_data.id);
					self.exitConfirmation();
				})
		).addChild(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
				.setText('Return').setStyle({'margin': '5px 10px'}).on('click', () => {
					self.exitConfirmation();
				})
		).setStyle({'textAlign': 'center', 'min-width': '350px'});

		let widget = $$.create('DIV').setText(friend_data.nick).on('click', () => {
			//if(friend_data.is_online === true)
			self.showConfirmation( friend_panel, 'Friend options' );
		});

		if(friend_data.online !== true)
			widget.addClass('offline');

		return widget;
	}

	export class Account extends Stages.PopupBase {
		protected popup_body: $_face;
		protected popup_html: $_face;
		protected ships_list?: $_face;
		protected skills_list?: $_face;
		private skills_bar?: $_face;
		private friends_list?: $_face;

		private preserved_header?: string;

		private slots: SkillSlotSchema[] = [];//skill slots

		constructor(prevent_auto_init: boolean) {
			super();

			this.popup_body = $$.create('DIV').setAttrib('id', 'popup_main')
				.addClass('account_popup_main');

			this.popup_html = $$.create('DIV').addClass('popup_container').addChild(
				//popup window
				$$.create('DIV').addClass('popup').addClass('zoom_in').addChild(//title
					$$.create('DIV').addClass('header')
						.addChild( 
							$$.create('SPAN').setStyle( {margin: '0px 50px'} )
								.setAttrib('id', 'popup_title').setText('User account')
						)
						.addChild( $$.create('DIV').addClass('close_btn')
							.addClass('opacity_and_rot_transition')
							.setStyle({'float': 'right', marginLeft: '-50px'})
							.on('click', e => this.close()) 
						)
				).addChild(
					this.popup_body
				).addChild(
					$$.create('DIV').setAttrib('id', 'confirmation_main')
						.addClass('account_popup_main')
				)
			).on('click', e => {
				if(e.srcElement === this.popup_html)
					this.close();
			});

			$$(document.body).addChild( this.popup_html );

			if(prevent_auto_init === true)
				return;

			console.log('ACCOUNT POPUP');

			this.ships_list = $$.create('DIV').addClass('ships_list');
			this.skills_list = $$.create('DIV').addClass('skills_list');
			this.skills_bar = $$.create('DIV').setClass('skills_slots');

			// this.slots = [];

			this.friends_list = $$.create('DIV').addClass('friends_list');

			let rank_info = $$.create('DIV').addClass('account_row').addChild(
				$$.create('SPAN').setAttrib('id', 'account_rank').setStyle({
					'margin': 'auto'
				})
			).setStyle( {'textAlign': 'center'} );

			let level_info = $$.create('DIV').addClass('account_row').addChild(//level info
				$$.create('SPAN').setAttrib('id', 'account_level') 
			).addChild(//exp widget
				$$.create('SPAN').setClass('exp_widget').addChild(//exp info
					$$.create('DIV').setAttrib('id', 'account_exp') )
			);

			let coins_info = $$.create('DIV').addClass('account_row').addChild(//coins info
				$$.create('SPAN').setAttrib('id', 'account_coins').setStyle({
					'line-height': '35px',
					'marginRight': '15px'
				})
			)/*.addChild( $$.create('SPAN').setClass('coin_widget') )*/.addChild(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_coin')
					.setText('SPEND').on('click', () => {
						this.close();
						let current_stage = Stages.getCurrent();
						if(current_stage)
							current_stage.popup(Popup.Shop);
					})
			);

			this.popup_body.addChild(
				$$.create('DIV').setStyle({display: 'inline-block'})
					.addChild( [rank_info, level_info, coins_info] )
			).addChild( [this.ships_list, this.skills_list, this.skills_bar, this.friends_list] );
			try {
				this.popup_body.addChild(
					COMMON.createLoader().setAttrib('id', 'account_popup_loader'));
				
			}
			catch(e) {
				console.log('Cannot create loader');
			}

			Network.requestAccountData();
		}

		close() {
			this.popup_html.remove();
			super.close();
		}

		showConfirmation(node_obj: $_face, title = '') {
			this.popup_html.getChildren('#popup_main')
				.setStyle({display: 'none'});
			this.popup_html.getChildren('#confirmation_main')
				.setStyle({display: 'block'}).html('').addChild( node_obj );

			this.preserved_header = $$('#popup_title').innerHTML;
			$$('#popup_title').setText(title);
		}

		exitConfirmation() {
			this.popup_html.getChildren('#popup_main')
				.setStyle({display: 'block'});
			this.popup_html.getChildren('#confirmation_main')
				.setStyle({display: 'none'}).html('');

			if(this.preserved_header)
				$$('#popup_title').setText( this.preserved_header );
		}

		onTransactionError(error_detail: string) {
			//console.log('transaction error:', error_detail);

			var error_message = (code => {
				switch(error_detail) {
					default: 
						return 'Unknown error';
					case 'ship_already_avaible': 
						return 'You already have this ship bought';
					case 'skill_already_avaible': 
						return 'You already have this skill bought';
					case 'not_enough_coins': 
						return 'Not enough coins';
					case 'insufficient_level': 
						return 'Level too low';
				}
				throw new Error('Impossible error');
			})(error_detail);

			this.showConfirmation(
				$$.create('DIV').addChild(
					$$.create('DIV').addClass('account_row')
						.html('Transaction failed:&nbsp;<b>' + error_message + '</b>')
				).addChild(
					$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
						.setText('RETURN').on('click', () => this.exitConfirmation())
				), 'Transaction'
			);
		}

		fixAccountData(data: UserCustomData) {
			data['level'] = data['level'] || 1;
			data['rank'] = data['rank'] || 0;
			data['coins'] = data['coins'] || 0;
			data['ship_type'] = data['ship_type'] || 0;
			data['skills'] = data['skills'] || [];
			data['avaible_ships'] = data['avaible_ships'] || [0];
			data['avaible_skills'] = data['avaible_skills'] || [];
		}

		onAccountData(data: UserCustomData, friends: FriendInfoI[]) {
			this.exitConfirmation();
			try {
				$$('.description').forEach((d: $_face) => d.remove());
			} catch(e) {}

			console.log(data, friends);

			data = data || {};
			this.fixAccountData(data);
			
			let exp_percent = Math.floor( (data['exp'] || 0) * 100 ) + '%';
			this.popup_html.getChildren('#account_exp')
				.setStyle({width: exp_percent}).setText(exp_percent);

			this.popup_html.getChildren('#account_rank').setText('Rank: ' + Math.floor(data['rank']));
			this.popup_html.getChildren('#account_level').html('Level: <b>' + data['level'] + '</b>');
			this.popup_html.getChildren('#account_coins').html('Coins: <b>' + data['coins'] + '</b>');

			if(this.ships_list === undefined || this.skills_list === undefined)
				throw new Error('No ships_list or skills_list created');

			this.ships_list.html('');
			data['avaible_ships'].forEach(ship => {
				let ship_widget = WIDGETS_CREATOR.createShipWidget(ship, this);
				
				if(ship === data['ship_type'])
					ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.IN_USE);
				else
					ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.NORMAL);
				if(this.ships_list)
					this.ships_list.addChild( ship_widget.domElement );
			});

			this.skills_list.html('');

			data['avaible_skills'].forEach(skill => {
				
				var found_skill = Skills.getById(skill);
				if(found_skill === undefined)
					throw new Error('Cannot find skill with id: ' + skill);
				
				let skill_widget = WIDGETS_CREATOR.createSkillWidget(
					<SkillsScope.SkillData><unknown>found_skill, this, true);
				
				if(data['skills'].indexOf(skill) === -1) {
					skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.NORMAL);
					if(this.skills_list)
						this.skills_list.addChild( skill_widget.domElement );
				}
				
			});

			//this.skills_bar.html('');
			while(data['skills'].length > this.slots.length) {
				let slot = WIDGETS_CREATOR.createSkillSlot(this.slots.length+1);
				this.slots.push( slot );
				if(this.skills_bar)
					this.skills_bar.addChild( slot.domElement );
			}
			while(data['skills'].length < this.slots.length) {
				let slot = this.slots.pop();
				if(slot)
					slot.domElement.remove();
			}

			//for(let i=0; i<this.slots.length; i++) {
			this.slots.forEach((slot, i) => {
				slot.setSkill( <SkillsScope.SkillData><unknown>data['skills'][i] );

				let left = i > 0;// && data['skills'][i-1] === null;
				let right = i+1 < this.slots.length;// && data['skills'][i+1] === null;
				slot.allowDirections(left, right);

				slot.onLeft(() => {
					if(left !== true)	return;
					//swapping
					let temp = data['skills'][i-1];
					data['skills'][i-1] = data['skills'][i];
					data['skills'][i] = temp;

					Network.requestSkillsOrder( data['skills'] );
				});

				slot.onRight(() => {
					if(right !== true)	return;
					//swapping
					let temp = data['skills'][i+1];
					data['skills'][i+1] = data['skills'][i];
					data['skills'][i] = temp;

					Network.requestSkillsOrder( data['skills'] );
				});
			});

			try {
				//@ts-ignore
				friends = friends || Network.getCurrentUser().friends;
				$$('#account_popup_loader').remove();
			}
			catch(e) {}

			///////////////////////////////
			if(this.friends_list)
				this.friends_list.html('');

			friends.forEach(f => {
				if(this.friends_list)
					this.friends_list.addChild(
						createFriendWidget({
							id: f.id, 
							nick: COMMON.trimString(f['nick'], 12),
							online: f['online'] === true
						}, this)
					);
			});
		}
	}
}//)();