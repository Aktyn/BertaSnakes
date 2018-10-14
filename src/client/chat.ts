///<reference path="common/utils.ts"/>

const Chat = (function() {
	var validate = function(msg: string) {//returns true when message is valid to send
		return typeof msg === 'string' && msg.length > 0;
	};

	const COLORS_PALETTE = ['#1a8ead', '#1aad83', '#ad431a', '#ad941a', '#3a1aad', '#831aad'];
	var color_iterator = 0;

	var getNextPaletteColor = () => {
		color_iterator %= COLORS_PALETTE.length;
		return COLORS_PALETTE[color_iterator++];
	};

	class BookMark {//TODO - AI bot bookmark for new users (tutorial purpouse)
		public id: number;
		public name: string;
		public is_room: boolean;

		public messages: $_face;
		public selector_btn: $_face;

		private onAnyActionCallback?: () => void;
		private onSelectCallback?: () => void;

		constructor(id: number, name: string, is_room: boolean) {
			this.id = id || 0;
			this.name = name;
			this.is_room = is_room;
			
			this.selector_btn = $$.create('SPAN').setText(name).on('click', () => {
				if(typeof this.onAnyActionCallback === 'function')
					this.onAnyActionCallback();
				if(typeof this.onSelectCallback === 'function')
					this.onSelectCallback();
			});

			this.messages = $$.create('DIV').addClass('chat_body');//.setText('test: ' + name);

			this.messages.on('click', e => {
				if(typeof this.onAnyActionCallback === 'function') 
					this.onAnyActionCallback();
			}).on('wheel', e => {
				if(typeof this.onAnyActionCallback === 'function')
					this.onAnyActionCallback();
				e.stopImmediatePropagation();
			});
		}

		isSameBK(bk: BookMark) {
			return this.isSame(bk.id, bk.name, bk.is_room);
		}

		isSame(id: number, name: string, is_room: boolean) {
			//if(id instanceof BookMark)
			//	return this.isSame(id.id, id.name, id.is_room);

			if(this.is_room !== is_room)
				return false;
			return this.id === id;// && this.name === name;
		}

		restore(bookmark: BookMark) {
			this.messages.html( bookmark.messages.innerHTML );
		}

		onSelect(callback: () => void) {
			this.onSelectCallback = callback;
		}

		onAnyAction(callback: () => void) {
			this.onAnyActionCallback = callback;
		}

		addMessage(message: string, sender: string) {
			let new_message_label = 
				$$.create('DIV').addChild( $$.create('SPAN').setText(sender + ':') );
			new_message_label.addText(message);

			this.messages.addChild( new_message_label );
		}
	};

	// var ChatClass.instance_handler = null;

	return class ChatClass {
		private static instance_handler: ChatClass | null = null;

		private chat_widget: $_face | null;
		private hidden: boolean;

		private bookmarks: BookMark[];
		private current_bookmark: BookMark | null;

		public input?: $_face;
		private chat_body?: $_face;
		private header?: $_face;

		constructor() {
			this.chat_widget = null;
			this.createWidget();
			//this.msg_buffer = [];//buffer every message
			this.hidden = true;

			this.bookmarks = [];//list of bookmarks
			this.current_bookmark = null;

			if(ChatClass.instance_handler !== null) {//restoring data from previous instance
				ChatClass.instance_handler.bookmarks.forEach((book) => {//restoring private bookmarks
					if(book.is_room === false) {
						console.log('hmm', book.name);
						
						let added_bookmark = this.addBookmark(book.id, book.name, false);
						if(added_bookmark)
							added_bookmark.restore(book);
					}
				});
			}

			ChatClass.instance_handler = this;
		}

		static get currentInstance() {
			return ChatClass.instance_handler;
		}

		onRoomJoined() {
			var current_room = Network.getCurrentRoom();
			if(current_room === null)
				throw new Error('There isn\'t current room');

			//this.addBookmark(current_room.name, true);
			this.addBookmark(current_room.id, 'room', true);
		}

		onRoomLeft() {
			//removing room bookmark
			if(this.bookmarks.length === 0)
				return;
			for(let book of this.bookmarks) {
				if(book.is_room === true) {
					this.current_bookmark = book;
					this.removeCurrentBookmark(true);
					break;
				}
			}

			this.setHeaderText('');
		}

		addBookmark(id: number, name: string, is_room: boolean) {
			//if chat already contains same bookmark
			if( this.bookmarks.some(book => book.isSame(id, name, is_room)) )//do not add duplicate
				return this.bookmarks.find(book => book.isSame(id, name, is_room));//return existing

			let bookmark = new BookMark(id, name, is_room);
			this.bookmarks.push( bookmark );

			if(is_room)//sorting
				this.bookmarks.sort((a, b) => b.is_room ? 1 : -1);
			//console.log(this.bookmarks);

			//adding to html widget
			//let new_id = $$.base64encode('chat_[' + this.id + ']_bookmark_' + name);

			/*let bookmark_btn = $$.create('SPAN').setText(name)
				.on('click', () => this.selectBookmark(bookmark) );*/
			bookmark.onSelect(() => {
				this.selectBookmark(bookmark);
				this.setHidden(false);
			});
			bookmark.onAnyAction(() => this.setHeaderText(''));

			//try {
			if(this.input === undefined)
				throw new Error('\'input\' member variable is undefined');
			if(this.chat_body === undefined)
				throw new Error('\'chat_body\' member variable is undefined');
			this.input.value = '';
			this.input.disabled = false;
			this.chat_body.addChild( bookmark.messages.setStyle({'display': 'none'}) );

			if(is_room) {
				if(this.chat_widget)
					this.chat_widget.getChildren('NAV').appendAtBeginning(
						bookmark.selector_btn.addClass('room_bookmark')
					);
			}
			else {
				bookmark.selector_btn.setStyle({
					'backgroundColor': getNextPaletteColor()
				});
				if(this.chat_widget)
					this.chat_widget.getChildren('NAV').addChild( bookmark.selector_btn );
			}
			//} catch(e) {}
			
			if(this.bookmarks.length === 1) {//first bookmark - showing chat and focusing on it
				if(SETTINGS.chat_auto_hide_show === true)
					this.setHidden(false);
				this.selectBookmark( bookmark );
			}
			
			return bookmark;
		}

		removeCurrentBookmark(force = false) {
			//there is no current bookmark or it is a room chat bookmark or this is only bookmark
			if(this.current_bookmark === null || (this.current_bookmark.is_room === true && !force))
				return;
			for(var i=0; i<this.bookmarks.length; i++) {
				if(this.bookmarks[i] === this.current_bookmark) {//current bookmark
					/*let curr_id = 
						'#' + $$.base64encode('chat_['+this.id+']_bookmark_' + this.bookmarks[i].name);
					try {
						this.chat_widget.getChildren( curr_id.replace(/=/g, '') ).remove();
					}
					catch(e) {
						console.log('Cannot remove bookmark element from chat html widget');
					}*/
					let book = this.bookmarks[i];

					book.selector_btn.remove();
					book.messages.remove();

					//removing from array
					this.bookmarks.splice(i, 1);
					this.current_bookmark = null;

					//selecting next or previous
					//console.log(this.bookmarks);
					if(i < this.bookmarks.length)//selecting next one
						this.selectBookmark( this.bookmarks[i] );
					else if(i-1 >= 0 && this.bookmarks.length > 0)//selecting previous one
						this.selectBookmark( this.bookmarks[i-1] );
					else {
						//console.log('last bookmark removed');
						if(this.chat_body)
							this.chat_body.html('');
						//(inp => {
						if(this.input) {
							this.input.value = '';
							this.input.disabled = true;
						}
							
						//})(this.chat_widget.getChildren('INPUT'));
						if(SETTINGS.chat_auto_hide_show && this.chat_widget)
							this.chat_widget.addClass('hidden');
					}

					break;
				}
			}
		}

		selectBookmark(book: BookMark) {//@book - BookMark instance
			//bookmark already selected
			if(this.current_bookmark && this.current_bookmark.isSameBK(book))
				return;

			//this.chat_widget.getChildren('NAV').getChildren('SPAN').removeClass('current');
			this.bookmarks.forEach(book => book.selector_btn.removeClass('current'));
			
			this.bookmarks.forEach(book_it => {
				if( book_it.isSameBK(book) ) {
					this.current_bookmark = book;

					book_it.selector_btn.addClass('current');
					book_it.messages.setStyle({'display': 'block'});

					book_it.messages.scrollTop = 
						book_it.messages.scrollHeight + book_it.messages.getHeight();
				}
				else {
					book_it.selector_btn.removeClass('current');
					book_it.messages.setStyle({'display': 'none'});
				}
			});

			if(this.input)
				this.input.focus();
		}

		pushMessage(book: BookMark, msg: string, sender: string, _private = false) {
			var sticks = book.messages.getHeight() + book.messages.scrollTop + 14 >= 
				book.messages.scrollHeight;
			
			book.addMessage(msg, sender);

			if(sticks) {
				book.messages.scrollTop = book.messages.scrollHeight + book.messages.getHeight();
				this.setHeaderText('');
			}
			if(!sticks || this.hidden || book !== this.current_bookmark)
				this.setHeaderText((_private ? '(priv) ' : '') + sender + ': ' + msg);
		}

		onMessage(message: {[index: string]: any}) {//@message - JSON object (already parsed)
			try {
				$$.assert(typeof message === 'object', 'Message is not type of object');

				//console.log(message);

				$$.assert(
					typeof message['from']	 === 'string'  && 
					typeof message['public'] === 'boolean' &&
					typeof message['id']	 === 'number'  &&  
					typeof message['msg'] 	 === 'string', 'Incorrect message format');

				if(message['public'] === true) {//room message
					this.bookmarks.forEach(book_it => {
						//looking for same room's bookmark
						if( book_it.isSame(message['id'], 'room', true) )
							this.pushMessage(book_it, message['msg'], message['from'], false);
					});
				}
				else {//private message
					let book = this.addBookmark(message['id'], message['from'], false);
					if(book)
						this.pushMessage(book, message['msg'], message['from'], true);
				}
			}
			catch(e) {
				console.error('Chat message receiving error: ', e);
			}
		}

		sendMessage(msg: string) {//@msg - string
			msg = msg.trim();
			if(validate(msg) === false)
				return false;
			if(this.current_bookmark === null)
				return false;

			try {
				if(this.current_bookmark.is_room) {//room message
					//this.current_bookmark.name - room name (only for server verification)
					Network.sendRoomMessage(msg);
				}
				else {
					//2nd argument - target user's id
					Network.sendPrivateMessage(msg, this.current_bookmark.id);

					//temporary - pretent that user received message
					/*this.onMessage({
						from: 'offline',
						public: true,
						msg: msg
					});*/
				}

				return true;
			}
			catch(e) {
				console.error(e);
				return false;
			}
		}

		setHeaderText(text: string) {
			if(this.header === undefined)
				throw new Error('Header is undefined!!!');
			var header_spanner = this.header.getChildren('SPAN');
			//if(typeof text === 'string')
			header_spanner.setText(text);
			//else
			//	header_spanner.setText( text.html() );

			if(text.length === 0)
				document.title = 'Berta Snakes';
			else if(document.hasFocus() === false)//if page is out of focus
				document.title = '*'+text + ' - Berta Snakes';
		}

		setHidden(hide: boolean) {//@hide - bool
			this.slide(hide);
		}

		slide(_hidden?: boolean) {
			if(typeof _hidden !== 'boolean')
				this.hidden = !this.hidden;
			else
				this.hidden = _hidden;

			if(!this.chat_widget)
				throw new Error('no chat_widget');

			if(this.hidden)
				this.chat_widget.addClass('hidden');
			else {
				this.chat_widget.removeClass('hidden');
				this.setHeaderText('');
				
				setTimeout(() => {
					//var chat_body = this.chat_widget.getChildren('.chat_body');
					if(this.current_bookmark)
						this.current_bookmark.messages.scrollTop = 
							this.current_bookmark.messages.scrollHeight + 
							this.current_bookmark.messages.getHeight();
				}, 600);//animation duration
			}
		}

		createWidget() {
			if(this.chat_widget !== null)
				return this.chat_widget;

			this.chat_body = $$.create('DIV');

			this.header = $$.create('H6').on('click', () => {//header
				if(this.hidden && this.chat_widget !== null &&
						!this.chat_widget.getChildren('.chat_slider').isHover() &&
						!this.chat_widget.getChildren('.bookmark_close_btn').isHover()) {
					this.slide();
				}
			}).addChild( 
				$$.create('SPAN') 
			).addChild(//slide btn
				$$.create('DIV').addClass('opacity_and_rot_transition').addClass('chat_slider')
					.setStyle({'float': 'left'}).on('click', () => {
						this.slide();
					})
			).addChild(//bookmark close btn
				$$.create('DIV').addClass('opacity_and_rot_transition')
					.addClass('bookmark_close_btn').setStyle({'float': 'right'})
					.on('click', () => {
						this.removeCurrentBookmark();
					})
			);

			this.input = $$.create('INPUT').setAttrib('placeholder', 'type here')
				.on('keydown', (e: Event) => {
					if((<KeyboardEvent>e).keyCode === 13) {
						if(this.sendMessage((<$_face>this.input).value) === true)
							(<$_face>this.input).value = '';
					}
					
					e.stopImmediatePropagation();
				}).setAttrib('type', 'text').setAttrib('maxlength', '256').setAttrib('disabled', '');

			/////////////////////////////////////////////////////////////////////////

			this.chat_widget = this.chat_widget || $$.create('DIV').addClass('chat').addClass('hidden')
				.setStyle( {width: '250px'} )
				//.setAttrib('id', 'chat_widget' + this.session_string + this.id)
				.addChild( this.header ) .addChild( $$.create('NAV') )
				.addChild( this.chat_body )
				.addChild( this.input );

			return this.chat_widget;
		}
	};
})();