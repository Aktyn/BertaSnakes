import * as React from 'react';
import {PLAYER_TYPES} from "../../../common/game/objects/player";
import Utils from '../../utils/utils';

import '../../styles/ship_widget.scss';
import Colors, {ColorI} from "../../../common/game/common/colors";

interface PreviewDatas {
	red: string;
	green: string;
	blue: string;
	orange: string;
}
let colored_previews: Map<PLAYER_TYPES, PreviewDatas> = new Map();

const PREVIEW_RESOLUTION = 128;
function generatePreview(type: PLAYER_TYPES): Promise<PreviewDatas> {
	function getColorizedTexture(canvas: HTMLCanvasElement, img: HTMLImageElement, color: ColorI) {
		let ctx = canvas.getContext('2d', {antialias: true}) as CanvasRenderingContext2D;
		ctx.drawImage(img, 0, 0, PREVIEW_RESOLUTION, PREVIEW_RESOLUTION);
		
		let img_data = ctx.getImageData(0, 0, PREVIEW_RESOLUTION, PREVIEW_RESOLUTION);
		
		//colorize non-white pixels
		for(let i=0, n=img_data.data.length, j=0; i<n; i+=4) {
			for(j=0; j<3; j++)
				img_data.data[i+j] = Math.min(255, img_data.data[i+j] + color.byte_buffer[j]);
		}
		
		ctx.putImageData(img_data, 0, 0);
		
		return canvas.toDataURL();
	}
	
	return new Promise((resolve, reject) => {
		let img = new Image();
		
		img.onload = () => {
			let canvas = document.createElement('canvas');
			canvas.width = canvas.height = PREVIEW_RESOLUTION;
			
			resolve({
				red: getColorizedTexture(canvas, img, Colors.PLAYERS_COLORS[0]),
				green: getColorizedTexture(canvas, img, Colors.PLAYERS_COLORS[1]),
				blue: getColorizedTexture(canvas, img, Colors.PLAYERS_COLORS[2]),
				orange: getColorizedTexture(canvas, img, Colors.PLAYERS_COLORS[4])
			});
			
			canvas.remove();
		};
		
		img.onerror = reject;
		
		img.src = Utils.SHIP_TEXTURES[ type ];
	});
}

interface ShipWidgetProps {
	onClick?: () => void;
	type: PLAYER_TYPES;
	selected: boolean;
	bought: boolean;
	unobtainable: boolean;
}

interface ShipWidgetState {
	img_data_url?: string;//TODO - change name to url... something
}

export default class ShipWidget extends React.Component<ShipWidgetProps, ShipWidgetState> {
	static defaultProps: Partial<ShipWidgetProps> = {
		selected: false,
		bought: false,
		unobtainable: false
	};
	
	state: ShipWidgetState = {};
	
	constructor(props: ShipWidgetProps) {
		super(props);
	}
	
	componentDidMount() {
		let data = colored_previews.get(this.props.type);
		if( data )
			this.setImgData(data);
		else
			this.generatePreview().catch(console.error);
	}
	
	private async generatePreview() {
		let preview = await generatePreview(this.props.type);
		colored_previews.set(this.props.type, preview);
		
		this.setImgData(preview)
	}
	
	private setImgData(data: PreviewDatas) {
		if(this.props.selected)
			this.setState({img_data_url: data.green});
		else if(this.props.bought)
			this.setState({img_data_url: data.orange});
		else if(this.props.unobtainable)
			this.setState({img_data_url: data.red});
		else
			this.setState({img_data_url: data.blue});
	}
	
	render() {
		return <button onClick={() => {
			if(this.props.onClick)
				this.props.onClick();
		}} className={`ship-widget${this.props.selected ? ' selected' : ''}${
			this.props.onClick ? '' : ' disabled'}${this.props.unobtainable ? ' unobtainable' : ''}`}>
			{this.state.img_data_url && <img src={this.state.img_data_url} alt={'ship preview'} />}
		</button>;
	}
}