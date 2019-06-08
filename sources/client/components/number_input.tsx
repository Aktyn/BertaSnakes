import * as React from 'react';

// import './../styles/number_input.scss';

interface NumberInputProps {
	min: number;
	max: number;
	defaultValue: number;
	prefix: string;
	postfix: string;

	onChange?: (value: number) => void;
}

interface NumberInputState {
	value: number;
}

export default class extends React.Component<NumberInputProps, NumberInputState> {

	private interval: number | undefined = undefined;
	private widget: HTMLDivElement | null = null;

	static defaultProps = {
		defaultValue: Number.MIN_SAFE_INTEGER,
		prefix: '',
		postfix: ''
	}

	state: NumberInputState = {
		value: 0
	}

	constructor(props: NumberInputProps) {
		super(props);
	}

	get value() {
		return Math.max(this.props.min, Math.min(this.props.max, this.state.value));
	}

	componentDidUpdate() {
		if(this.props.min > this.state.value)
			this.setState({value: this.props.min});
		else if(this.props.max < this.state.value)
			this.setState({value: this.props.max});
	}

	componentWillMount() {
		if(this.props.defaultValue !== Number.MIN_SAFE_INTEGER && 
			this.props.defaultValue >= this.props.min && this.props.defaultValue <= this.props.max) 
		{
			this.setState({value: this.props.defaultValue});
		}
		else
			this.setState({value: this.props.min});
	}

	componentWillUnmount() {
		if(this.interval)
			clearInterval(this.interval);
	}

	hold(e: MouseEvent, dir: -1 | 1) {
		this.modify(dir);
		if(e.button !== 0)
			return;
		this.interval = setInterval(() => {
			if(this.widget && this.widget.parentElement && 
				(this.widget.parentElement.querySelector(':hover') === this.widget) === false) 
			{
				clearInterval(this.interval);
				this.interval = undefined;
				return;
			}
			this.modify(dir === 1 ? 5 : -5);
		}, 500) as never;
	}

	modify(dir: -1 | 1 | -5 | 5) {
		let new_value = Math.min(this.props.max, Math.max(this.props.min, this.state.value+dir));
		this.setState({
			value: new_value
		});
		if(this.props.onChange)
			this.props.onChange(new_value);
	}

	render() {
		return <div className='number-input' ref={el => this.widget = el}>
			<button className='decrementer' onMouseDown={e => this.hold(e.nativeEvent, -1)}
				onMouseUp={() => this.interval && clearInterval(this.interval)}></button>
			<span className='value-displayer'>{this.state.value}{this.props.postfix}</span>
			<button className='incrementer' onMouseDown={e => this.hold(e.nativeEvent, 1)}
				onMouseUp={() => this.interval && clearInterval(this.interval)}></button>
		</div>;
	}
}