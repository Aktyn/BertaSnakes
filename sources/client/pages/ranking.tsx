import * as React from 'react';
//import Utils from './../common/utils';

export default class Ranking extends React.Component<any, any> {

	constructor(props: any) {
		super(props);

		this.loadRanking();
	}

	loadRanking() {
		/*Utils.postRequest('ranking_request', {page: Ranking.extractPageID()}).then(res => {
			console.log(res);
			this.setState({
				loaded: true,
				raw_result: res
			});
		}).catch(console.error);*/
	}

	render() {
		return <div>
			TODO - ranking
		</div>;
	}
}