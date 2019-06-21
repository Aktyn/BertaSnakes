import * as React from 'react';

import Assets from '../game/engine/assets';

import '../styles/skills_bar.scss';

interface SkillSchema {
	empty: boolean;
	key: number | 'space';
	continous: boolean;
	texture: string | undefined;
}

interface SkillsBarState {
	skills: SkillSchema[];
}

export default class SkillsBar extends React.Component<any, SkillsBarState> {

	state: SkillsBarState = {
		skills: []
	};

	constructor(props: any) {
		super(props);
	}

	public addEmptySkill(slot_index: number) {
		this.state.skills.push({
			empty: true,
			key: slot_index, 
			continous: false,
			texture: undefined
		});

		this.setState({skills: this.state.skills});
	}

	public addSkill(texture_name: string, key: 'space' | number, continous: boolean) {
		let texture: HTMLCanvasElement | HTMLImageElement | undefined = undefined;
		if( Assets.loaded() ) {
			texture = Assets.getTexture( texture_name );
		}

		let source = undefined;
		if(texture) {
			if(texture instanceof HTMLCanvasElement)
				source = texture.toDataURL();
			else if(texture instanceof HTMLImageElement)
				source = texture.src;
		}
		this.state.skills.push({
			empty: false,
			key, 
			continous,
			texture: source
		});

		this.setState({skills: this.state.skills});
	}

	private renderSkillSlots() {
		return this.state.skills.map((skill, index) => {
			return <div key={index}>
				<div className='displayer'>
					{skill.texture && <img src={skill.texture} alt={`skill ${skill.key}`} />}
				</div>
				<div className='key'>{skill.key}</div>
			</div>;
		});
	}

	render() {
		return <div className='skills-bar'>
			<div className='skill-slots'>{this.renderSkillSlots()}</div>
		</div>;
	}
}