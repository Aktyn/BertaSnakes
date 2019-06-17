import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Loader from '../loader';

import './../../styles/sidepop.scss';

const page_root = document.getElementById('page');//same as in index.tsx
if(!page_root)
	throw new Error('Main page element not found');

export interface SidepopProps {
	onClose: () => void;
}

class SidepopContainer extends React.Component<SidepopProps, any> {
	private sidepop_el: HTMLDivElement;

	constructor(props: SidepopProps) {
		super(props);
		this.sidepop_el = document.createElement('div');
		this.sidepop_el.className = 'sidepop-container';

		this.sidepop_el.onclick = e => {
			if(e.target === this.sidepop_el)
				this.props.onClose();
		};
	}

	componentDidMount() {
		(page_root as HTMLDivElement).appendChild(this.sidepop_el);
	}

	componentWillUnmount() {
		(page_root as HTMLDivElement).removeChild(this.sidepop_el);
	}

	render() {
		return ReactDOM.createPortal(this.props.children, this.sidepop_el);
	}
}

interface SidepopWrapperProps extends SidepopProps {
	show_navigator: boolean;
	navigator_return?: () => void;

	loading: boolean;
	error?: string;
}

export default class SidepopBase extends React.Component<SidepopWrapperProps, any> {

	static defaultProps = {
		show_navigator: false,
		navigator_return: undefined
	}

	constructor(props: SidepopWrapperProps) {
		super(props);
	}

	renderNavigator() {
		return <nav>
			{this.props.navigator_return && 
				<button className='sidepop_returner' 
					onClick={this.props.navigator_return}>RETURN</button>}
			<button className='sidepop_closer shaky-icon' onClick={this.props.onClose}></button>
		</nav>;
	}

	render() {
		return <SidepopContainer /*side={this.props.side}*/ onClose={this.props.onClose}>
			<div className='sidepop'>
				{this.props.show_navigator && this.renderNavigator()}
				{this.props.loading && <Loader color='#ef5350' />}
				{this.props.error && <div className='error'>{this.props.error}</div>}
				{this.props.children}
			</div>
		</SidepopContainer>;
	}
}