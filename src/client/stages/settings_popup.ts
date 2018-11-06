///<reference path="../common/utils.ts"/>
///<reference path="../common/common.ts"/>
///<reference path="../common/gui_widgets_creator.ts"/>
///<reference path="../engine/settings.ts"/>
///<reference path="stage.ts"/>

// Stage.Popup.SETTINGS = Stage.Popup.SETTINGS || (function() {
namespace Popup {
	if(typeof SETTINGS === 'undefined')
		throw "SETTINGS module must be loaded before SettingsPop class";
	var Settings = SETTINGS;

	const CATEGORIES = ['GAME', 'MENU', 'CHAT'];

	function createSwitcherEntry(text:string, onSwitch: (state:boolean) => void, is_enabled:boolean) {
		return $$.create('DIV').addChild(
			$$.create('LABEL').html(text)
		).addChild(
			(switcher => {
				if(is_enabled)
					switcher.addClass('on');
				return switcher;
			})( 
				COMMON.createSwitcher(onSwitch)
			)
		);
	}

	export class SettingsPop extends Stage.Popup {
		private popup_html: $_face;

		constructor() {
			super();
			console.log('SETTINGS POPUP');

			this.popup_html = $$.create('DIV').addClass('popup_container').addChild(
				//popup window
				$$.create('DIV').addClass('popup').addClass('zoom_in').addChild(//title
					$$.create('DIV').addClass('header')
						.addChild( $$.create('SPAN').setStyle({margin: '0px 50px'}).html('SETTINGS') )
						.addChild( $$.create('DIV').addClass('close_btn')
							.addClass('opacity_and_rot_transition')
							.setStyle({'float': 'right', marginLeft: '-50px'})
							.on('click', e => this.close()) 
						)
				).addChild(
					$$.create('DIV').addClass('category')
				).addChild(//side menu
					(() => {
						let menu = $$.create('DIV').addClass('menu');
						CATEGORIES.forEach(cat => {
							menu.addChild( $$.create('DIV').setText(cat)
								.on('click', () => this.setCategory(cat)) );
						});
						return menu;
					})()
				).addChild(//content
					$$.create('DIV').addClass('main').html('content')
				)/*.addChild(//horizontal panel with buttons
					$$.create('DIV').addClass('panel').html('apply?')
				)*/
			).on('click', e => {
				if(e.srcElement === this.popup_html)
					this.close();
			});

			$$(document.body).addChild( this.popup_html );

			this.setCategory( CATEGORIES[0] );
		}

		close() {
			Settings.saveAsCookies();
			this.popup_html.remove();
			super.close();
		}

		setCategory(category: string) {
			var index = CATEGORIES.indexOf(category);
			if(index === -1)
				return;
			try {
				$$('.popup').getChildren('.category').setText(category);
				$$('.popup').getChildren('.menu > *').forEach((cat_entry: $_face) => {
					if(cat_entry.innerHTML === category)
						cat_entry.addClass('current');
					else
						cat_entry.removeClass('current');
				});
				//removing current content
				var content = $$('.popup').getChildren('.main');
				content.setText('');

				switch(category) {
					case 'GAME': 	this.showGameSettings(content);	break;
					case 'MENU': 	this.showMenuSettings(content);	break;
					case 'CHAT': 	this.showChatSettings(content);	break;
				}
			}
			catch(e) {
				console.error('cannot change settings category: ', e);
			}
		}

		showGameSettings(div: $_face) {
			var createRefreshToApplyHelper = function() {
				let helper = $$.create('SPAN').setClass('help_mark');

				var helper_html = $$.create('DIV').setText(
					'In order to apply this option\'s change\nyou must refresh page.')
					.setStyle({
						'text-align': 'justify',
		    			'text-justify': 'auto'
					});

				WIDGETS_CREATOR.createDescription(helper_html, helper);

				return helper;
			};

			div.addChild(
				createSwitcherEntry('Auto hide right panel:', (enabled) => {
					Settings.game_panel_auto_hide = enabled;
				}, Settings.game_panel_auto_hide)
			).addChild(
				$$.create('DIV').addChild(
					$$.create('LABEL').setText('Painter resolution:').addChild(
						createRefreshToApplyHelper()
					)
				).addChild(
					COMMON.createOptionsList(['LOW', 'MEDIUM', 'HIGH'], opt => {
						Settings.painter_resolution = opt;
					}).selectOption(Settings.painter_resolution)
				)
			).addChild(
				$$.create('DIV').addChild(
					$$.create('LABEL').setText('Shadows type:').addChild(
						createRefreshToApplyHelper()
					)
				).addChild(
					$$.create('DIV').setStyle({'padding': '7px 0px'}).addChild(
						COMMON.createOptionsList(['FLAT', 'LONG'], opt => {
							Settings.shadows_type = opt;
						}).selectOption(Settings.shadows_type)
					)
				)
			)/*.addChild(
				$$.create('LABEL').setText('Particles').addClass('section_title')
			)*/.addChild(
				createSwitcherEntry('Weather particles:', (enabled) => {
					Settings.weather_particles = enabled;
				}, Settings.weather_particles)
			);
		}

		showMenuSettings(div: $_face) {
			div.addChild(
				createSwitcherEntry('Background effect:', (enabled) => {
					Settings.menu_background_effect = enabled;
					DustBackground.reload();
				}, Settings.menu_background_effect === true)
			).addChild(
				createSwitcherEntry('Click effect:', (enabled) => {
					Settings.menu_click_effect = enabled;
					DustBackground.reload();
				}, Settings.menu_click_effect === true)
			);
		}

		showChatSettings(div: $_face) {
			div.addChild(
				createSwitcherEntry('Auto hide/show chat:', (enabled) => {
					Settings.chat_auto_hide_show = enabled;
				}, Settings.chat_auto_hide_show === true)
			);
		}
	}
}
//})();