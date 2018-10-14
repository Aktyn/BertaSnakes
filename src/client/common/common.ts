///<reference path="utils.ts"/>
///<reference path="../engine/network.ts"/>
///<reference path="../chat.ts"/>
///<reference path="../../include/user_info.ts"/>

const COMMON = (function() {
	const CHARS = 'abcdefghijklmnopqrstuvwxyz1234567890';

	const extractInt = (str: string) => parseInt( str.replace(/[^\d]/gi, '') );

	return {
		// createLoader: function(element, color) {
		createLoader: function(color = '#f44336') {
			const spin_style = { 'backgroundColor': color };

			return $$.create('DIV').addClass('spinner').addChild( 
				$$.create('DIV').addClass('double-bounce1').setStyle(spin_style) 
			).addChild( 
				$$.create('DIV').addClass('double-bounce2').setStyle(spin_style) 
			);
		},
		createSwitcher: function(onSwitch?: (state: boolean) => void) {
			let switcher = $$.create('BUTTON').addClass('switcher');
			switcher.on('click', () => {
				var on = switcher.className.match(/on/gi) != null;
				if( on )
					switcher.removeClass('on');
				else
					switcher.addClass('on');
				if(typeof onSwitch === 'function')
					onSwitch(!on);
			});
			return switcher;
		},
		createOptionsList: function(options: string[], on_select: (state: string) => void) {
			let options_list = $$.create('DIV').addClass('options_list');

			options.forEach(opt => {
				options_list.addChild(
					$$.create('BUTTON').setText(opt).on('click', function() {
						//prevent from selecting already selected option
						if(this.className.indexOf('selected') !== -1)
							return;
						options_list.getChildren('BUTTON.selected').removeClass('selected');
						this.addClass('selected');

						if(typeof on_select === 'function')
							on_select(opt);
					})
				);
			});
			$$.assert(options_list.selectOption === undefined, 
				'object already has "selectOption" property assigned');

			options_list.selectOption = function(opt: string) {//@opt - (name of target option)
				options_list.getChildren('BUTTON').forEach((btn: $_face) => {
					if(btn.innerText === opt)
						btn.addClass('selected');
					else
						btn.removeClass('selected');
				});
				return this;
			};

			options_list.getSelectedOption = function() {
				try {
					return options_list.getChildren('BUTTON.selected').innerHTML;
				}
				catch(e) {
					return options.length > 0 ? options[0] : '';
				}
			};

			options_list.getSelectedOptionIndex = function() {
				try {
					return options_list.getChildren('BUTTON').indexOf( 
						options_list.getChildren('BUTTON.selected') 
					);
				}
				catch(e) {
					return 0;
				}
			};

			return options_list;
		},
		createNumberInput: function(min: number, max: number, prefix = '', postfix = '') {
			//$$.assert(typeof min === 'number' && typeof max === 'number', 
			//	'Arguments are to be numbers');
			// prefix = prefix || '';
			// postfix = postfix || '';

			const fixMinMaxOrder = function() {
				if(max < min) {//swap values to make arguments in order
					let temp = min;
					min = max;
					max = temp;
				}
			};
			fixMinMaxOrder();

			let value_displ = $$.create('SPAN').addClass('value_displayer').setText(min);
			
			var changeVal = (dir: number) => {
				value_displ.setText(prefix + 
					Math.min(max, Math.max(min, extractInt( value_displ.innerText ) + dir )) + postfix
				);
			};

			let interval: NodeJS.Timer;
			let hold = (e: MouseEvent, dir: number) => {
				changeVal(dir);
				if(e.button !== 0)
					return;
				interval = setInterval(() => {
					if(input.isHover() === false) {
						clearInterval(interval);
						return;
					}
					changeVal(dir*5);
				}, 500);
			};

			var input = $$.create('DIV').addClass('number_input')
				.addChild( $$.create('SPAN').addClass('decrementer').html('-')
					.on('mousedown', (e) => hold(<MouseEvent>e, -1) )
					.on('mouseup', () => clearInterval(interval))
				)
				.addChild( value_displ )
				.addChild( $$.create('SPAN').addClass('incrementer').html('+')
					.on('mousedown', (e) => hold(<MouseEvent>e, 1) )
					.on('mouseup', () => clearInterval(interval))
				);

			input.getValue = function() {
				return extractInt( value_displ.innerText );
			};
			input.setValue = function(val: number) {
				$$.assert(typeof val === 'number', 'Given value must be a number');
				if(val < min) val = min;
				if(val > max) val = max;
				value_displ.setText( prefix + val + postfix );
				return input;
			};

			input.setMinimumValue = function(val: number) {
				$$.assert(typeof val === 'number', 'Given value must be a number');
				min = val;
				fixMinMaxOrder();
				if(input.getValue() < min)
					input.setValue(min);
			};

			return input;
		},
		createUserEntry: function(user: UserInfo) {
			//$$.assert(user instanceof UserInfo, 'Argument must be instance of UserInfo');

			let nick = $$.create('SPAN').addClass('nickname')
				.setText( COMMON.trimString(user.nick, 12) );
			let rank = $$.create('SPAN').addClass('rank')
				.setText(Math.round(user.rank) + ' |  ' + user.level);
			let more_btn: $_face;

			let option_add_friend = $$.create('BUTTON').addClass('iconic_button')
				.addClass('iconic_empty').setText('Add friend').on('click', () => {
					Network.sendAddFriendRequest(user.id);

					options_bar.addClass('hidden');

					option_add_friend.setStyle({'display': 'none'});
				});

			let option_kick = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('KICK').on('click', () => {
					Network.requestUserKick(user.id);
				});

			let option_private_msg = $$.create('BUTTON').addClass('iconic_button')
				.addClass('iconic_chat').setAttrib('src', 'img/icons/chat_icon.svg')
				.setText('Chat').on('click', () => {
					if(Chat.currentInstance === null)
						return;
					var new_bookmark = Chat.currentInstance.addBookmark(user.id, user.nick, false);
					if(!new_bookmark)
						return;
					Chat.currentInstance.selectBookmark( new_bookmark );
					Chat.currentInstance.setHidden(false);

					options_bar.addClass('hidden');
				});
			

			let option_close = $$.create('IMG').addClass('icon_btn').addClass('option_close')
				.setAttrib('src', 'img/icons/close.png').on('click', () => {
					options_bar.addClass('hidden');
				}).setStyle({'float': 'right'});

			var curr_user = Network.getCurrentUser();
			if(curr_user === null)
				throw new Error('CurrentUser is null');
				
			let curr_id = curr_user.id;

			//not current user and current user is not guest
			if(user.id !== curr_id && curr_id > 0) {
				more_btn = $$.create('IMG').addClass('icon_btn').addClass('more')
					.setAttrib('src', 'img/icons/more_vert.png').on('click', () => {
						options_bar.removeClass('hidden');
					}).setStyle({'justifySelf': 'right'});
			}
			else
				more_btn = $$.create('SPAN');

			var options_bar = $$.create('DIV').addClass('options').addClass('hidden');

			if(curr_user.friends.find(f => f.id===user.id) === undefined && user.id > 0)
				options_bar.addChild( option_add_friend );

			options_bar.addChild(option_close);

			var curr_room = Network.getCurrentRoom();
			if(curr_room === null)
				throw new Error('CurrentUser is null');

			var curr_owner = curr_room.getOwner();

			//current user is room owner and target user is not himself
			if(curr_owner && curr_id === curr_owner.id && user.id !== curr_id)
				options_bar.addChild( option_kick );
				
			options_bar.addChild(option_private_msg);

			return [nick, rank, more_btn, options_bar];
		},
		generateRandomString: function(len: number): string {
			return Array.from({length: len}, () => {
				return CHARS[~~(Math.random()*CHARS.length)];
			}).join('');
		},
		trimString: function(str: string, max_len = 10, trimmer = '...') {
			$$.assert(typeof str === 'string', 'First argument must be a string (func@trimString)');
			//max_len = max_len || 10;
			if(str.length <= max_len)
				return str;
			else
				return str.substring(0, max_len) + trimmer;
		}
	};
})();