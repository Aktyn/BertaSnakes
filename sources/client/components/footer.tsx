import * as React from 'react';

import '../styles/footer.scss';

const aktyn_logo = require('../img/icons/aktyn.png');

declare var _UPDATE_TIME_: number;//compile-time variable passed from webpack config

function padZ(n: number) {//pad zero at the beginning
	return ('0'+n).slice(-2);
}

export default class extends React.Component<any, any> {

	constructor(props: any) {
		super(props);
	}

	render() {
		let dt = new Date(_UPDATE_TIME_);

		let update_time = `${padZ(dt.getDate())}-${padZ(dt.getMonth()+1)}-${padZ(dt.getFullYear())} ` +
			`${padZ(dt.getHours())}:${padZ(dt.getMinutes())}`;

		return <div className='footer'>
			<span>Last update: {update_time}</span>
			<span>Copyright &copy; 2019 - Aktyn <img alt='author logo' src={aktyn_logo} /> - All rights reserved</span>
			<a href='https://github.com/Aktyn' target='_blank' rel="noreferrer">https://github.com/Aktyn</a>
		</div>;
	}
}