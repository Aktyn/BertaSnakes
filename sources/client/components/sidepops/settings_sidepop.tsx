import * as React from 'react';

import SidepopBase from './sidepop_base';
import OptionsList from "../widgets/options_list";
import SlideBar from "../widgets/slidebar";
import Switcher from "../widgets/switcher";
import Settings from '../../game/engine/settings';
import {PAINTER_RESOLUTION} from '../../../common/game/paint_layer';

const bold: React.CSSProperties = {fontWeight: 'bold'};

function extendType<T>(target: T): T & {[index: string]: string} {
	return target as T & {[index: string]: string};
}

const resolution_labels = extendType({
	[PAINTER_RESOLUTION.LOW]:   'LOW',
	[PAINTER_RESOLUTION.MEDIUM]:'MEDIUM',
	[PAINTER_RESOLUTION.HIGH]:  'HIGH'
});

interface SettingsSidepopState {
	painter_resolution: PAINTER_RESOLUTION;
	advanced_shaders: boolean;
	shadows_type: string;
	weather_particles: boolean;
	particles: boolean;
	auto_hide_right_panel: boolean;
	auto_hide_chat: boolean;
	sound_volume: number;
}

export default class SettingsSidepop extends React.Component<any, any> {
	
	private static getDefaults(): SettingsSidepopState {
		return {
			painter_resolution: Settings.getValue('painter_resolution') as number,
			advanced_shaders: !!Settings.getValue('advanced_shaders'),
			shadows_type: Settings.getValue('shadows_type') as string,
			weather_particles: !!Settings.getValue('weather_particles'),
			particles: !!Settings.getValue('particles'),
			auto_hide_right_panel: !!Settings.getValue('auto_hide_right_panel'),
			auto_hide_chat: !!Settings.getValue('auto_hide_chat'),
			sound_volume: Settings.getValue('sound_volume') as number
		};
	}

	state: SettingsSidepopState = SettingsSidepop.getDefaults();
	
	constructor(props: any) {
		super(props);
	}
	
	componentDidMount() {
		this.refresh();
	}
	
	private refresh() {
		this.setState( SettingsSidepop.getDefaults() );
	}
	
	render() {
		return <SidepopBase onClose={this.props.onClose} show_navigator={true}>
			<section className={'fader-in labeled-section'}>
				<label className={'separating-label'} style={bold}>GRAPHICS</label>
				<div className={'details-list breakable'}>
					<label>Painter resolution:</label>
					<OptionsList options={Object.values(resolution_labels)}
					             defaultValue={resolution_labels[ this.state.painter_resolution ]}
					             onChange={(label) => {
					             	let key = Object.keys(resolution_labels)
					                    .find(l => resolution_labels[l] === label);
					             	
					             	if(key === undefined)
					             		return;
					             	let res = parseInt(key);
					             	if( isNaN(res) )
					             		return;
					             	Settings.setValue('painter_resolution', res);
					             	this.setState({painter_resolution: res});
					             }}/>
					             
					<label>Advanced shaders*</label>
					<Switcher onSwitch={enabled => {
						Settings.setValue('advanced_shaders', enabled);
						this.setState({advanced_shaders: enabled});
					}} defaultValue={ this.state.advanced_shaders } />
					
					{this.state.advanced_shaders && <>
						<label>Shadows type**</label>
						<OptionsList options={['FLAT', 'LONG']} onChange={type => {
							Settings.setValue('shadows_type', type);
							this.setState({shadows_type: type});
						}} defaultValue={this.state.shadows_type} />
					</>}
					
					<label>Enable particles***</label>
					<Switcher onSwitch={enabled => {
						Settings.setValue('particles', enabled);
						this.setState({particles: enabled});
					}} defaultValue={ this.state.particles } />
					
					{this.state.particles && <>
						<label>Weather particles</label>
						<Switcher onSwitch={enabled => {
							Settings.setValue('weather_particles', enabled);
							this.setState({weather_particles: enabled});
						}} defaultValue={ this.state.weather_particles } />
					</>}
				</div>
			</section>
			
			<section className={'fader-in labeled-section'}>
				<label className={'separating-label'} style={bold}>SOUNDS</label>
				<div className={'details-list breakable'}>
					<label>Volume:</label>
					<SlideBar defaultValue={this.state.sound_volume*100} onUpdate={value => {
						Settings.setValue('sound_volume', value/100);
						this.setState({sound_volume: value/100});
					}} minValue={0} maxValue={100} precision={0} valueSuffix={'%'} />
				</div>
			</section>
			
			<section className={'fader-in labeled-section'}>
				<label className={'separating-label'} style={bold}>GUI</label>
				<div className={'details-list breakable'}>
					<label>Auto hide right panel:</label>
					<Switcher onSwitch={enabled => {
						Settings.setValue('auto_hide_right_panel', enabled);
						this.setState({auto_hide_right_panel: enabled})
					}} defaultValue={this.state.auto_hide_right_panel} />
					
					{this.state.auto_hide_right_panel && <>
						<label>Hide chat with panel:</label>
                        < Switcher onSwitch={enabled => {
							Settings.setValue('auto_hide_chat', enabled);
							this.setState({auto_hide_chat: enabled})
						}} defaultValue={this.state.auto_hide_chat} />
					</>}
				</div>
			</section>
			<div className={'fader-in'} style={{
				textAlign: 'left',
				padding: '0px 10px',
				color: '#78909C'
			}}>
				<div>* disabling this option will strip graphics from some fancy and resources consuming effects</div>
				<div>** changes will take effect after page reload</div>
				<div>*** some skill effects will be no longer visible</div>
			</div>
			
			<hr/>
			
			<div className={'fader-in'}>
				<button onClick={() => {
					Settings.reset();
					this.refresh();
				}}>RESET TO DEFAULTS</button>
			</div>
		</SidepopBase>;
	}
}