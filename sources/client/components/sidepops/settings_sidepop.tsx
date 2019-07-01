import * as React from 'react';

import SidepopBase from './sidepop_base';
import OptionsList from "../widgets/options_list";
import SlideBar from "../widgets/slidebar";

export default class SettingsSidepop extends React.Component<any, any> {
	
	constructor(props: any) {
		super(props);
	}
	
	render() {
		return <SidepopBase onClose={this.props.onClose} show_navigator={true}>
			<div className={'fader-in'}>
				<label className={'separating-label'}>Painter resolution</label>
				<OptionsList options={['LOW', 'MEDIUM', 'HIGH']} />
			</div>
			
			<div className={'fader-in'}>
				<label className={'separating-label'}>Shadows type</label>
				<OptionsList options={['FLAT', 'LONG']} />
			</div>
			
			<div className={'fader-in'}>
				<label className={'separating-label'}>Weather particles</label>
				<div>TODO: switcher</div>
			</div>
			
			<hr/>
			
			<div className={'fader-in'}>
				<label className={'separating-label'}>Sound effects</label>
				<SlideBar />
			</div>
			
			<hr/>
			
			<div className={'fader-in'}>
				<label className={'separating-label'}>Auto hide right panel</label>
				<div>TODO: switcher</div>
			</div>
			
			<div className={'fader-in'}>{/*TODO: show this option only when auto hiding right panel is enabled*/}
				<label className={'separating-label'}>Do not hide chat with right panel</label>
				<div>TODO: switcher</div>
			</div>
		</SidepopBase>;
	}
}