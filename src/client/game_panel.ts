///<reference path="common/utils.ts"/>
///<reference path="common/common.ts"/>
///<reference path="chat.ts"/>
///<reference path="engine/device.ts"/>
///<reference path="engine/settings.ts"/>

//const GamePanel = (function() {

class GamePanel extends Chat {
	private static id = 0;
	private static RIGHT_PANEL_WIDTH = 250;

	public panel_widget: $_face;
	//private input: $_face | null = null;

	private folded = false;
	private added_users_entries: {id: number, nodes: $_face[]}[] = [];

	constructor() {
		super();

		GamePanel.id++;

		//this.panel_widget = null;
		this.panel_widget = this.createPanelWidget();

		if(Device.info.is_mobile)
			this.initFullscreenRequest();

		// this.folded = false;

		if(SETTINGS.game_panel_auto_hide)
			this.panel_slide();

		// this.added_users_entries = [];

		setTimeout(() => {
			if(this.input) this.input.blur();
		});//regain focus to canvas
	}

	destroy() {

	}

	/*get widget() {
		return this.panel_widget || $$(document.body);
	}*/

	panel_slide() {
		this.folded = !this.folded;

		if(!this.folded)
			this.panel_widget.removeClass('folded');
		else
			this.panel_widget.addClass('folded');
	}

	addUser(user: UserInfo) {
		let users_list = this.panel_widget.getChildren('.users_list');
		if(!users_list)
			return;

		//store array of DOM nodes associated with user
		let user_nodes = COMMON.createUserEntry(user);
		this.added_users_entries.push({
			id: user.id,
			nodes: user_nodes
		});
		users_list.addChild( user_nodes );

		// COMMON.createUserEntry(user, users_list);
		COMMON.createUserEntry(user);
	}

	removeUserByID(user_id: number) {
		$$.assert(typeof user_id === 'number', 'user_id must be a number');

		for(let i=0; i<this.added_users_entries.length; i++) {
			let entry = this.added_users_entries[i];
			if(entry.id === user_id) {
				entry.nodes.forEach(node => node.remove());
				this.added_users_entries.splice(i, 1);
				i--;
			}
		}
	}

	private initFullscreenRequest() {
		var popup_request = $$.create('DIV').addClass('fullscreen_request_popup')
			.addClass('hide_in_fullscreen').addChild(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_fullscreen')
					.addClass('red_button').setText('GO FULLSCREEN').on('click', () => {
						if(Device.goFullscreen() === true) {
							popup_request.delete();
						}
						Device.setOrientation(Device.Orientation.LANDSCAPE);
					}).setStyle({
						'padding': '20px 15px 20px 20px'
					})
			);

		$$(document.body).addChild(popup_request);

		setTimeout(() => {//autoremove button auto some period of time
			popup_request.addClass('fade_out');
			setTimeout(() => popup_request.delete(), 1000);//synchronize with fading animation
		}, 5000);
	}

	private askForLobbyLeave() {
		$$('#exit_to_lobby').setStyle({'display': 'none'});
		$$('#game_exit_confirm').setStyle({'display': 'initial'});

		let instance_id = GamePanel.id;
		setTimeout(() => {
			if(instance_id !== GamePanel.id)//check if this is same class instance
				return;
			$$('#exit_to_lobby').setStyle({'display': 'initial'});
			$$('#game_exit_confirm').setStyle({'display': 'none'});
		}, 5000);
	}

	private createPanelWidget() {
		if(this.panel_widget)
			return this.panel_widget;

		let panel_slider = $$.create('BUTTON').setClass('panel_slide_btn')
			.addClass('opacity_and_rot_transition').on('click', () => {
				this.panel_slide();
				panel_slider.blur();
			});

		this.panel_widget = $$.create('DIV').addClass('game_gui_right').setStyle({
			'width': '' + GamePanel.RIGHT_PANEL_WIDTH + 'px'
		}).addChild(//panel header
			$$.create('DIV').addClass('header').addChild(
				$$.create('IMG').addClass('icon_btn')
					.setAttrib('src', 'img/icons/settings.png').on('click', () => {
						let curr_stage = Stage.getCurrent();
						if(curr_stage)
							curr_stage.popup(<PopupDerived><unknown>Popup.SettingsPop);
					})
			).addChild(
				$$.create('IMG').addClass('icon_btn')
					.setAttrib('src', 'img/account.png').on('click', () => {
						let curr_stage = Stage.getCurrent();
						if(curr_stage)
							curr_stage.popup(<PopupDerived><unknown>Popup.Account);
					})
			)
		).addChild(//list of users
			$$.create('DIV').addClass('users_list_container').addChild(
				$$.create('DIV').addClass('users_list')
			)
		).addChild(/*buttons*/
			$$.create('DIV').setClass('panel_buttons').addChild(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
					.setText('CONFIRM').setStyle({'display': 'none'})
					.setAttrib('id', 'game_exit_confirm').on('click', () => {
						try 	{	Network.leaveRoom();	}
						catch(e){	console.error('cannot send leave room request: ', e); }
					})
			).addChild(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
					.setText('EXIT TO LOBBY').setAttrib('id', 'exit_to_lobby').on('click', () => {
						this.askForLobbyLeave();
					})
			).addChild(
				$$.create('IMG').addClass('icon_btn').setAttrib('id', 'fullscreen_switcher_small')
					.addClass('hide_in_fullscreen')
					.setAttrib('src', 'img/icons/fullscreen_open.svg')
					.on('click', () => {
						//if(!Device.info.fullscreen) {
						Device.goFullscreen();
						Device.setOrientation(Device.Orientation.LANDSCAPE);
						//}
					})
			)
		).addChild(//chat widget
			//super.createWidget().setStyle({
			this.chat_widget.setStyle({
				'width': '' + GamePanel.RIGHT_PANEL_WIDTH + 'px',
			})
		).addChild( panel_slider );

		if(Device.info.is_mobile)
			this.chat_widget.addClass('mobile_mode');

		// Device.goFullscreen();

		return this.panel_widget;
	}
}
// })();