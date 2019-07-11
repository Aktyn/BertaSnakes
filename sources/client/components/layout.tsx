import * as React from 'react';
import Header from './header';
import Footer from './footer';

import '../styles/layout-main.scss';

interface LayoutProps {
	compactHeader: boolean;
}

export default class Layout extends React.Component<LayoutProps, any> {
	static defaultProps: Partial<LayoutProps> = {
		compactHeader: false
	};
	
	constructor(props: LayoutProps) {
		super(props);
	}

	render() {
		return <div className='layout-main'>
			<Header compact={this.props.compactHeader}/>
			<div className='layout-content'>{this.props.children}</div>
			<Footer/>
		</div>;
	}
}