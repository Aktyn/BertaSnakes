import * as React from 'react';
import {Link} from "react-router-dom";
import {offsetTop} from "./sidepops_common";

export default class SharePanel extends React.Component<{link: string}, {link_copied: boolean}> {
	state = {
		link_copied: false
	};
	
	render() {
		return <div className={'fader-in'}>
			<div>Link&nbsp;to&nbsp;share:</div>
			<div>
				<Link to={this.props.link} target={'_blank'}>{location.origin + this.props.link}</Link>
			</div>
			<button style={{
				...offsetTop,
				border: this.state.link_copied ? '1px solid #9CCC65' : 'none'
			}} onClick={() => {
				let textField = document.createElement('textarea');
				textField.innerText = location.origin + this.props.link;
				document.body.appendChild(textField);
				textField.select();
				document.execCommand('copy');
				textField.remove();
				this.setState({link_copied: true});
			}}>COPY</button>
		</div>
	}
}