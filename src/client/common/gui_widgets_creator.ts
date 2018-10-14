///<reference path="utils.ts"/>
///<reference path="../engine/assets.ts"/>
///<reference path="../../include/game/common/skills.ts"/>

interface SkillSlotSchema {
	setSkill(skill: SkillsScope.SkillData | null): void;
	setEmpty(): void;
	isEmpty(): boolean;
	onLeft(callback: (e: Event) => void): void;
	onRight(callback: (e: Event) => void): void;
	allowDirections(left: boolean, right: boolean): void;
	domElement: $_face;
}

const WIDGETS_CREATOR = (function() {
	enum STATES {//ENUM
		NORMAL,//ready to use
		IN_USE,//already in use
		TO_BUY,//not yet bought
		BOUGHT,
		LOCKED
	}

	function createSkillDescriptionHTML(skill: SkillsScope.SkillData, show_requirements: boolean) {
		let temp = $$.create('DIV').addChild( 
			$$.create('DIV').setText(skill.name || '').setStyle({'fontWeight': 'bold'}) 
		).addChild( 
			$$.create('DIV').setText(skill.description || '---').setStyle({
				'text-align': 'justify',
    			'text-justify': 'auto'
			})
		);//.setStyle({'display': 'none'});

		if(show_requirements === true) {
			temp.addChild( $$.create('HR') ).addChild(
				$$.create('DIV').setStyle({'textAlign': 'left'}).setText(
					(skill.lvl_required ? 'Required level: ' + skill.lvl_required : '') + '\n' +
					(skill.price ? 'Price: ' + skill.price + ' coins' : '')
				)
			);
		}

		return temp;
	}

	interface AccountPopupHandle {
		exitConfirmation(): void;
		showConfirmation(arg1: $_face, arg2: string): void;
	}

	var Self = {
		WIDGET_STATES: STATES,

		createDescription: function(element: $_face, target: $_face) {
			let description_visible = false;

			element.addClass('description').setStyle({'z-index': '99', 'display': 'none'});

			let openDescription = () => {
				if(description_visible === true)
					return;
				description_visible = true;
				element.setStyle({'display': 'inline-block'});
			};

			let closeDescription = () => {
				if(description_visible === false)
					return;
				description_visible = false;
				element.setStyle({'display': 'none'});
			};

			let moveDescription = (e: Event) => {
				if(description_visible) {
					element.style.transform = 'translate(' + ((<MouseEvent>e).clientX+10) + 'px, ' + 
						((<MouseEvent>e).clientY-30) + 'px)';
				}
			};

			target.on('mouseenter', openDescription).on('mouseleave', closeDescription)
				.on('mousemove', moveDescription);

			$$(document.body).addChild( element );
			return element;
		},

		createShipWidget: function(type: number, self: AccountPopupHandle) {
			let ship_preview = $$.create('DIV').setClass('preview');
			let panel = $$.create('DIV').setClass('panel');

			//TODO -----
			//let description_html = $$.create('DIV').setText('TODO - ships descriptions');
			//let ship_description = createDescription(description_html, ship_preview);

			let widget = $$.create('DIV').setClass('ship_widget').addChild(
				$$.create('LABEL').setText( Player.SHIP_NAMES[type] )
			).addChild( ship_preview ).addChild( panel );

			ASSETS.onload(() => ship_preview.addChild(
				ASSETS.getTexture( Player.entityName(type, Colors.PLAYERS_COLORS[2]) ) ));

			let use_btn = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('USE').on('click', () => {
					Network.requestShipUse(type);
				});

			let buy_btn = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('BUY (' + Player.SHIP_COSTS[type] + ' COINS)').on('click', () => {
					let confirmation = $$.create('DIV').addChild(
						$$.create('DIV').addClass('account_row')
							.html('Are you sure you want to buy&nbsp;<b>' + Player.SHIP_NAMES[type] + 
								'</b>&nbsp;for ' + Player.SHIP_COSTS[type] + ' coins?')
					).addChild(
						$$.create('DIV').addChild(
							$$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
								.setText('CONFIRM').on('click', () => Network.requestShipBuy(type))
						).addChild(
							$$.create('SPAN').setStyle({width: '50px'})
						).addChild(
							$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
								.setText('RETURN').on('click', () => self.exitConfirmation())
						)
					);
					self.showConfirmation( confirmation, 'Transaction' );
				});

			return {
				domElement: widget,
				setState: function(state: STATES) {
					widget.setClass('ship_widget');//removes additional classes
					switch(state) {
						default: throw new Error('Incorrect state');
						case STATES.NORMAL:
							panel.html('').addChild( use_btn );
							break;
						case STATES.IN_USE:
							widget.addClass('selected');
							panel.setText('SELECTED');
							break;
						case STATES.TO_BUY:
							panel.html('').addChild( buy_btn );
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
		createSkillWidget: function(skill: SkillsScope.SkillData, 
			self: AccountPopupHandle, short_description = false) 
		{
			$$.assert(ASSETS.loaded() === true, 'Assets not yet loaded');

			/*var skill: SkillsScope.SkillData = (typeof raw_skill === 'number') ? 
				(<SkillsScope.SkillData>Object.keys(Skills).map(key => Skills[key])
					.find((s: any) => typeof s === 'object' && s.id === skill)) :
				<SkillsScope.SkillData>raw_skill;*/

			let use_button = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('USE').on('click', () => Network.requestSkillUse(skill.id));

			let buy_button = $$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.setText('BUY').on('click', () => {
					try {
						let confirmation = $$.create('DIV').addChild(
							$$.create('DIV').addClass('account_row')
								.html('Are you sure you want to buy&nbsp;<b>' + skill.name + 
									'</b>&nbsp;for ' + skill.price + ' coins?')
						).addChild(
							$$.create('DIV').addChild(
								$$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
									.setText('CONFIRM').on('click', () => {
										Network.requestSkillBuy(skill.id);
									})
							).addChild(
								$$.create('SPAN').setStyle({width: '50px'})
							).addChild(
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
				.setAttrib( 'src', ASSETS.getTexture(skill.texture_name).getAttrib('src') );	

			/*let skill_description = */this.createDescription(
				createSkillDescriptionHTML(skill, !short_description), skill_preview);

			let widget = $$.create('DIV').setClass('skill_widget').addChild( skill_preview )
				.addChild( panel );//.addChild( skill_description );

			return {
				domElement: widget,
				setState: function(state: STATES) {
					widget.setClass('skill_widget');
					switch(state) {
						default: throw new Error('Incorrect state');
						case STATES.NORMAL:
							panel.html('').addChild( use_button );
							break;
						case STATES.IN_USE:
							widget.addClass('selected');
							panel.setText('SELECTED');
							break;
						case STATES.TO_BUY:
							panel.html('').addChild( buy_button );
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

		createSkillSlot: function(key_number: number) {
			let skill_preview = $$.create('IMG');

			let wearing_skill: SkillsScope.SkillData | null = null;

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

			let slot = $$.create('SPAN').addChild(
				$$.create('DIV').setStyle({'gridArea': 'top'}).setText(key_number)
			).addChild( [btn_left, skill_preview, btn_right] ).addChild(
				btn_throw
			);

			slot.getChildren('BUTTON').setStyle({'display': 'none'});

			let skill_description: $_face | null = null;

			const skill_slot = {
				setSkill: function(skill: SkillsScope.SkillData | null) {
					if(/*skill === undefined || */skill === null) {
						skill_slot.setEmpty();
						return;
					}
					$$.assert(ASSETS.loaded() === true, 'Assets not yet loaded');

					if(typeof skill === 'number') {//skill index
						var found_skill = <SkillsScope.SkillData>Object.keys(Skills)
							.map(key => Skills[key]).find((s: any) => {
								return typeof s==='object' && s.id===skill;
							});
						if(found_skill !== undefined)
							skill = found_skill;
						// skill = Object.values(Skills).find(s => typeof s==='object' && s.id===skill);
					}

					wearing_skill = skill;
					skill_preview.setAttrib('src', 
						ASSETS.getTexture(skill.texture_name).getAttrib('src'));
					slot.getChildren('BUTTON').setStyle({'display': 'initial'});

					if(skill_description !== null)
						skill_description.remove();
					skill_description = Self.createDescription(
						createSkillDescriptionHTML(skill, false), skill_preview);
				},//.bind(Self),
				setEmpty: function() {
					wearing_skill = null;
					skill_preview.setAttrib('src', '');
					slot.getChildren('BUTTON').setStyle({'display': 'none'});
				},
				isEmpty: function() {
					return wearing_skill === null;
				},
				onLeft: function(callback: (e: Event) => void) {
					btn_left.onclick = callback;
				},
				onRight: function(callback: (e: Event) => void) {
					btn_right.onclick = callback;
				},
				allowDirections: function(left: boolean, right: boolean) {
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

	return Self;
})();