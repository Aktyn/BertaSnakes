import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Loader from '../loader';

import '../../styles/container.scss';

const page_root = document.getElementById('page');//same as in index.tsx
if(!page_root)
	throw new Error('Main page element not found');

export interface SidepopProps {
	onClose: () => void;
}

let opened_sidepops: SidepopContainer[] = [];

class SidepopContainer extends React.Component<SidepopProps, any> {
	private readonly sidepop_el: HTMLDivElement;

	constructor(props: SidepopProps) {
		super(props);
		this.sidepop_el = document.createElement('div');
		this.sidepop_el.className = 'sidepop-container';
		if(opened_sidepops.length > 0)//it is not a new sidepop
			this.sidepop_el.classList.add('no-fade');

		this.sidepop_el.onclick = e => {//clicking outside sidepop body closes every opened sidepop
			if(e.target === this.sidepop_el) {
				for(let sidepop of opened_sidepops)
					sidepop.close();
			}
		};
	}

	componentDidMount() {
		(page_root as HTMLDivElement).appendChild(this.sidepop_el);
		
		//hide previous sidepops
		for(let sidepop of opened_sidepops)
			sidepop.toggleView(false);
		opened_sidepops.push(this);//push newest one
	}

	componentWillUnmount() {
		(page_root as HTMLDivElement).removeChild(this.sidepop_el);
		
		for(let i=opened_sidepops.length-1; i>=0; i--) {
			if(opened_sidepops[i] === this)
				opened_sidepops.splice(i, 1);
		}
		if(opened_sidepops.length > 0)//if it was not last sidepop
			opened_sidepops[opened_sidepops.length-1].toggleView(true);//show previous
	}
	
	toggleView(show: boolean) {
		this.sidepop_el.classList.add('no-fade');
		this.sidepop_el.style.display = show ? 'initial' : 'none';
	}
	
	close() {
		this.props.onClose();
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
	};

	constructor(props: SidepopWrapperProps) {
		super(props);
	}

	renderNavigator() {
		return <nav>
			{this.props.navigator_return && 
				<button className='returner'
					onClick={this.props.navigator_return}>RETURN</button>}
			<button className='closer shaky-icon' onClick={this.props.onClose}/>
		</nav>;
	}

	render() {
		return <SidepopContainer onClose={this.props.onClose}>
			<div className='sidepop'>
				{this.props.show_navigator && this.renderNavigator()}
				{this.props.loading && <Loader color='#ef5350' />}
				{this.props.error && <div className='error'>{this.props.error}</div>}
				{this.props.children}
			</div>
		</SidepopContainer>;
	}
}