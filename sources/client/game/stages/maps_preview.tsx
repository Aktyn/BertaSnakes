import * as React from 'react';

import Maps, {map_name, isReady, onMapsLoaded} from '../../../common/game/maps';

export function updateMapPreview(map_name: map_name, canv: HTMLCanvasElement) {
	let map = Maps[map_name];
	if(map === null)
		throw new Error('Cannot find map by it\'s name: ' + map_name);

	let ctx = canv.getContext('2d', {antialias: true}) as CanvasRenderingContext2D;

	ctx.drawImage(map['background_texture'], 0, 0, canv.width, canv.height);
	
	let w_canv = document.createElement('canvas');
	w_canv.width = 150;
	w_canv.height = 150;
	let w_ctx = w_canv.getContext('2d', {antialias: true}) as CanvasRenderingContext2D;
	w_ctx.fillStyle = '#000';
	w_ctx.fillRect(0, 0, w_canv.width, w_canv.height);
	w_ctx.drawImage(map['walls_texture'], 0, 0, w_canv.width, w_canv.height);

	//@ts-ignore
	try {
		let b_data = ctx.getImageData(0, 0, canv.width, canv.height);
		let w_data = w_ctx.getImageData(0, 0, w_canv.width, w_canv.height);

		let wallsColor = map['walls_color']; //Colors.WALLS.byte_buffer;

		for(let x=0; x<canv.width; x++) {
			for(let y=0; y<canv.height; y++) {
				let index = (x + y*canv.width) * 4;

				if(w_data.data[index] > 0) {
					b_data.data[index+0] = wallsColor.byte_buffer[0];
					b_data.data[index+1] = wallsColor.byte_buffer[1];
					b_data.data[index+2] = wallsColor.byte_buffer[2];
				}
			}
		}

		ctx.putImageData(b_data, 0, 0);
	}
	catch(e) {
		console.error(e);
	}
}

interface MapsPreviewProps {
	defaultValue?: map_name;
}

interface MapsPreviewState {
	value: map_name;
}

export default class extends React.Component<MapsPreviewProps, MapsPreviewState> {

	state: MapsPreviewState = {
		value: Object.keys(Maps)[0] as map_name
	};

	constructor(props: MapsPreviewProps) {
		super(props);
	}

	get value() {
		return this.state.value;
	}

	private init() {
		if(this.props.defaultValue && Maps[this.props.defaultValue] !== undefined)
			this.setState({value: this.props.defaultValue});
		else
			this.setState({value: (Object.keys(Maps)[0] as map_name) || ''});
	}

	componentWillMount() {
		onMapsLoaded(this.init.bind(this));
	}

	render() {
		return <div className='map_previews_list'>{isReady() && Object.keys(Maps).map((map_name) => {
			return <div key={map_name} 
				className={`${map_name === this.state.value ? 'selected ' : ''}map_preview`}
				onClick={() => this.setState({value: map_name as map_name})}>
				<label>{map_name}</label>
				<canvas width={150} height={150}
					ref={el => el && updateMapPreview(map_name as map_name, el)}/>
			</div>;
		})}</div>;
	}
}