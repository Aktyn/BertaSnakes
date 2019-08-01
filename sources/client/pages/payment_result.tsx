import * as React from 'react';
import ContainerPage, {ContainerProps} from "./container_page";
import {offsetTop} from "../components/sidepops/sidepops_common";
import AccountSidepop, {VIEWS} from "../components/sidepops/account_sidepop";
import Account, { AccountSchema } from '../account';
import ERROR_CODES, {errorMsg} from "../../common/error_codes";

import '../styles/pages/payment_result.scss';
import Loader from "../components/widgets/loader";
import {CoinPackSchema} from "../../common/config";
import { AccountDetails } from '../components/sidepops/account_section';

const enum RESULT_TYPE {
	UNKNOWN = 1,//prevent falsy values
	SUCCESS,
	CANCEL,
	ERROR
	
}
const result_routes = new Map([
	['success', RESULT_TYPE.SUCCESS],
	['cancel', RESULT_TYPE.CANCEL]
]);

interface PaymentResultState extends ContainerProps {
	type: RESULT_TYPE;
	open_shop: boolean;
	execution_res: RESULT_TYPE;
	account: AccountSchema | null;
	bought_pack: CoinPackSchema | null;
}

export default class PaymentResult extends React.Component<any, PaymentResultState> {
	
	state: PaymentResultState = {
		loading: false,
		error: undefined,
		show_navigator: false,
		type: result_routes.get(this.props.match.params.result) || RESULT_TYPE.UNKNOWN,
		open_shop: false,
		execution_res: RESULT_TYPE.UNKNOWN,
		account: null,
		bought_pack: null
	};
	
	constructor(props: any) {
		super(props);
	}
	
	async componentDidMount() {
		if( this.state.type === RESULT_TYPE.SUCCESS ) {
			let url = new URL(location.href);
			
			let res = await Account.executePurchase(
				url.searchParams.get('PayerID') || '',
				url.searchParams.get('paymentId') || '',
				url.searchParams.get('token') || ''
			);
			
			if(res.error !== ERROR_CODES.SUCCESS) {
				this.setError(errorMsg(res.error));
				this.setState({execution_res: RESULT_TYPE.ERROR});
			}
			else {
				this.setState({
					execution_res: RESULT_TYPE.SUCCESS,
					bought_pack: res.pack,
					account: Account.getAccount()
				});
			}
		}
	}
	
	private setError(msg: string) {
		this.setState({error: msg, loading: false});
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
		if( this.state.execution_res === RESULT_TYPE.ERROR ) {
			return <h2 style={offsetTop}>
				Sorry. You cannot make purchase at the moment. Please try again later.
			</h2>;
		}
		else if( this.state.execution_res !== RESULT_TYPE.SUCCESS ) {
			return <>
				<h2 style={offsetTop}>Executing purchase</h2>
				<Loader color={'#FF7043'} absolutePos={false}/>
			</>;
		}
		
		//render success
		return <>
			<h2 style={offsetTop}>
				You have successfully bought {this.state.bought_pack && this.state.bought_pack.coins.toLocaleString()} coins
			</h2>
			{this.state.account && <AccountDetails account={this.state.account} />}
			<hr />
			<button style={offsetTop} className={'shop-btn'}
			        onClick={() => this.setState({open_shop: true})}>BACK TO SHOP</button>
		</>;
	}
	
	render() {
		return <ContainerPage key={'payment-result'} className={'payment-result'} error={this.state.error}
		                      loading={this.state.loading}>
			{(() => {
				switch (this.state.type) {
					default:
					case RESULT_TYPE.UNKNOWN:
						return <h2 style={offsetTop}>Error. Unknown route.</h2>;
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