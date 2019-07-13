import * as React from 'react';
import { Link } from 'react-router-dom';
import AccountWidget from './account_widget';
import AccountSidepop from './sidepops/account_sidepop';
import {RANKING_TYPES} from '../../common/config';
import NotificationsIndicator from "./widgets/notifications_indicator";

import './../styles/header.scss';

interface HeaderProps {
	compact: boolean;
}

interface HeaderState {
	show_sidepop: boolean;
}

export default class Header extends React.Component<HeaderProps, HeaderState> {

	state: HeaderState = {
		show_sidepop: false,
	};
	
	constructor(props: HeaderProps) {
		super(props);
	}

	render() {
		return <div className={`header${this.props.compact ? ' compact' : ''}`}>
			<div className='upper'>
				<div className='background'/>
				<div className='header-content'>
					<nav>
						<Link className={'navigator-play'} to='/play'>PLAY</Link>
						<button className={'navigator-account'} onClick={() => {
							this.setState({show_sidepop: true});
						}}>ACCOUNT</button>
						<Link to='/forum'>FORUM</Link>
						<Link to={'/rankings/'+RANKING_TYPES.TOP_RANK}>RANKINGS</Link>
						<Link to={'/gallery'}>GALLERY</Link>
					</nav>
					<div className='play-btn-wrapper'>
						<Link to='/play'><span>PLAY</span></Link>
					</div>
				</div>
				<AccountWidget />
			</div>
			<div className='header-bottom'>
				<Link to='/' className='home-link' aria-label={'homepage-link'}/>
				<NotificationsIndicator />
			</div>
			{this.state.show_sidepop && <AccountSidepop onClose={() => {
				this.setState({show_sidepop: false});
			}} />}
		</div>;
	}
}