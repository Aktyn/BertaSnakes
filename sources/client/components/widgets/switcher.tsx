import * as React from 'react';

import '../../styles/widgets/switcher.scss';

interface SwitcherProps {
	defaultValue: boolean;
	onSwitch?: (enabled: boolean) => void;
}

interface SwitcherState {
	enabled: boolean;
}

export default class Switcher extends React.Component<SwitcherProps, SwitcherState> {
	static defaultProps: Partial<SwitcherProps> = {
		defaultValue: false
	};
	
	state: SwitcherState = {
		enabled: false
	};
	
	constructor(props: SwitcherProps) {
		super(props);
	}
	
	componentDidMount() {
		if( this.props.defaultValue !== this.state.enabled )
			this.setState({enabled: this.props.defaultValue});
	}
	
	componentDidUpdate(prevProps: Readonly<SwitcherProps>) {
		if( this.props.defaultValue !== undefined && this.props.defaultValue !== prevProps.defaultValue )
			this.setState({enabled: this.props.defaultValue});
	}
	
	public switch() {
		if(this.props.onSwitch)
			this.props.onSwitch( !this.state.enabled );
		this.setState({enabled: !this.state.enabled});
	}
	
	render() {
		return <button className={`switcher${this.state.enabled ? ' enabled' : ''}`} onClick={this.switch.bind(this)}>
			<span />
		</button>;
	}
}