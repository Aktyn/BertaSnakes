const COMMON = (function() {
	const CHARS = 'abcdefghijklmnopqrstuvwxyz1234567890';

	const extractInt = str => parseInt( str.replace(/[^\d]/gi, '') );

	return {
		createLoader: function(element, color) {
			var spin_style = { backgroundColor: color || '#f44336' };

			return $$.create('DIV').addClass('spinner').append( 
				$$.create('DIV').addClass('double-bounce1').setStyle(spin_style) 
			).append( 
				$$.create('DIV').addClass('double-bounce2').setStyle(spin_style) 
			);
		},
		createSwitcher: function(onSwitch) {
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
		createOptionsList: function(options, on_select) {//@options - array of strings
			let options_list = $$.create('DIV').addClass('options_list');

			options.forEach(opt => {
				options_list.append(
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

			options_list.selectOption = function(opt) {//@opt - string (name of target option)
				options_list.getChildren('BUTTON').forEach(btn => {
					if(btn.innerText === opt)
						btn.addClass('selected');
					else
						btn.removeClass('selected');
				});
				return this;
			};

			options_list.getSelectedOption = function() {
				try {
					return options_list.getChildren('BUTTON.selected').html();
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
		createNumberInput: function(min, max, prefix, postfix) {
			$$.assert(typeof min === 'number' && typeof max === 'number', 
				'Arguments are to be numbers');
			prefix = prefix || '';
			postfix = postfix || '';

			var fixMinMaxOrder = function() {
				if(max < min) {//swap values to make arguments in order
					let temp = min;
					min = max;
					max = temp;
				}
			};

			fixMinMaxOrder();

			let value_displ = $$.create('SPAN').addClass('value_displayer').setText(String(min));
			
			var changeVal = dir => {
				value_displ.setText(prefix + 
					Math.min(max, Math.max(min, extractInt( value_displ.innerText ) + dir )) + postfix
				);
			};

			let interval;
			let hold = (e, dir) => {
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
				.append( $$.create('SPAN').addClass('decrementer').html('-')
					//.on('click', () => changeVal(-1)) 
					.on('mousedown', e => hold(e, -1) )
					.on('mouseup', () => clearInterval(interval))
				)
				.append( value_displ )
				.append( $$.create('SPAN').addClass('incrementer').html('+')
					//.on('click', () => changeVal(1)) 
					.on('mousedown', e => hold(e, 1) )
					.on('mouseup', () => clearInterval(interval))
				);

			input.getValue = function() {
				return extractInt( value_displ.innerText );
			};
			input.setValue = function(val) {
				$$.assert(typeof val === 'number', 'Given value must be a number');
				if(val < min) val = min;
				if(val > max) val = max;
				value_displ.setText( prefix + val + postfix );
				return input;
			};

			input.setMinimumValue = function(val) {
				$$.assert(typeof val === 'number', 'Given value must be a number');
				min = val;
				fixMinMaxOrder();
				if(input.getValue() < min)
					input.setValue(min);
			};

			return input;
		},
		createUserEntry: function(user) {
			$$.assert(user instanceof UserInfo, 'Argument must be instance of UserInfo');

			let nick = $$.create('SPAN').addClass('nickname')
				.setText( COMMON.trimString(user.nick, 12) );
			let rank = $$.create('SPAN').addClass('rank')
				.setText(Math.round(user.rank) + ' |  ' + user.level);
			let more_btn;

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
				.addClass('iconic_chat').attribute('src', 'img/icons/chat_icon.svg')
				.setText('Chat').on('click', () => {
					Chat.currentInstance.selectBookmark( 
						Chat.currentInstance.addBookmark(user.id, user.nick, false)
					);
					Chat.currentInstance.setHidden(false);

					options_bar.addClass('hidden');
				});
			

			let option_close = $$.create('IMG').addClass('icon_btn').addClass('option_close')
				.attribute('src', 'img/icons/close.png').on('click', () => {
					options_bar.addClass('hidden');
				}).setStyle({'float': 'right'});

			let curr_id = Network.getCurrentUser().id;

			//not current user and current user is not guest
			if(user.id !== curr_id && curr_id > 0) {
				more_btn = $$.create('IMG').addClass('icon_btn').addClass('more')
					.attribute('src', 'img/icons/more_vert.png').on('click', e => {
						options_bar.removeClass('hidden');
					}).setStyle({'justifySelf': 'right'});
			}
			else
				more_btn = $$.create('SPAN');

			var options_bar = $$.create('DIV').addClass('options').addClass('hidden');

			if(Network.getCurrentUser().friends.find(f => f.id===user.id) === undefined && user.id > 0)
				options_bar.append( option_add_friend );

			options_bar.append(option_close);

			//current user is room owner and target user is not himself
			if(curr_id === Network.getCurrentRoom().getOwner().id && user.id !== curr_id)
				options_bar.append( option_kick );
				
			options_bar.append(option_private_msg);

			return [nick, rank, more_btn, options_bar];
		},
		generateRandomString: function(len) {
			return Array.from({length: len}, () => {
				return CHARS[~~(Math.random()*CHARS.length)];
			}).join('');
		},
		trimString: function(str, max_len, trimmer) {
			$$.assert(typeof str === 'string', 'First argument must be a string (func@trimString)');
			max_len = max_len || 10;
			if(str.length <= max_len)
				return str;
			else
				return str.substring(0, max_len) + (trimmer || '...');
		}
	};
})();