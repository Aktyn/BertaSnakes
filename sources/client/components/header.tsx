import * as React from 'react';
import { Link, Redirect } from 'react-router-dom';
import AccountWidget from './account_widget';
import AccountSidepop from './sidepops/account_sidepop';
import {RANKING_TYPES} from '../../common/config';
import NotificationsIndicator from "./widgets/notifications_indicator";

import '../styles/header.scss';

interface HeaderProps {
	compact: boolean;
}

interface HeaderState {
	show_sidepop: boolean;
	play: boolean;
	ripple_pos?: {x: number, y: number};
}

export default class Header extends React.Component<HeaderProps, HeaderState> {

	state: HeaderState = {
		show_sidepop: false,
		play: false
	};
	
	constructor(props: HeaderProps) {
		super(props);
	}
	
	play(e: React.MouseEvent<HTMLButtonElement>) {
		let layout = document.getElementById('layout');
		if(!layout)
			throw new Error('No layout element found');
		this.setState({
			ripple_pos: {
				x: e.clientX,
				y: e.clientY + layout.scrollTop
			}
		});
	}

	render() {
		return <div className={`header${this.props.compact ? ' compact' : ''}`}>
			<div className='upper'>
				<div className='background'/>
				<div className='header-content'>
					<nav>
						<button className={'navigator-play'} onClick={this.play.bind(this)}>PLAY</button>
						<button className={'navigator-account'} onClick={() => {
							this.setState({show_sidepop: true});
						}}>ACCOUNT</button>
						<Link to='/forum'>FORUM</Link>
						<Link to={'/rankings/'+RANKING_TYPES.TOP_RANK}>RANKINGS</Link>
						<Link to={'/gallery'}>GALLERY</Link>
					</nav>
					<div className='play-btn-wrapper'>
						<button onClick={this.play.bind(this)} onMouseDown={e => {
							if(e.button === 1)
								window.open('/play', '_blank');
						}}><span>PLAY</span></button>
					</div>
				</div>
				<AccountWidget />
			</div>
			<div className='header-bottom'>
				<Link to='/' className='home-link' aria-label={'homepage-link'}/>
				<Link to='/search' className='search-link' aria-label={'search-link'}/>
				<NotificationsIndicator />
			</div>
			{this.state.ripple_pos && <div className={'ripple-transition'} style={{
				left:   `${this.state.ripple_pos.x}px`,
				top:    `${this.state.ripple_pos.y}px`,
				backgroundColor: '#5a9698'
			}} onAnimationEnd={() => this.setState({play: true})} />}
			{this.state.show_sidepop && <AccountSidepop onClose={() => {
				this.setState({show_sidepop: false});
			}} />}
			{this.state.play && <Redirect to='/play' />}
		</div>;
	}
}