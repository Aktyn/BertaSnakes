import * as React from 'react';
import {offsetTop} from '../../components/sidepops/sidepops_common';

interface RoomsProps {
	setError: (msg: string) => void;
}

interface RoomsState {

}

export default class RoomsSection extends React.Component<RoomsProps, RoomsState> {
	
	state: RoomsState = {
	
	};
	
	componentDidMount(): void {
		this.refresh().catch(console.error);
	}
	
	private async refresh() {
	
	}
	
	render() {
		return <section>
			<button style={offsetTop} onClick={this.refresh.bind(this)}>REFRESH ROOMS</button>
		</section>;
	}
}