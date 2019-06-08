import * as React from 'react';
// import { withRouter } from 'react-router-dom';

import Header from './header';
import Footer from './footer';

import '../styles/layout-main.scss';

export default class Layout extends React.Component<any, any> {

	constructor(props: any) {
		super(props);
	}

	render() {
		return <div className='layout-main'>
			<Header/>
			<div className='layout-content'>{this.props.children}</div>
			<Footer/>
		</div>;
	}
}