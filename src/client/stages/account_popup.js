Stage.Popup.ACCOUNT = Stage.Popup.ACCOUNT || (function() {

	function createFriendWidget(friend_data, self) {//@friend_data - {id: user_id, nick: 'string'}
		let friend_panel = $$.create('DIV').append(
			$$.create('h2')
				.setText(friend_data.nick + (friend_data.is_online !== true ? ' (offline)' : ''))
		).append(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('Open Chat').setStyle({
					'margin': '15px 20px',
					'display': (friend_data.is_online === true ? 'inline-block' : 'none')
				}).on('click', () => {
					Chat.currentInstance.selectBookmark( 
						Chat.currentInstance.addBookmark(friend_data.id, friend_data.nick, false)
					);
					Chat.currentInstance.setHidden(false);
					// self.exitConfirmation();
					self.close();
				})
		).append(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('Delete').setStyle({'margin': '15px 20px'}).on('click', () => {
					//TODO - delete friend confirmation
					Network.sendRemoveFriendRequest(friend_data.id);
					self.exitConfirmation();
				})
		).append(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
				.setText('Return').setStyle({'margin': '5px 10px'}).on('click', () => {
					self.exitConfirmation();
				})
		).setStyle({'textAlign': 'center', 'min-width': '350px'});

		let widget = $$.create('DIV').setText(friend_data.nick).on('click', () => {
			//if(friend_data.is_online === true)
			self.showConfirmation( friend_panel, 'Friend options' );
		});

		if(friend_data.is_online !== true)
			widget.addClass('offline');

		return widget;
	}

	return class extends Stage.Popup {
		constructor(prevent_auto_init) {
			super();

			this.popup_body = $$.create('DIV').attribute('id', 'popup_main')
				.addClass('account_popup_main');

			this.popup_html = $$.create('DIV').addClass('popup_container').append(
				//popup window
				$$.create('DIV').addClass('popup').addClass('zoom_in').append(//title
					$$.create('DIV').addClass('header')
						.append( $$.create('SPAN').setStyle( {margin: '0px 50px'} )
						.setText('User account').attribute('id', 'popup_title') )
						.append( $$.create('DIV').addClass('close_btn')
							.addClass('opacity_and_rot_transition')
							.setStyle({'float': 'right', marginLeft: '-50px'})
							.on('click', e => this.close()) 
						)
				).append(
					this.popup_body
				).append(
					$$.create('DIV').attribute('id', 'confirmation_main')
						.addClass('account_popup_main')
				)
			).on('click', e => {
				if(e.srcElement === this.popup_html)
					this.close();
			});

			$$(document.body).append( this.popup_html );

			if(prevent_auto_init === true)
				return;

			console.log('ACCOUNT POPUP');

			this.ships_list = $$.create('DIV').addClass('ships_list');
			this.skills_list = $$.create('DIV').addClass('skills_list');
			this.skills_bar = $$.create('DIV').setClass('skills_slots');

			this.slots = [];//skill slots

			this.friends_list = $$.create('DIV').addClass('friends_list');

			let rank_info = $$.create('DIV').addClass('account_row').append(
				$$.create('SPAN').attribute('id', 'account_rank').setStyle({
					'margin': 'auto'
				})
			).setStyle( {'textAlign': 'center'} );

			let level_info = $$.create('DIV').addClass('account_row').append(//level info
				$$.create('SPAN').attribute('id', 'account_level') 
			).append(//exp widget
				$$.create('SPAN').setClass('exp_widget').append(//exp info
					$$.create('DIV').attribute('id', 'account_exp') )
			);

			let coins_info = $$.create('DIV').addClass('account_row').append(//coins info
				$$.create('SPAN').attribute('id', 'account_coins').setStyle({
					'line-height': '35px',
					'marginRight': '15px'
				})
			)/*.append( $$.create('SPAN').setClass('coin_widget') )*/.append(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_coin')
					.setText('SPEND').on('click', () => {
						this.close();
						Stage.getCurrent().popup(Stage.Popup.SHOP);
					})
			);

			this.popup_body.append(
				$$.create('DIV').setStyle({display: 'inline-block'})
					.append( [rank_info, level_info, coins_info] )
			).append( [this.ships_list, this.skills_list, this.skills_bar, this.friends_list] ).append(
				COMMON.createLoader().attribute('id', 'account_popup_loader')
			);

			Network.requestAccountData();
		}

		close() {
			this.popup_html.remove();
			super.close();
		}

		showConfirmation(node_obj, title) {
			this.popup_html.getChildren('#popup_main')
				.setStyle({display: 'none'});
			this.popup_html.getChildren('#confirmation_main')
				.setStyle({display: 'block'}).html('').append( node_obj );

			this.preserved_header = $$('#popup_title').html();
			$$('#popup_title').setText(title || '');
		}

		exitConfirmation() {
			this.popup_html.getChildren('#popup_main')
				.setStyle({display: 'block'});
			this.popup_html.getChildren('#confirmation_main')
				.setStyle({display: 'none'}).html('');

			$$('#popup_title').setText( this.preserved_header );
		}

		onTransactionError(error_detail) {
			console.log('transaction error:', error_detail);

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
				$$.create('DIV').append(
					$$.create('DIV').addClass('account_row')
						.html('Transaction failed:&nbsp;<b>' + error_message + '</b>')
				).append(
					$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
						.setText('RETURN').on('click', () => this.exitConfirmation())
				), 'Transaction'
			);
		}

		fixAccountData(data) {
			data['level'] = data['level'] || 1;
			data['rank'] = data['rank'] || 0;
			data['coins'] = data['coins'] || 0;
			data['ship_type'] = data['ship_type'] || 0;
			data['skills'] = data['skills'] || [];
			data['avaible_ships'] = data['avaible_ships'] || [0];
			data['avaible_skills'] = data['avaible_skills'] || [];
		}

		onAccountData(data, friends) {
			this.exitConfirmation();
			try {
				$$('.description').forEach(d => d.remove());
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

			this.ships_list.html('');
			data['avaible_ships'].forEach(ship => {
				let ship_widget = WIDGETS_CREATOR.createShipWidget(ship, this);
				if(ship === data['ship_type'])
					ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.IN_USE);
				else
					ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.NORMAL);
				this.ships_list.append( ship_widget.domElement );
			});

			this.skills_list.html('');

			data['avaible_skills'].forEach(skill => {
				let skill_widget = WIDGETS_CREATOR.createSkillWidget(skill, this, true);
				
				if(data['skills'].indexOf(skill) === -1) {
					skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.NORMAL);
					this.skills_list.append( skill_widget.domElement );
				}
				
			});

			//this.skills_bar.html('');
			while(data['skills'].length > this.slots.length) {
				let slot = WIDGETS_CREATOR.createSkillSlot(this.slots.length+1);
				this.slots.push( slot );
				this.skills_bar.append( slot.domElement );
			}
			while(data['skills'].length < this.slots.length) {
				let slot = this.slots.pop();
				slot.domElement.remove();
			}

			//for(let i=0; i<this.slots.length; i++) {
			this.slots.forEach((slot, i) => {
				slot.setSkill( data['skills'][i] );

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
				friends = friends || Network.getCurrentUser().friends;
				$$('#account_popup_loader').remove();
			}
			catch(e) {}

			///////////////////////////////
			this.friends_list.html('');

			friends.forEach(f => {
				this.friends_list.append(
					createFriendWidget({
						id: f.id, 
						nick: COMMON.trimString(f['nick'], 12),
						is_online: f['online'] === true
					}, this)
				);
			});
		}
	};
})();