import * as React from 'react';

import '../styles/pages/homepage.scss';
import Account, {AccountSchema} from '../account';
import {offsetTop} from "../components/sidepops/sidepops_common";
import AccountSidepop from "../components/sidepops/account_sidepop";

const graphics2 = require('../img/graphics2.jpg');
const graphics3 = require('../img/graphics3.jpg');

// const money_icon = require('../img/icons/money.png');
const cash_icon = require('../img/icons/cash.svg');
const social_icon = require('../img/icons/social.svg');
const podium_icon = require('../img/icons/podium.svg');

interface HomeState {
	account: AccountSchema | null;
	show_login_panel: boolean;
}

export default class HomePage extends React.Component<any, HomeState> {
	private dynamic_appears: Set<HTMLElement> = new Set();
	private lazy_images: Map<string, {element: HTMLDivElement, loaded: boolean}> = new Map();
	
	private readonly wheel_listener: () => void;
	private readonly onLogIn: (account: AccountSchema | null) => void;
	
	state: HomeState = {
		account: null,
		show_login_panel: false
	};
	
	constructor(props: any) {
		super(props);
		
		this.wheel_listener = this.onWheel.bind(this);
		this.onLogIn = (account) => this.setState({account});
	}
	
	componentDidMount() {
		let layout = document.getElementById('layout');
		if(layout)
			layout.addEventListener('scroll', this.wheel_listener, false);
		
		Account.addLoginListener( this.onLogIn );
	}
	
	componentWillUnmount() {
		let layout = document.getElementById('layout');
		if(layout)
			layout.removeEventListener('scroll', this.wheel_listener, false);
		this.dynamic_appears.clear();
		
		Account.removeLoginListener( this.onLogIn );
	}
	
	private static isInsideView(element: HTMLElement, offset = 0, windowBottomEdge = window.scrollY + window.innerHeight) {
		let elementTopEdge = element.getBoundingClientRect().top;
		return elementTopEdge + offset <= windowBottomEdge;
	}
	
	private onWheel() {
		const windowBottomEdge = window.scrollY + window.innerHeight;
		
		for(let section of this.dynamic_appears.values()) {
			if( HomePage.isInsideView(section, 100, windowBottomEdge) )
				section.classList.add('appear');
		}
		
		for(let [src, lazy_obj] of this.lazy_images.entries()) {
			if( !lazy_obj.loaded ) {
				if( !HomePage.isInsideView(lazy_obj.element, 0, windowBottomEdge) )
					continue;
				lazy_obj.loaded = true;
				HomePage.loadLazyImage(lazy_obj.element, src);
			}
		}
	}
	
	private static loadLazyImage(element: HTMLDivElement, img_src: string) {
		let background = document.createElement('div');
		background.style.backgroundImage = `url(${img_src})`;
		element.appendChild(background);
		console.log('Lazy loaded image:', img_src);
	}
	
	private registerDynamicAppear(element: HTMLElement | null) {
		if(element)
			this.dynamic_appears.add(element);
	}
	
	private registerLazyImage(element: HTMLDivElement | null, img_src: string) {
		if(!element)
			return;
		if( !this.lazy_images.has(img_src) ) {
			let is_in_view = HomePage.isInsideView(element);
			
			if(is_in_view)
				HomePage.loadLazyImage(element, img_src);
			this.lazy_images.set(img_src, {element, loaded: is_in_view});
		}
	}

	render() {
		return <div className={'homepage'}>
			<article className={'description'}>
				<section className={'appear-animation'}>
					<h1 className={'lucky-font'}>Berta Snakes</h1>
					<label>Multi-player browser game</label>
					<label>WebGL based graphics engine</label>
					<label>Unique collision physics</label>
					<label>Everything free of charge with no ads</label>
					{!this.state.account && <>
						<label>Log in now to get access to all features</label>
						<button style={offsetTop} onClick={() => {
							this.setState({show_login_panel: true});
						}}>LOG IN</button>
					</>}
				</section>
			</article>
			
			<div className={'parallax-image'} ref={el => this.registerLazyImage(el, graphics3)} />
			
			<article className={'features'}>
				<section ref={this.registerDynamicAppear.bind(this)}>
					<label>SHOP</label>
					<div className={'content'}>Finish games destroying as much enemies as you can to receive coins
						and spend them to expand your character's possibilities</div>
					<img src={cash_icon} alt={'cash icon'} />
				</section>
				<section ref={this.registerDynamicAppear.bind(this)}>
					<label>SOCIAL CHAT</label>
					<div className={'content'}>Invite some friends and chat with them privately
						even in a middle of gameplay</div>
					<img src={social_icon} alt={'social icon'} />
				</section>
				<section ref={this.registerDynamicAppear.bind(this)}>
					<label>RANKINGS</label>
					<div className={'content'}>Gain rank and experience from playing games and climb up in global ranking</div>
					<img src={podium_icon} alt={'podium icon'} />
				</section>
			</article>
			
			<div className={'parallax-image'} ref={el => this.registerLazyImage(el, graphics2)} />
			
			{this.state.show_login_panel && <AccountSidepop
				onClose={() => this.setState({show_login_panel: false})}/>}
		</div>;
	}
}