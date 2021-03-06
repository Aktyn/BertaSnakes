import * as React from 'react';
import '../../styles/widgets/options_list.scss';

interface OptionsListProps {
	options: string[];
	defaultValue?: string;
	onChange?: (value: string) => void;
}

interface OptionsListState {
	value: string;
}

export default class OptionsList extends React.Component<OptionsListProps, OptionsListState> {

	state: OptionsListState = {
		value: ''
	};

	constructor(props: OptionsListProps) {
		super(props);
	}

	public get value() {
		return this.state.value;
	}
	
	public setOption(opt: string) {
		if(opt === this.state.value)
			return;
		this.setState({value: opt});
		if(this.props.onChange)
			this.props.onChange(opt);
	}

	componentWillMount() {
		if(this.props.defaultValue && this.props.options.indexOf(this.props.defaultValue) !== -1)
			this.setState({value: this.props.defaultValue});
		else if(this.props.options.length > 0)
			this.setState({value: this.props.options[0]});
	}
	
	componentDidUpdate(prevProps: Readonly<OptionsListProps>) {
		if( this.props.defaultValue !== undefined && this.props.defaultValue !== prevProps.defaultValue )
			this.setOption(this.props.defaultValue);
	}
	
	render() {
		return <div className='options-list'>{this.props.options.map((opt, i) => {
			return <button key={i} className={this.state.value === opt ? 'current':''} onClick={() => {
				if(this.state.value === opt)
					return;
				this.setOption(opt);
			}}>{opt}</button>;
		})}</div>;
	}
}