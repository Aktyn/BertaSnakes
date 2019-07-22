import * as React from 'react';

const blockDisplay: React.CSSProperties = {display: 'block'};

export default class StatusIndicator extends React.Component<{
	is_playing: boolean;
	online: boolean;
	is_in_room: boolean;
}, any> {
	
	render() {
		return <span className={'status-indicator'} style={{
			color: this.props.online ? '#8BC34A' : '#e57373',
			display: 'inline-block',
			marginLeft: '5px',
			fontSize: '16px'
		}}>{
			this.props.is_playing ?
				<span style={blockDisplay}>&#11208;</span> :
				(this.props.is_in_room ?
					<span style={blockDisplay}>&#9632;</span> : <span style={blockDisplay}>&#9679;</span>)
		}</span>;
	}
}