import * as React from 'react';
import Account, {AccountSchema} from '../../account';
import {PLAYER_TYPES, SHIP_LVL_REQUIREMENTS, SHIP_COSTS} from '../../../common/game/objects/player';
import Skills, {SkillData} from "../../../common/game/common/skills";
import ShipWidget from "../widgets/ship_widget";
import {offsetTop, offsetVert} from "./sidepops_common";
import SkillWidget from "../widgets/skill_widget";
import ServerApi from '../../utils/server_api';
import Settings from "../../game/engine/settings";
import Config, { CoinPackSchema } from '../../../common/config';
import ERROR_CODES, {errorMsg} from "../../../common/error_codes";

import '../../styles/shop_section.scss';

const CONFIRMATION_TIMEOUT = 8000;//ms

const packs = [
	{name: 'Small', pack: Config.COIN_PACKS.small},
	{name: 'Medium', pack: Config.COIN_PACKS.medium},
	{name: 'Large', pack: Config.COIN_PACKS.large}
];

interface CurrencyRatesSchema {
	[index: string]: number;
}

interface ShopSectionProps {
	account: AccountSchema;
	onError: (msg: string) => void;
	buyShip: (type: number) => Promise<void>;
	buySkill: (skill: SkillData) => Promise<void>;
	buyCoins: (pack: CoinPackSchema, currency: string) => Promise<void>;
}

interface ShopSectionState {
	confirm_ship_buy?: number;
	confirm_skill_buy?: SkillData;
	confirm_coin_pack_buy?: CoinPackSchema
	transaction_success: boolean;
	redirecting_url?: string;
	currency_base?: string;
	currency?: string;
	currency_rates?: CurrencyRatesSchema;
}

export default class ShopSection extends React.Component<ShopSectionProps, ShopSectionState> {
	private ship_transaction_tm: NodeJS.Timeout | null = null;
	private skill_transaction_tm: NodeJS.Timeout | null = null;
	private coin_pack_transaction_tm: NodeJS.Timeout | null = null;
	
	state: ShopSectionState = {
		transaction_success: false,//false doesn't mean that it is an error
	};
	
	constructor(props: ShopSectionProps) {
		super(props);
	}
	
	async componentDidMount() {
		interface CurrenciesResponse {
			error: ERROR_CODES;
			base: string;
			rates: CurrencyRatesSchema;
		}
		
		//load currency rates
		let currencies_res: CurrenciesResponse = await ServerApi.postRequest('/get_currencies', {
			token: Account.getToken()
		});
		//console.log('currencies:', currencies_res);
		if(currencies_res.error !== ERROR_CODES.SUCCESS || !currencies_res.base || !currencies_res.rates)
			return this.props.onError(errorMsg(currencies_res.error));
		
		let currency = (Settings.getValue('currency') as string) || currencies_res.base;
		
		if( !(currency in currencies_res.rates) )
			return this.props.onError('Currency settings error');
		
		this.setState({
			currency_base: currencies_res.base,
			currency_rates: currencies_res.rates,
			currency
		});
	}
	
	componentWillUnmount() {
		for(let tm of [this.ship_transaction_tm, this.skill_transaction_tm, this.coin_pack_transaction_tm]) {
			if(tm)
				clearTimeout(tm);
		}
	}
	
	public onTransactionSuccess() {
		this.setState({transaction_success: true});
	}
	
	public onRedirecting(url: string) {
		this.setState({redirecting_url: url});
	}
	
	private areCurrencyDataLoaded() {
		return this.state.currency && this.state.currency_rates && this.state.currency_base;
	}
	
	private convertPrice(usd_price: number) {
		if( this.state.currency && this.state.currency_rates && this.state.currency in this.state.currency_rates ) {
			let price = this.state.currency_rates[this.state.currency] * usd_price;
			return price.toFixed(2);
		}
		this.props.onError('Cannot convert price for given currency: ' + this.state.currency);
		return 'error';
	}
	
	private tryBuyShip(type: number) {
		if( this.state.confirm_ship_buy !== undefined )
			return;
		
		this.setState({confirm_ship_buy: type, transaction_success: false});
		this.ship_transaction_tm = setTimeout(() => {
			this.setState({confirm_ship_buy: undefined});
			this.ship_transaction_tm = null;
		}, CONFIRMATION_TIMEOUT) as never;
	}
	
	private tryBuySkill(skill: SkillData) {
		if( this.state.confirm_skill_buy !== undefined )
			return;
		
		this.setState({confirm_skill_buy: skill, transaction_success: false});
		this.skill_transaction_tm = setTimeout(() => {
			this.setState({confirm_skill_buy: undefined});
			this.skill_transaction_tm = null;
		}, CONFIRMATION_TIMEOUT) as never;
	}
	
	private tryBuyCoinPack(pack: CoinPackSchema) {
		if( this.state.confirm_coin_pack_buy !== undefined )
			return;
		
		this.setState({confirm_coin_pack_buy: pack, transaction_success: false});
		this.coin_pack_transaction_tm = setTimeout(() => {
			this.setState({confirm_coin_pack_buy: undefined});
			this.coin_pack_transaction_tm = null;
		}, CONFIRMATION_TIMEOUT) as never;
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
	
	private cancelCoinPackBuyConfirm() {
		this.setState({confirm_coin_pack_buy: undefined, transaction_success: false});
		if(this.coin_pack_transaction_tm)
			clearTimeout(this.coin_pack_transaction_tm);
		this.coin_pack_transaction_tm = null;
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
	
	private renderCoinPacks() {
		return <div className={'coin-offers'}>{packs.map((pack_data, index) => {
			return <button key={index} onClick={() => this.tryBuyCoinPack(pack_data.pack)}>
				<label>
					{pack_data.name}&nbsp;pack<br/>
					{pack_data.pack.coins.toLocaleString()}&nbsp;coins
				</label>
				<div className={'icon'}/>
				<span>{this.convertPrice(pack_data.pack.price)}&nbsp;{this.state.currency}</span>
			</button>;
		})}
		</div>;
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
	
	private renderCoinPackConfirmPrompt(pack: CoinPackSchema) {
		return <>
			<h4 className={'fader-in'}>You sure you want to buy {pack.coins.toLocaleString()} coins for {
				this.convertPrice(pack.price)}&nbsp;{this.state.currency}?</h4>
			<button className={'fader-in'} onClick={() => {
				if( !this.state.currency )
					return;
				this.cancelCoinPackBuyConfirm();
				this.props.buyCoins(pack, this.state.currency).catch(console.error);
			}} style={{...offsetTop}}>
				BUY WITH PAYPAL
			</button>
			<br/>
			<button className={'fader-in'} onClick={() => this.cancelCoinPackBuyConfirm()}
				style={{color: '#e57373', ...offsetTop}}>NOPE</button>
		</>;
	}
	
	private renderCurrencySelector() {
		return <select defaultValue={this.state.currency} onChange={e => {
			if(this.state.currency_rates && e.target.value in this.state.currency_rates) {
				this.setState({currency: e.target.value});
				Settings.setValue('currency', e.target.value);
			}
		}}>{
			this.state.currency_rates && Object.entries(this.state.currency_rates).map(([symbol]) => {
				return <option key={symbol} value={symbol}>{symbol}</option>
			})
		}</select>;
	}
	
	render() {
		return <section className={'shop-section'}>
			{this.state.transaction_success && <div className={'fader-in'} style={{
				color: '#8BC34A',
				fontWeight: 'bold',
				fontSize: '14px',
				...offsetTop
			}}>Transaction successful</div>}
			{this.state.redirecting_url && <>
					<div className={'fader-in'} style={{
						fontWeight: 'bold',
						fontSize: '14px',
						...offsetTop
					}}>Redirecting to your paypal account</div>
					{(window.location.href = this.state.redirecting_url) && false}
				</>
			}
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
			
			<label className={'separating-label'} style={{...offsetVert}}>SHIPS</label>
			<div className={'fader-in'}>{
				this.state.confirm_ship_buy === undefined ? this.renderShipsList(this.props.account)
					:
					this.renderShipBuyConfirmPrompt(this.state.confirm_ship_buy)
			}</div>
			
			<label className={'separating-label'} style={{...offsetVert}}>SKILLS</label>
			<div className={'fader-in'} style={this.state.confirm_skill_buy !== undefined ? {} : {
				display: 'grid',
				gridTemplateColumns: 'auto auto auto',
				justifyContent: 'center',
				gridRowGap: '10px'
			}}>{
				this.state.confirm_skill_buy === undefined ? this.renderSkillsList(this.props.account)
					:
					this.renderSkillBuyConfirmPrompt(this.state.confirm_skill_buy)
			}</div>
			
			{this.areCurrencyDataLoaded() && <>
				<label className={'separating-label'} style={{...offsetVert}}>COINS (real money)</label>
				<div className={'fader-in currency-selection-container'}>
					<label>Currency:&nbsp;</label>
					{this.renderCurrencySelector()}
				</div>
				<div className={'fader-in'} style={offsetTop}>{
					this.state.confirm_coin_pack_buy === undefined ? this.renderCoinPacks()
						:
						this.renderCoinPackConfirmPrompt(this.state.confirm_coin_pack_buy)
				}</div>
			</>}
		</section>;
	}
}