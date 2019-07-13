import * as React from 'react';

const not_found_icon = require('../img/icons/not_found.svg');

export default class NotFound extends React.Component<any, any> {
	
	render() {
		return <div>
			<h1>REQUESTED PAGE WAS NOT FOUND</h1>
			<img src={not_found_icon} alt={'error icon'} style={{
				height: '100px'
			}} />
		</div>;
	}
}