import * as React from 'react';
import Header from './header';
import Footer from './footer';

import '../styles/layout-main.scss';

interface LayoutProps {
	compactHeader: boolean;
	online: boolean;
}

export default class Layout extends React.Component<LayoutProps, any> {
	static defaultProps: Partial<LayoutProps> = {
		compactHeader: false,
		online: false
	};
	
	constructor(props: LayoutProps) {
		super(props);
	}

	render() {
		return <div className='layout-main' id={'layout'}>
			<Header compact={this.props.compactHeader} online={this.props.online}/>
			<div className='layout-content'>{this.props.children}</div>
			<Footer/>
		</div>;
	}
}