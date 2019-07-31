import * as React from 'react';
import ContainerPage, {ContainerProps} from "./container_page";

import '../styles/pages/payment_result.scss';
import {offsetTop} from "../components/sidepops/sidepops_common";
import AccountSidepop, {VIEWS} from "../components/sidepops/account_sidepop";

const enum RESULT_TYPE {
	UNKNOWN = 1,//prevent falsy values
	SUCCESS,
	CANCEL,
	
}
const result_routes = new Map([
	['success', RESULT_TYPE.SUCCESS],
	['cancel', RESULT_TYPE.CANCEL]
]);

interface PaymentResultState extends ContainerProps {
	type: RESULT_TYPE;
	open_shop: boolean;
}

export default class PaymentResult extends React.Component<any, PaymentResultState> {
	
	state: PaymentResultState = {
		loading: false,
		error: undefined,
		show_navigator: false,
		type: result_routes.get(this.props.match.params.result) || RESULT_TYPE.UNKNOWN,
		open_shop: false
	};
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
		if( this.state.type === RESULT_TYPE.SUCCESS ) {
			//TODO: execute transaction
		}
	}
	
	/*private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}*/
	
	private static renderUnknownSection() {
		return <h2 style={offsetTop}>Error. Unknown route.</h2>;
	}
	
	private renderCancelSection() {
		return <>
			<h2 style={offsetTop}>Purchase canceled</h2>
			<div style={offsetTop}>Wanna change your mind?</div>
			<button style={offsetTop} className={'shop-btn'}
			        onClick={() => this.setState({open_shop: true})}>OPEN SHOP</button>
		</>;
	}
	
	private renderSuccessSection() {
		return <>
			<h2 style={offsetTop}>Executing purchase</h2>
		</>;
	}
	
	render() {
		return <ContainerPage key={'payment-result'} className={'payment-result'} error={this.state.error}
		                      loading={this.state.loading}>
			{(() => {
				switch (this.state.type) {
					default:
					case RESULT_TYPE.UNKNOWN:
						return PaymentResult.renderUnknownSection();
					case RESULT_TYPE.CANCEL:
						return this.renderCancelSection();
					case RESULT_TYPE.SUCCESS:
						return this.renderSuccessSection();
				}
			})()}
			{this.state.open_shop && <AccountSidepop onClose={() => this.setState({open_shop: false})}
			                                         force_view={VIEWS.SHOP} />}
		</ContainerPage>;
	}
}