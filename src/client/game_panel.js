const GamePanel = (function() {
	const RIGHT_PANEL_WIDTH = 250;

	return class extends Chat {
		constructor() {
			super();

			this._widget = null;
			this.createPanelWidget();

			this.folded = false;

			if(SETTINGS.game_panel_auto_hide)
				this.panel_slide();

			this.added_users_entries = [];


			setTimeout(() => this.input.blur());//regain focus to canvas
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

		addUser(user) {
			let users_list = this.widget.getChildren('.users_list');
			if(!users_list)
				return;

			//store array of DOM nodes associated with user
			let user_nodes = COMMON.createUserEntry(user);
			this.added_users_entries.push({
				id: user.id,
				nodes: user_nodes
			});
			users_list.append( user_nodes );

			COMMON.createUserEntry(user, users_list);
		}

		removeUserByID(user_id) {
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
				width: '' + RIGHT_PANEL_WIDTH + 'px'
			}).append(//panel header
				$$.create('DIV').addClass('header').append(
					$$.create('IMG').addClass('icon_btn')
						.attribute('src', 'img/icons/settings.png').on('click', 
						() => Stage.getCurrent().popup(Stage.Popup.SETTINGS))
				).append(
					$$.create('IMG').addClass('icon_btn')
						.attribute('src', 'img/account.png').on('click', 
						() => Stage.getCurrent().popup(Stage.Popup.ACCOUNT))
				)
			).append(//list of users
				$$.create('DIV').addClass('users_list_container').append(
					$$.create('DIV').addClass('users_list')
				)
			).append(/*buttons*/
				$$.create('DIV').setClass('panel_buttons').append(
					$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
						.setText('EXIT TO LOBBY').on('click', () => {
							try 	{	Network.leaveRoom();	}
							catch(e){	console.error('cannot send leave room request: ', e); }
						})
				)
			).append(//chat widget
				super.createWidget().setStyle({
					width: '' + RIGHT_PANEL_WIDTH + 'px',
				})
			).append( panel_slider );

			return this._widget;
		}
	};
})();