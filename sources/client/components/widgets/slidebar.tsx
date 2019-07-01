import * as React from 'react';

import '../../styles/widgets/slidebar.scss';

interface SlideBarProps {
	widgetWidth: number;
	minValue: number;
	maxValue: number;
	precision: number;
	defaultValue: number;
	onUpdate?: (value: number) => void;
	valueSuffix?: string;
}

interface SlideBarState {
	value: number;
	pixelOffset: number;
}

export default class SlideBar extends React.Component<SlideBarProps, SlideBarState> {
	private dragX = 0;
	private dragging = false;
	private readonly onMoveEvent: (e: MouseEvent) => void;
	private readonly onTouchMoveEvent: (e: TouchEvent) => void;
	private readonly onDragStopEvent: () => void;
	private slider: HTMLDivElement | null = null;
	
	static defaultProps: Partial<SlideBarProps> = {
		widgetWidth: 130,
		minValue: 0,
		maxValue: 1,
		defaultValue: 0,
		precision: 2
	};
	
	state: SlideBarState = {
		value: 0,
		pixelOffset: 0
	};
	
	constructor(props: SlideBarProps) {
		super(props);
		
		this.onTouchMoveEvent = this.onTouchMove.bind(this);
		this.onMoveEvent = this.onMove.bind(this);
		this.onDragStopEvent = this.onDragStop.bind(this);
	}
	
	public getValue() {
		return this.state.value;
	}
	
	private get range() {
		return this.props.maxValue - this.props.minValue;
	}
	
	componentDidMount() {
		if(this.props.maxValue < this.props.minValue)
			throw new Error('maxValue must be larger than minValue');
		
		window.addEventListener('mousemove', this.onMoveEvent, false);
		window.addEventListener('mouseup', this.onDragStopEvent, false);
		window.addEventListener('touchmove', this.onTouchMoveEvent, false);
		window.addEventListener('touchend', this.onDragStopEvent, false);
		
		this.setValue(this.props.defaultValue);
	}
	
	componentWillUnmount() {
		window.removeEventListener('mousemove', this.onMoveEvent, false);
		window.removeEventListener('mouseup', this.onDragStopEvent, false);
		window.removeEventListener('touchmove', this.onTouchMoveEvent, false);
		window.removeEventListener('touchend', this.onDragStopEvent, false);
	}
	
	private setValue(value: number, send_update = false) {
		value = Math.max(this.props.minValue, Math.min(this.props.maxValue, value));
		if(value === this.state.value)
			return;
		this.setState({value});
		
		if(send_update && this.props.onUpdate)
			this.props.onUpdate( value );
	}
	
	private onDragStart(clientX: number) {
		this.dragX = clientX;
		this.dragging = true;
	}
	
	private onDragStop() {
		this.dragging = false;
		this.setValue( this.state.value, true );
	}
	
	private moveHandler(clientX: number) {
		if( !this.dragging )
			return;
		let dx = clientX - this.dragX;
		let dv = dx/this.props.widgetWidth * this.range;
		this.dragX = clientX;
		
		this.setValue( this.state.value + dv );
	}
	
	private onMove(e: MouseEvent) {
		this.moveHandler( e.clientX );
	}
	
	private onTouchMove(e: TouchEvent) {
		let touch0 = e.touches.item(0);
		if( touch0 )
			this.moveHandler( touch0.clientX );
	}
	
	private get pixelOffset() {
		return (this.state.value - this.props.minValue) / this.range * this.props.widgetWidth;
	}
	
	private applyPrecision(value: number) {
		let multiplier = Math.pow(10, this.props.precision);

		return Math.round(value * multiplier) / multiplier;
	}
	
	render() {
		return <div className={'slidebar'}>
			<div className={'slider'} style={{width: `${this.props.widgetWidth}px`}} onClick={(event) => {
				if(!this.slider || event.target !== this.slider)
					return;
				let offX = event.clientX - this.slider.getBoundingClientRect().left;
				this.setValue(offX/this.props.widgetWidth * this.range, true);
			}} ref={el => this.slider = el}>
				<button className={'holder'} onTouchStart={e =>this.onDragStart(e.touches.item(0).clientX)}
				        onMouseDown={e => this.onDragStart(e.clientX)}
				        style={{
							transform: `translateX(${this.pixelOffset|0}px)`
						}}/>
			</div>
			<span className={'value'}>{this.applyPrecision(this.state.value)}&nbsp;{this.props.valueSuffix}</span>
		</div>;
	}
}