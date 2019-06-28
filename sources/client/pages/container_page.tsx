import * as React from 'react';
import Layout from "../components/layout";
import Loader from '../components/loader';

import '../styles/container.scss';

export interface ContainerProps {
	loading: boolean;
	error?: string;
	show_navigator: boolean;
	navigator_return?: () => void;
}

export default class ContainerPage extends React.Component<ContainerProps, any> {
	static defaultProps: Partial<ContainerProps> = {
		show_navigator: false
	};
	
	constructor(props: ContainerProps) {
		super(props);
	}
	
	private renderNavigator() {
		return <nav>
			{this.props.navigator_return && <button className='returner'
			    onClick={this.props.navigator_return}>RETURN</button>}
		</nav>;
	}
	
	render() {
		return <Layout>
			<div className={'container'}>
				{this.props.show_navigator && this.renderNavigator()}
				{this.props.loading && <Loader color='#ef5350' />}
				{this.props.error && <div className='error'>{this.props.error}</div>}
				{this.props.children}
			</div>
		</Layout>;
	}
}