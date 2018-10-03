Stage.Popup.SHOP = Stage.Popup.SHOP || (function() {

	return class extends Stage.Popup.ACCOUNT {
		constructor() {
			console.log('ACCOUNT POPUP');
			super(true);

			this.popup_html.getChildren('#popup_title').setText('SHOP');

			this.popup_body.append(//create account info
				$$.create('DIV').setStyle({'display': 'inline-block'}).append(
					$$.create('SPAN').attribute('id', 'account_level')
				).append( 
					$$.create('BR')//separator
				).append(
					$$.create('SPAN').attribute('id', 'account_coins')
				)
			);

			this.ships_list = $$.create('DIV').addClass('ships_list');
			this.skills_list = $$.create('DIV').addClass('skills_list');

			this.popup_body.append( [this.ships_list, this.skills_list] );

			Network.requestAccountData();
		}

		close() {
			super.close();
		}

		onAccountData(data, friends) {
			super.exitConfirmation();
			try {
				$$('.description').forEach(d => d.remove());
			} catch(e) {}

			data = data || {};
			super.fixAccountData(data);

			this.popup_html.getChildren('#account_level').html('Level: <b>' + data['level'] + '</b>');
			this.popup_html.getChildren('#account_coins').html('Coins: <b>' + data['coins'] + '</b>');


			this.ships_list.html('');		
			Object.values(Player.TYPES).forEach((type, i) => {
				let ship_widget = WIDGETS_CREATOR.createShipWidget(type, this);
				
				if(data['level'] >= Player.SHIP_LVL_REQUIREMENTS[i]) {
					if(data['avaible_ships'].indexOf(i) !== -1)//avaible for user to use
						ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.BOUGHT);
					else//user must buy this ship before be able to use it
						ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.TO_BUY);
				}
				else//ship not avaible for user level
					ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.LOCKED);

				this.ships_list.append( ship_widget.domElement );
			});

			this.skills_list.html('');
			Object.values(Skills).filter(s => typeof s === 'object' && s.name).sort((a, b) => {
				return a.lvl_required - b.lvl_required;
			}).forEach(skill => {
				let skill_widget = WIDGETS_CREATOR.createSkillWidget(skill, this);

				// console.log('skill id:', skill.id);

				if(data['level'] >= skill.lvl_required) {
					if(data['avaible_skills'].indexOf(skill.id) !== -1)//avaible for user to use
						skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.BOUGHT);
					else
						skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.TO_BUY);
				}
				else
					skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.LOCKED);

				
				this.skills_list.append( skill_widget.domElement );
			});
		}
	};
})();