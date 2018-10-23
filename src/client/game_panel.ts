///<reference path="common/utils.ts"/>
///<reference path="common/common.ts"/>
///<reference path="chat.ts"/>

//const GamePanel = (function() {

class GamePanel extends Chat {
	private static RIGHT_PANEL_WIDTH = 250;

	private _widget: $_face | null = null;
	//private input: $_face | null = null;

	private folded = false;
	private added_users_entries: {id: number, nodes: $_face[]}[] = [];

	constructor() {
		super();

		//this._widget = null;
		this.createPanelWidget();

		// this.folded = false;

		if(SETTINGS.game_panel_auto_hide)
			this.panel_slide();

		// this.added_users_entries = [];

		setTimeout(() => {
			if(this.input) this.input.blur();
		});//regain focus to canvas
	}

	get widget() {
		return this._widget || $$(document.body);
	}

	panel_slide() {
		this.folded = !this.folded;

		if(!this.folded)
			this.widget.removeClass('folded');
		else
			this.widget.addClass('folded');
	}

	addUser(user: UserInfo) {
		let users_list = this.widget.getChildren('.users_list');
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

	createPanelWidget() {
		if(this._widget !== null)
			return this._widget;

		let panel_slider = $$.create('BUTTON').setClass('panel_slide_btn')
			.addClass('opacity_and_rot_transition').on('click', () => {
				this.panel_slide();
				panel_slider.blur();
			});

		this._widget = $$.create('DIV').addClass('game_gui_right').setStyle({
			width: '' + GamePanel.RIGHT_PANEL_WIDTH + 'px'
		}).addChild(//panel header
			$$.create('DIV').addClass('header').addChild(
				$$.create('IMG').addClass('icon_btn')
					.setAttrib('src', 'img/icons/settings.png').on('click', 
					() => {
						let curr_stage = Stage.getCurrent();
						if(curr_stage)
							curr_stage.popup(<PopupDerived><unknown>Popup.Settings);
					})
			).addChild(
				$$.create('IMG').addClass('icon_btn')
					.setAttrib('src', 'img/account.png').on('click', 
					() => {
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
					.setText('EXIT TO LOBBY').on('click', () => {
						try 	{	Network.leaveRoom();	}
						catch(e){	console.error('cannot send leave room request: ', e); }
					})
			)
		).addChild(//chat widget
			//super.createWidget().setStyle({
			this.chat_widget.setStyle({
				width: '' + GamePanel.RIGHT_PANEL_WIDTH + 'px',
			})
		).addChild( panel_slider );

		return this._widget;
	}
}
// })();