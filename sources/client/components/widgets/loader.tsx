import * as React from 'react';
import Loadable from 'react-loadable';

import '../../styles/widgets/loader.scss';

interface LoaderProps extends Loadable.LoadingComponentProps {
	color: string;
	isLoading: boolean;
    pastDelay: boolean;
    timedOut: boolean;
    error: any;
	retry: () => void;
}

export default class Loader extends React.Component<LoaderProps, any> {
	// noinspection JSUnusedGlobalSymbols
	static defaultProps = {
		color: '#f4f4f4',
		isLoading: true,
		pastDelay: false,
		timedOut: false,
		error: undefined,
		retry: () => {}
	};

	constructor(props: any) {
		super(props);
	}
	render() {
		const spin_style = { backgroundColor: this.props.color };
		return <div className='spinner'>
			<div className='double-bounce1' style={spin_style}/>
			<div className='double-bounce2' style={spin_style}/>
		</div>;
	}
}