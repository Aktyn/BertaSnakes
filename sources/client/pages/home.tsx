import * as React from 'react';

import '../styles/homepage.scss';

const graphics2 = require('../img/graphics2.jpg');
const graphics3 = require('../img/graphics3.jpg');

// const money_icon = require('../img/icons/money.png');
const cash_icon = require('../img/icons/cash.svg');
const social_icon = require('../img/icons/social.svg');
const podium_icon = require('../img/icons/podium.svg');

export default class extends React.Component<any, any> {
	private dynamic_appears: Set<HTMLElement> = new Set();
	
	private readonly wheel_listener: () => void;
	
	constructor(props: any) {
		super(props);
		
		this.wheel_listener = this.onWheel.bind(this);
	}
	
	componentDidMount() {
		let layout = document.getElementById('layout');
		if(layout)
			layout.addEventListener('scroll', this.wheel_listener, false);
	}
	
	componentWillUnmount() {
		let layout = document.getElementById('layout');
		if(layout)
			layout.removeEventListener('scroll', this.wheel_listener, false);
		this.dynamic_appears.clear();
	}
	
	private onWheel() {
		const windowBottomEdge = window.scrollY + window.innerHeight;
		
		for(let section of this.dynamic_appears.values()) {
			let elementTopEdge = section.getBoundingClientRect().top;
			
			if(elementTopEdge + 100 <= windowBottomEdge)
				section.classList.add('appear');
		}
	}
	
	private registerDynamicAppear(element: HTMLElement | null) {
		if(element)
			this.dynamic_appears.add(element);
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
				</section>
			</article>
			
			<div className={'parallax-image'}>
				<div style={{backgroundImage: `url(${graphics3})`}} />
			</div>
			
			<article className={'features'}>
				<section ref={this.registerDynamicAppear.bind(this)}>
					<label>SHOP</label>
					<div className={'content'}>Finish games destroying as much enemies as you can to receive coins
						and spend them to expand your character's possibilities</div>
					<img src={cash_icon} alt={'cash icon'} />
				</section>
				<section ref={this.registerDynamicAppear.bind(this)}>
					<label>SOCIAL CHAT</label>
					<div className={'content'}>Invite some friends and chat with them privately even in a middle of gameplay</div>
					<img src={social_icon} alt={'social icon'} />
				</section>
				<section ref={this.registerDynamicAppear.bind(this)}>
					<label>RANKINGS</label>
					<div className={'content'}>Gain rank and experience from playing games and climb up in global ranking</div>
					<img src={podium_icon} alt={'podium icon'} />
				</section>
			</article>
			
			<div className={'parallax-image'}>
				<div style={{backgroundImage: `url(${graphics2})`}} />
			</div>
		</div>;
	}
}