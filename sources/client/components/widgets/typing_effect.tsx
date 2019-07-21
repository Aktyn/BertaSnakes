import * as React from 'react';

import '../../styles/widgets/typing_effect.scss';

export interface TypingEffectProps {
	showCursor: boolean;
	minSpeed: number;//milliseconds
	maxSpeed: number;//milliseconds
}

interface TypingEffectState {
	text: string;
}

export default class TypingEffect extends React.Component<TypingEffectProps, TypingEffectState> {
	static defaultProps: Partial<TypingEffectProps> = {
		showCursor: false,
		minSpeed: 150,
		maxSpeed: 500,
	};
	
	private next_letter_tm: NodeJS.Timeout | null = null;
	
	state: TypingEffectState = {
		text: ''
	};
	
	constructor(props: any) {
		super(props);
	}
	
	componentWillMount() {
		if(typeof this.props.children !== 'string')
			throw new Error('Children of this component must be a string');
		//console.log(this.props.children, typeof this.props.children);
		this.nextTypings(0);
	}
	
	componentWillUnmount() {
		if(this.next_letter_tm)
			clearTimeout(this.next_letter_tm);
	}
	
	private get randomSpeed() {
		if(this.props.maxSpeed === this.props.minSpeed)
			return this.props.minSpeed;
		return this.props.minSpeed + Math.random() * (this.props.maxSpeed - this.props.minSpeed);
	}
	
	private nextTypings(index: number) {
		if(index >= (this.props.children as string).length) {//text typed completely
			this.next_letter_tm = null;
			return;
		}
		this.next_letter_tm = setTimeout(() => {
			this.state.text += (this.props.children as string).charAt(index);
			this.setState({text: this.state.text});
			this.nextTypings(index+1);
		}, this.randomSpeed) as never;
	}
	
	render() {
		if(this.props.showCursor && this.state.text !== this.props.children) {
			return <>
				{this.state.text}<span className={'pulsing-cursor'}>|</span>
			</>;
		}
		return this.state.text;
	}
}