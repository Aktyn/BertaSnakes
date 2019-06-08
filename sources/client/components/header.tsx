import * as React from 'react';
import { Link } from 'react-router-dom';
import AccountWidget from './account_widget';

import './../styles/header.scss';

export default class Header extends React.Component<any, any> {

	constructor(props: any) {
		super(props);
	}

	render() {
		return <div className='header'>
			<div className='upper'>
				<div className='background'></div>
				<div className='header-content'>
					<nav>
						<Link to='/forum'>FORUM</Link>
						<Link to='/rankings'>RANKINGS</Link>
					</nav>
					<div className='play-btn-wrapper'>
						<Link to='/play'><span>PLAY</span></Link>
					</div>
				</div>
				<AccountWidget />
			</div>
			<div className='header-bottom'>
				<Link to='/' className='home-link'></Link>

			</div>
		</div>;
	}
}