import * as React from 'react';

import '../../styles/shop_section.scss';
import {AccountSchema} from '../../account';
import {PLAYER_TYPES, SHIP_LVL_REQUIREMENTS, SHIP_COSTS} from '../../../common/game/objects/player';
import Skills, {SkillData} from "../../../common/game/common/skills";
import ShipWidget from "../widgets/ship_widget";
import {offsetTop} from "./sidepops_common";
import SkillWidget from "../widgets/skill_widget";

interface ShopSectionProps {
	account: AccountSchema;
	buyShip: (type: number) => Promise<void>;
	buySkill: (skill: SkillData) => Promise<void>;
}

interface ShopSectionState {
	confirm_ship_buy?: number;
	confirm_skill_buy?: SkillData;
	transaction_success: boolean;
}

export default class ShopSection extends React.Component<ShopSectionProps, ShopSectionState> {
	private ship_transaction_tm: NodeJS.Timeout | null = null;
	private skill_transaction_tm: NodeJS.Timeout | null = null;
	
	state: ShopSectionState = {
		transaction_success: false//false doesn't mean that it is an error
	};
	
	constructor(props: ShopSectionProps) {
		super(props);
	}
	
	componentWillUnmount() {
		if(this.ship_transaction_tm)
			clearTimeout(this.ship_transaction_tm);
		if(this.skill_transaction_tm)
			clearTimeout(this.skill_transaction_tm);
	}
	
	public onTransactionSuccess() {
		this.setState({transaction_success: true});
	}
	
	private tryBuyShip(type: number) {
		if( this.state.confirm_ship_buy !== undefined )
			return;
		
		this.setState({confirm_ship_buy: type, transaction_success: false});
		this.ship_transaction_tm = setTimeout(() => {
			this.setState({confirm_ship_buy: undefined});
			this.ship_transaction_tm = null;
		}, 8000) as never;
	}
	
	private tryBuySkill(skill: SkillData) {
		if( this.state.confirm_skill_buy !== undefined )
			return;
		
		this.setState({confirm_skill_buy: skill, transaction_success: false});
		this.skill_transaction_tm = setTimeout(() => {
			this.setState({confirm_skill_buy: undefined});
			this.skill_transaction_tm = null;
		}, 8000) as never;
	}
	
	private cancelShipBuyConfirm() {
		this.setState({confirm_ship_buy: undefined, transaction_success: false});
		if(this.ship_transaction_tm)
			clearTimeout(this.ship_transaction_tm);
		this.ship_transaction_tm = null;
	}
	
	private cancelSkillBuyConfirm() {
		this.setState({confirm_skill_buy: undefined, transaction_success: false});
		if(this.skill_transaction_tm)
			clearTimeout(this.skill_transaction_tm);
		this.skill_transaction_tm = null;
	}
	
	private renderShipsList(account: AccountSchema) {
		return Object.values(PLAYER_TYPES).filter(key => typeof key === 'number').map((type) => {
			let bought = account.available_ships.indexOf(type) !== -1;
			let unobtainable = !bought &&
				(account.coins < SHIP_COSTS[type] || account.level < SHIP_LVL_REQUIREMENTS[type]);
			return <div className={'ship-element'} key={type}>
				
				<ShipWidget type={type} onClick={!bought && !unobtainable ? () => {
						this.tryBuyShip(type);
					} : undefined} bought={bought} unobtainable={unobtainable}
				            key={type + (bought ? 374511 : 0) + (unobtainable ? 374511*2 : 0)} />
				            
				<div>Lvl:&nbsp;<strong style={{
					color: account.level >= SHIP_LVL_REQUIREMENTS[type] ? 'inherit' : '#e57373'
				}}>{SHIP_LVL_REQUIREMENTS[type]}</strong></div>
				<div>{bought ? 'Bought' : <span>Cost:&nbsp;<strong style={{
					color: account.coins >= SHIP_COSTS[type] ? 'inherit' : '#e57373'
				}}>{SHIP_COSTS[type]}</strong></span>}</div>
			</div>;
		});
	}
	
	private renderSkillsList(account: AccountSchema) {
		return Object.values(Skills).filter((skill) => {//return those skills that have a price
			return typeof (skill as SkillData).id === 'number' && typeof (skill as SkillData).price === 'number';
		}).sort((a, b) => {
			let dt_a = a as SkillData;
			let dt_b = b as SkillData;
			if(dt_a.lvl_required !== dt_b.lvl_required)
				return dt_a.lvl_required - dt_b.lvl_required;
			else
				return dt_a.price - dt_b.price;
		}).map((skill) => {
			let skill_data = skill as SkillData;//typescript was complaining
			let bought = account.available_skills.indexOf(skill_data.id) !== -1;
			let unobtainable = !bought &&
				(account.coins < skill_data.price || account.level < skill_data.lvl_required);
			return <div className={'skill-element'} key={skill_data.id}>
				
				<SkillWidget onClick={!bought && !unobtainable ? () => {
						this.tryBuySkill(skill_data);
					} : undefined} skill={skill_data.id} bought={bought} unobtainable={unobtainable}
				             key={skill_data.id + (bought ? 374511 : 0) + (unobtainable ? 374511*2 : 0)} />
				
				<div>Lvl:&nbsp;<strong style={{
					color: account.level >= skill_data.lvl_required ? 'inherit' : '#e57373'
				}}>{skill_data.lvl_required}</strong></div>
				<div>{bought ? 'Bought' : <span>Cost:&nbsp;<strong style={{
					color: account.coins >= skill_data.price ? 'inherit' : '#e57373'
				}}>{skill_data.price}</strong></span>}</div>
			</div>;
		});
	}
	
	private renderShipBuyConfirmPrompt(type: number) {
		return <>
			<h4 className={'fader-in'}>You sure you want to buy this ship for {SHIP_COSTS[type]} coins?</h4>
			<div className={'fader-in'}>
				<ShipWidget type={type} />
			</div>
			<button className={'fader-in'} onClick={() => {
				this.cancelShipBuyConfirm();
				this.props.buyShip(type).catch(console.error);
			}} style={{...offsetTop}}>CONFIRM</button>
			<br/>
			<button className={'fader-in'} onClick={() => this.cancelShipBuyConfirm()}
			        style={{color: '#e57373', ...offsetTop}}>NOPE</button>
		</>;
	}
	
	private renderSkillBuyConfirmPrompt(skill: SkillData) {
		return <>
			<h4 className={'fader-in'}>You sure you want to buy this skill for {skill.price} coins?</h4>
			<div className={'fader-in'}>
				<SkillWidget skill={skill.id} />
			</div>
			<button className={'fader-in'} onClick={() => {
				this.cancelSkillBuyConfirm();
				this.props.buySkill(skill).catch(console.error);
			}} style={{...offsetTop}}>
				CONFIRM
			</button>
			<br/>
			<button className={'fader-in'} onClick={() => this.cancelSkillBuyConfirm()}
			        style={{color: '#e57373', ...offsetTop}}>NOPE</button>
		</>;
	}
	
	render() {
		return <section className={'shop-section'}>
			{this.state.transaction_success && <div className={'fader-in'} style={{
				color: '#8BC34A',
				fontWeight: 'bold',
				...offsetTop
			}}>Transaction successful</div>}
			<h1 className={'fader-in shop-section-title'}>
				<span/>
				<label>SHOP</label>
				<span className={'money-icon'}/>
			</h1>
			<div className={'fader-in details-list bold'}>
				<label>Level:</label>
				<span>{this.props.account.level}</span>
				
				<label>Coins:</label>
				<span>{this.props.account.coins}</span>
			</div>
			<div className={'fader-in'} style={{...offsetTop}}>{
				this.state.confirm_ship_buy !== undefined ? this.renderShipBuyConfirmPrompt(this.state.confirm_ship_buy)
				:
				this.renderShipsList(this.props.account)
			}</div>
			<hr/>
			<div className={'fader-in'} style={this.state.confirm_skill_buy !== undefined ? {} : {
				display: 'grid',
				gridTemplateColumns: 'auto auto auto',
				justifyContent: 'center',
				gridRowGap: '10px'
			}}>{
				this.state.confirm_skill_buy !== undefined ? this.renderSkillBuyConfirmPrompt(this.state.confirm_skill_buy)
				:
				this.renderSkillsList(this.props.account)
			}</div>
		</section>;
	}
}