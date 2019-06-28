import * as React from 'react';
import Layout from "../components/layout";
import Loader from '../components/loader';

import '../styles/container.scss';

export interface ContainerProps {
	loading: boolean;
	error?: string;
}

export default class ContainerPage extends React.Component<ContainerProps, any> {
	constructor(props: ContainerProps) {
		super(props);
	}
	
	render() {
		return <Layout>
			<div className={'container'}>
				{this.props.loading && <Loader color='#ef5350' />}
				{this.props.error && <div className='error'>{this.props.error}</div>}
				{this.props.children}
			</div>
		</Layout>;
	}
}