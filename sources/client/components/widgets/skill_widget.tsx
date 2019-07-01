import * as React from 'react';

import '../../styles/widgets/skill_widget.scss';
import Skills from "../../../common/game/common/skills";
import {TEXTURES_PATH} from "../../game/engine/assets";

function getDescription(skill_id: number | null) {
	if(skill_id === null)
		return undefined;
	let skill = Skills.getById(skill_id);
	if(skill)
		return skill.description;
	return undefined;
}

export const enum DIRECTION {
	LEFT,
	RIGHT
}

interface SkillWidgetProps {
	onClick?: (widget: SkillWidget) => void;
	onMove?: (dir: DIRECTION) => void;
	onPutOff?: () => void;
	skill: number | null;
	show_description: boolean;
	unobtainable: boolean;
	bought: boolean;
}

interface SkillWidgetState {
	image_src?: string;
	show_controls: boolean;
}

export default class SkillWidget extends React.Component<SkillWidgetProps, SkillWidgetState> {
	private description: HTMLDivElement | null = null;
	
	static defaultProps: Partial<SkillWidgetProps> = {
		show_description: true,
		unobtainable: false,
		bought: false
	};
	
	state: SkillWidgetState = {
		show_controls: false
	};
	
	constructor(props: SkillWidgetProps) {
		super(props);
	}
	
	componentDidMount() {
		if(this.props.skill === null)
			return;
		let skill = Skills.getById(this.props.skill);
		if(skill)
			this.setState({image_src: TEXTURES_PATH('./skills_icons/' + skill.texture_name) });
	}
	
	public showControls() {
		this.setState({show_controls: true});
	}
	
	private renderControls() {
		return <div className={'skill-widget controls'}
		               onMouseLeave={() => this.setState({show_controls: false})}>
			<div>
				<button className={'move-btn'} onClick={() => {
					if( this.props.onMove )
						this.props.onMove(DIRECTION.LEFT);
				}} />
				<button className={'move-btn'} onClick={() => {
					if( this.props.onMove )
						this.props.onMove(DIRECTION.RIGHT);
				}} />
			</div>
			<button className={'put-off-btn'} onClick={() => {
				if( this.props.onPutOff )
					this.props.onPutOff();
			}}>OFF</button>
		</div>;
	}
	
	render() {
		if(this.state.show_controls)
			return this.renderControls();
		
		let is_empty = this.props.skill === null;
		if(is_empty)
			return <button className={'skill-widget'}><span>EMPTY</span></button>;
		
		let description = getDescription(this.props.skill);
		return <button className={`skill-widget${
			this.props.onClick ? ' clickable' : ''}${
			this.props.unobtainable ? ' unobtainable' : ''}${
			this.props.bought ? ' bought' : ''}`} onClick={() => {
			if(this.props.onClick)
				this.props.onClick(this);
		}} onMouseMove={(event) => {
			if(!this.description)
				return;
			let w = this.description.getBoundingClientRect().width;
			let sidepop_w = Math.min(400, window.innerWidth);
			let offX = Math.min(sidepop_w-w, Math.max(0, ((window.innerWidth - event.clientX - w/2)|0)));
			this.description.style.right = offX + 'px';
		}}>
			{is_empty ? <span>EMPTY</span> :
				(this.state.image_src && <img src={this.state.image_src} alt={'skill icon'}/>)
			}
			{this.props.show_description && description &&
				<div ref={el => this.description = el}
				     className={'description'}>{description.split('\n').map((line, i) => <div key={i}>{line}</div>)}
			</div>}
		</button>;
	}
}