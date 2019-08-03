import * as React from 'react';

import Assets from '../game/engine/assets';
import Device from '../game/engine/device';
import Emoticon, {EMOTS} from '../../common/game/objects/emoticon';

import '../styles/skills_bar.scss';

function getTextureSource(texture_name: string) {
	let texture: HTMLCanvasElement | HTMLImageElement | undefined = undefined;
	if( Assets.loaded() )
		texture = Assets.getTexture( texture_name );

	let source = undefined;
	if(texture) {
		if(texture instanceof HTMLCanvasElement)
			source = texture.toDataURL();
		else if(texture instanceof HTMLImageElement)
			source = texture.src;
	}
	return source;
}

interface SkillSchema {
	empty: boolean;
	key: number | 'space';
	texture: string | undefined;
	continuous: boolean;
	active: boolean;//for continuous
	cooldown: number;//for not continuous
}

interface EmotBtnSchema {
	key: string;
	source?: string;
}

interface SkillsBarProps {
	onEmoticonUse: (index: number) => void;
	onSkillUse: (index: number) => void;
	onSkillStop: (index: number) => void;
}

interface SkillsBarState {
	skills: SkillSchema[];
	available_emots: EmotBtnSchema[];
	show_emoticons_bar: boolean;
}

export default class SkillsBar extends React.Component<SkillsBarProps, SkillsBarState> {
	private emots_toggler: HTMLButtonElement | null = null;
	private skill_cooldowns: Map<number, NodeJS.Timeout> = new Map();
	private mounted = true;

	state: SkillsBarState = {
		skills: [],
		available_emots: [],
		show_emoticons_bar: false,
	};

	constructor(props: SkillsBarProps) {
		super(props);
	}
	
	componentWillUnmount() {
		this.mounted = false;
		this.skill_cooldowns.forEach(timeout => clearTimeout(timeout));
	}
	
	componentDidMount() {
		//initialize emoticons preview
		Assets.onload(() => {
			if( !this.mounted )
				return;
			this.setState({
				available_emots: EMOTS.map(emot => {
					let entity_name = Emoticon.entityName(emot.file_name);
					return {
						key: emot.key,
						source: getTextureSource(entity_name)
					};
				})
			});
		});
		
	}

	public addEmptySkill(slot_index: number) {
		this.state.skills.push({
			empty: true,
			key: slot_index,
			texture: undefined,
			continuous: false,
			active: false,
			cooldown: 0
		});

		this.setState({skills: this.state.skills});
	}

	public addSkill(texture_name: string, key: 'space' | number, continuous: boolean) {
		this.state.skills.push({
			empty: false,
			key, 
			texture: getTextureSource(texture_name),
			continuous,
			active: false,
			cooldown: 0
		});

		this.setState({skills: this.state.skills});
	}

	public useSkill(index: number, cooldown: number) {
		let skill = this.state.skills[index];
		if( skill.continuous )
			skill.active = true;
		else {//start cooldown chain 
			//console.log('cooldown:', cooldown, index);
			skill.cooldown = Math.max(0, cooldown);
			if(cooldown <= 0)
				this.skill_cooldowns.delete(index);
			else {
				if( this.skill_cooldowns.has(index) )//should not be true
					clearTimeout( this.skill_cooldowns.get(index) as never );
				this.skill_cooldowns.set( index, setTimeout(() => {
					this.useSkill(index, cooldown-1);
				}, 1000) as never );
			}
		}

		this.setState({skills: this.state.skills})
	}

	public stopSkill(index: number) {
		let skill = this.state.skills[index];
		if( skill.continuous )
			skill.active = false;
		else
			console.warn('Non continuous skills cannot be stopped');

		this.setState({skills: this.state.skills})
	}

	private renderSkillSlots() {
		return this.state.skills.map((skill, index) => {
			let skill_index = skill.key === 'space' ? 0 : skill.key;
			let canbeused = !skill.active && skill.cooldown <= 0;
			return <button key={index} 
				className={`${skill.active ? 'active' : ''} ${canbeused ? 'canbeused' : ''}`}
				onMouseDown={() => this.props.onSkillUse(skill_index)}
				onMouseUp={() => this.props.onSkillStop(skill_index)}
				onTouchStart={() => this.props.onSkillUse(skill_index)}
				onTouchEnd={() => this.props.onSkillStop(skill_index)}>
				<div className='displayer'>
					{skill.texture && <img src={skill.texture} alt={`skill ${skill.key}`} />}
					{skill.cooldown > 0 && <div className='cooldown'>{skill.cooldown|0}</div>}
				</div>
				<div className='key' style={{
					display: Device.isMobile() ? 'none' : 'inline-block'
				}}>{skill.key}</div>
			</button>;
		});
	}

	render() {
		return <div className={`skills-bar${this.state.show_emoticons_bar ? ' show-emots-bar' : ''}`}>
			<div className='skill-slots'>{this.renderSkillSlots()}</div>
			<button className='emoticons-toggler' ref={el => this.emots_toggler = el} onClick={() => {
				this.setState({show_emoticons_bar: !this.state.show_emoticons_bar});
				if (this.emots_toggler)
					this.emots_toggler.blur();
			}}/>
			<div className='emoticons-bar'>{this.state.available_emots.map((emot, index) => {
				return <button key={index} onClick={() => this.props.onEmoticonUse(index)}>
					<img src={emot.source} alt='emoticon preview' />
					<span style={{
						display: Device.isMobile() ? 'none' : 'inline-block'
					}}>{emot.key}</span>
				</button>;
			})}</div>
		</div>;
	}
}