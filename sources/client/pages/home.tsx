import * as React from 'react';
import Layout from '../components/layout';
// import './../styles/homepage.scss';
import Loader from '../components/widgets/loader';

export default class extends React.Component<any, any> {
	constructor(props: any) {
		super(props);
	}

	render() {
		return <Layout>
			<Loader />
			<hr/>
			HOME TODO - latest news
		</Layout>;
	}
}