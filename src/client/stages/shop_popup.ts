///<reference path="account_popup.ts"/>
///<reference path="../../include/game/objects/player.ts"/>

// Stage.Popup.SHOP = Stage.Popup.SHOP || (function() {
namespace Popup {

	export class Shop extends Popup.Account {
		constructor() {
			console.log('ACCOUNT POPUP');
			super(true);

			this.popup_html.getChildren('#popup_title').setText('SHOP');

			this.popup_body.addChild(//create account info
				$$.create('DIV').setStyle({'display': 'inline-block'}).addChild(
					$$.create('SPAN').setAttrib('id', 'account_level')
				).addChild( 
					$$.create('BR')//separator
				).addChild(
					$$.create('SPAN').setAttrib('id', 'account_coins')
				)
			);

			this.ships_list = $$.create('DIV').addClass('ships_list');
			this.skills_list = $$.create('DIV').addClass('skills_list');

			this.popup_body.addChild( [this.ships_list, this.skills_list] );

			Network.requestAccountData();
		}

		close() {
			super.close();
		}

		onAccountData(data: UserCustomData, friends: FriendInfoI[]) {
			super.exitConfirmation();
			try {
				$$('.description').forEach((d: $_face) => d.remove());
			} catch(e) {}

			data = data || {};
			super.fixAccountData(data);

			this.popup_html.getChildren('#account_level').html('Level: <b>' + data['level'] + '</b>');
			this.popup_html.getChildren('#account_coins').html('Coins: <b>' + data['coins'] + '</b>');

			if(this.ships_list === undefined || this.skills_list === undefined)
				throw new Error('No ships_list or skills_list');

			this.ships_list.html('');	

			//@ts-ignore
			Object.keys(Player.TYPES).map(key => Player.TYPES[key]).forEach((type: number, i) => {
				let ship_widget = WIDGETS_CREATOR.createShipWidget(type, this);
				
				if(data['level'] >= Player.SHIP_LVL_REQUIREMENTS[i]) {
					if(data['avaible_ships'].indexOf(i) !== -1)//avaible for user to use
						ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.BOUGHT);
					else//user must buy this ship before be able to use it
						ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.TO_BUY);
				}
				else//ship not avaible for user level
					ship_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.LOCKED);

				if(this.ships_list)
					this.ships_list.addChild( ship_widget.domElement );
			});

			this.skills_list.html('');
			Object.keys(Skills).map(key => Skills[key])
				.filter(s => typeof s === 'object' && (<SkillsScope.SkillData>s).name).sort((a, b) => {
					return (<SkillsScope.SkillData>a).lvl_required - 
						(<SkillsScope.SkillData>b).lvl_required;
				}).forEach((skill: any) => {
					let skill_widget = 
						WIDGETS_CREATOR.createSkillWidget(<SkillsScope.SkillData>skill, this);

					// console.log('skill id:', skill.id);

					if(data['level'] >= skill.lvl_required) {
						if(data['avaible_skills'].indexOf(skill.id) !== -1)//avaible for user to use
							skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.BOUGHT);
						else
							skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.TO_BUY);
					}
					else
						skill_widget.setState(WIDGETS_CREATOR.WIDGET_STATES.LOCKED);
					
					if(this.skills_list)
						this.skills_list.addChild( skill_widget.domElement );
				});
		}
	}
}//)();