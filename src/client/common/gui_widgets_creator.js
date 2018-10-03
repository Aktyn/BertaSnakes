const WIDGETS_CREATOR = (function() {
	const STATES = {//ENUM
		NORMAL: 0,//ready to use
		IN_USE: 1,//already in use
		TO_BUY: 2,//not yet bought
		BOUGHT: 3,
		LOCKED: 4
	};

	function createSkillDescriptionHTML(skill, show_requirements) {
		let temp = $$.create('DIV').append( 
			$$.create('DIV').setText(skill.name || '').setStyle({'fontWeight': 'bold'}) 
		).append( 
			$$.create('DIV').setText(skill.description || '---').setStyle({
				'text-align': 'justify',
    			'text-justify': 'auto'
			})
		);//.setStyle({'display': 'none'});

		if(show_requirements === true) {
			temp.append( $$.create('HR') ).append(
				$$.create('DIV').setStyle({'textAlign': 'left'}).setText(
					(skill.lvl_required ? 'Required level: ' + skill.lvl_required : '') + '\n' +
					(skill.price ? 'Price: ' + skill.price + ' coins' : '')
				)
			);
		}

		return temp;
	}

	return {
		WIDGET_STATES: STATES,

		createDescription: function(element, target) {
			let description_visible = false;

			element.addClass('description').setStyle({'z-index': '99', 'display': 'none'});

			let openDescription = e => {
				if(description_visible === true)
					return;
				description_visible = true;
				element.setStyle({'display': 'inline-block'});
			};

			let closeDescription = e => {
				if(description_visible === false)
					return;
				description_visible = false;
				element.setStyle({'display': 'none'});
			};

			let moveDescription = e => {
				if(description_visible) {
					element.style.transform = 'translate(' + (e.clientX+10) + 'px, ' + 
						(e.clientY-30) + 'px)';
				}
			};

			target.on('mouseenter', openDescription).on('mouseleave', closeDescription)
				.on('mousemove', moveDescription);

			$$(document.body).append( element );
			return element;
		},

		createShipWidget: function(type, self) {
			let ship_preview = $$.create('DIV').setClass('preview');
			let panel = $$.create('DIV').setClass('panel');

			//TODO -----
			//let description_html = $$.create('DIV').setText('TODO - ships descriptions');
			//let ship_description = createDescription(description_html, ship_preview);

			let widget = $$.create('DIV').setClass('ship_widget').append(
				$$.create('LABEL').setText( Player.SHIP_NAMES[type] )
			).append( ship_preview ).append( panel );

			ASSETS.onload(() => ship_preview.append(
				ASSETS.getTexture( Player.entityName(type, Colors.PLAYERS_COLORS[2]) ) ));

			let use_btn = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('USE').on('click', () => {
					Network.requestShipUse(type);
				});

			let buy_btn = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('BUY (' + Player.SHIP_COSTS[type] + ' COINS)').on('click', () => {
					let confirmation = $$.create('DIV').append(
						$$.create('DIV').addClass('account_row')
							.html('Are you sure you want to buy&nbsp;<b>' + Player.SHIP_NAMES[type] + 
								'</b>&nbsp;for ' + Player.SHIP_COSTS[type] + ' coins?')
					).append(
						$$.create('DIV').append(
							$$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
								.setText('CONFIRM').on('click', () => Network.requestShipBuy(type))
						).append(
							$$.create('SPAN').setStyle({width: '50px'})
						).append(
							$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
								.setText('RETURN').on('click', () => self.exitConfirmation())
						)
					);
					self.showConfirmation( confirmation, 'Transaction' );
				});

			return {
				domElement: widget,
				setState: function(state) {
					widget.setClass('ship_widget');//removes additional classes
					switch(state) {
						default: throw new Error('Incorrect state');
						case STATES.NORMAL:
							panel.html('').append( use_btn );
							break;
						case STATES.IN_USE:
							widget.addClass('selected');
							panel.setText('SELECTED');
							break;
						case STATES.TO_BUY:
							panel.html('').append( buy_btn );
							break;
						case STATES.BOUGHT:
							widget.addClass('selected');
							panel.setText('BOUGHT');
							break;
						case STATES.LOCKED:
							widget.addClass('locked');
							panel.setText('Requires level ' + Player.SHIP_LVL_REQUIREMENTS[type]);
							break;
					}
				}
			};
		},
		createSkillWidget: function(skill, self, short_description) {
			$$.assert(ASSETS.loaded() === true, 'Assets not yet loaded');

			if(typeof skill === 'number')//skill index
				skill = Object.values(Skills).find(s => typeof s === 'object' && s.id === skill);

			let use_button = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('USE').on('click', () => Network.requestSkillUse(skill.id));

			let buy_button = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('BUY').on('click', () => {
					try {
						let confirmation = $$.create('DIV').append(
							$$.create('DIV').addClass('account_row')
								.html('Are you sure you want to buy&nbsp;<b>' + skill.name + 
									'</b>&nbsp;for ' + skill.price + ' coins?')
						).append(
							$$.create('DIV').append(
								$$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
									.setText('CONFIRM').on('click', () => {
										Network.requestSkillBuy(skill.id);
									})
							).append(
								$$.create('SPAN').setStyle({width: '50px'})
							).append(
								$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
									.setText('RETURN').on('click', () => self.exitConfirmation())
							)
						);
						self.showConfirmation( confirmation, 'Transaction' );
					}
					catch(e) {
						console.error(e);
					}
				});

			let panel = $$.create('DIV').setClass('panel');

			let skill_preview = $$.create('IMG')
				.attribute('src', ASSETS.getTexture(skill.texture_name).attribute('src'));	

			let skill_description = this.createDescription(
				createSkillDescriptionHTML(skill, !short_description), skill_preview);

			let widget = $$.create('DIV').setClass('skill_widget').append( skill_preview )
				.append( panel );//.append( skill_description );

			return {
				domElement: widget,
				setState: function(state) {
					widget.setClass('skill_widget');
					switch(state) {
						default: throw new Error('Incorrect state');
						case STATES.NORMAL:
							panel.html('').append( use_button );
							break;
						case STATES.IN_USE:
							widget.addClass('selected');
							panel.setText('SELECTED');
							break;
						case STATES.TO_BUY:
							panel.html('').append( buy_button );
							break;
						case STATES.BOUGHT:
							widget.addClass('selected');
							panel.setText('BOUGHT');
							break;
						case STATES.LOCKED:
							widget.addClass('locked');
							break;
					}
				}
			};
		},

		createSkillSlot: function(key_number) {
			let skill_preview = $$.create('IMG');

			let wearing_skill = null;

			let btn_left = $$.create('BUTTON').setStyle({
				'backgroundImage': 'url(../img/icons/arrow.png)',
				'width': '15px',
				'height': '15px',
				'transform': 'rotate(90deg)',
				'gridArea': 'left_btn'
			});

			let btn_throw = $$.create('BUTTON').setText('Put off').setStyle({
				'width': '100%',
				'height': '15px',
				'gridArea': 'throw'
			}).on('click', () => {
				if(wearing_skill !== null)
					Network.requestSkillPutOff(wearing_skill.id);
			});

			let btn_right = $$.create('BUTTON').setStyle({
				'backgroundImage': 'url(../img/icons/arrow.png)',
				'width': '15px',
				'height': '15px',
				'transform': 'rotate(270deg)',
				'gridArea': 'right_btn'
			});

			let slot = $$.create('SPAN').append(
				$$.create('DIV').setStyle({'gridArea': 'top'}).setText(key_number)
			).append( [btn_left, skill_preview, btn_right] ).append(
				btn_throw
			);

			slot.getChildren('BUTTON').setStyle({'display': 'none'});

			let skill_description = null;

			const skill_slot = {
				setSkill: function(skill) {
					if(skill === undefined || skill === null) {
						skill_slot.setEmpty();
						return;
					}
					$$.assert(ASSETS.loaded() === true, 'Assets not yet loaded');

					if(typeof skill === 'number')//skill index
						skill = Object.values(Skills).find(s => typeof s==='object' && s.id===skill);

					wearing_skill = skill;
					skill_preview.attribute('src', 
						ASSETS.getTexture(skill.texture_name).attribute('src'));
					slot.getChildren('BUTTON').setStyle({'display': 'initial'});

					if(skill_description !== null)
						skill_description.remove();
					skill_description = this.createDescription(
						createSkillDescriptionHTML(skill, false), skill_preview);
				}.bind(this),
				setEmpty: function() {
					wearing_skill = null;
					skill_preview.attribute('src', '');
					slot.getChildren('BUTTON').setStyle({'display': 'none'});
				},
				isEmpty: function() {
					return wearing_skill === null;
				},
				onLeft: function(callback) {
					btn_left.onclick = callback;
				},
				onRight: function(callback) {
					btn_right.onclick = callback;
				},
				allowDirections: function(left, right) {
					if(wearing_skill === null)
						return;
					btn_left.setStyle({'display': left ? 'initial' : 'none'});
					btn_right.setStyle({'display': right ? 'initial' : 'none'});
				},
				domElement: slot
			};

			return skill_slot;
		}
	};
})();