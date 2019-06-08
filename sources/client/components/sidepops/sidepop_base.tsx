import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './../../styles/sidepop.scss';

const page_root = document.getElementById('page');//same as in index.tsx
if(!page_root)
	throw new Error('Main page element not found');

/*export const enum SIDE {
	LEFT, RIGHT
}*/

export interface SidepopProps {
	//side: SIDE;
	onClose: () => void;
}

class SidepopContainer extends React.Component<SidepopProps, any> {
	private sidepop_el: HTMLDivElement;

	/*static defaultProps = {
		//side: SIDE.RIGHT
	}*/

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
		//if(this.props.side === SIDE.LEFT)
		//	this.sidepop_el.classList.add('left-side');
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
}

export default class SidepopBase extends React.Component<SidepopWrapperProps, any> {

	static defaultProps = {
		//side: SIDE.RIGHT
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
				{this.props.children}
			</div>
		</SidepopContainer>;
	}
}