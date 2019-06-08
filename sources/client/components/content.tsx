import * as React from 'react';

export default class extends React.Component<any, any> {
	constructor(props: any) {
		super(props);
	}

	render() {//floating widgets may be created here
		return <main>{this.props.children}</main>;
	}
}