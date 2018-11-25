///<reference path="utils.ts"/>

interface DataJSON {
	x_value: string | number,
	y_value: number
}

interface PointJSON {
	x: number,
	y: number
}

class Chart {
	private static dot_radius = 5;
	private static dot_hollow_radius = 3;
	private static line_thickness = 2;
	private static grid_lines_thickness = 1;
	private static left_panel_width = 100;//equal or biggen than max_label_width

	private static offset_top = 30;//pixels
	private static offset_bottom = 36;//font_size*2 + 2

	private static max_label_width = 100;//pixels

	private static Colors = {
		background: '#fff',
		plot_line: '#607D8B',
		dot: '#607D8B',
		text: '#333',
		grid: '#89a',
		chart_grid: '#abc'
	};

	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	constructor(width: number = 512, height: number = 256) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;

		let ctx = this.canvas.getContext('2d', {antialias: true});
		if(ctx === null)
			throw new Error('Cannot get canvas 2d context.');
		this.ctx = <CanvasRenderingContext2D>ctx;
		this.ctx.fillStyle = Chart.Colors.background;
		
		this.ctx.textAlign = 'center';
		this.ctx.font = "17px Helvetica";
		this.ctx.fillRect(0, 0, width, height);
	}

	feedWithData(data: DataJSON[]) {
		if(data.length === 0)
			return;
		let max_y_value = data.reduce((prev, curr) => {
			return prev.y_value > curr.y_value ? prev : curr;
		}).y_value;

		let chart_width = this.canvas.width - Chart.left_panel_width,
			chart_height = (this.canvas.height - Chart.offset_top - Chart.offset_bottom);

		// console.log(data);

		let points : PointJSON[] = data.map((dt, index) => {
			var x_percent = (index) / (data.length-1);
			var y_percent = dt.y_value / max_y_value;

			return {
				x: x_percent * (chart_width - Chart.max_label_width) + 
					Chart.max_label_width/2 + Chart.left_panel_width, 
				y: (1.0-y_percent) * chart_height + Chart.offset_top
			};
		});

		//stroking curve
		this.ctx.lineWidth = Chart.line_thickness;
		this.ctx.beginPath();
			this.drawLines(this.ctx, this.getCurvePoints(points, 0.5));
		this.ctx.strokeStyle = Chart.Colors.plot_line;
		this.ctx.stroke();

		//drawing points
		points.forEach(point => {
			this.ctx.fillStyle = Chart.Colors.dot;

			this.ctx.beginPath();
				this.ctx.arc(point.x, point.y, Chart.dot_radius, 0, Math.PI*2, false);
			this.ctx.fill();

			if(Chart.dot_hollow_radius > 0) {
				this.ctx.fillStyle = Chart.Colors.background;

				this.ctx.beginPath();
					this.ctx.arc(point.x, point.y, Chart.dot_hollow_radius, 0, Math.PI*2, false);
				this.ctx.fill();
			}
		});

		let labels_density = Math.round(
			(data.length * Chart.max_label_width*0.75) / chart_width
		);

		// console.log(labels_density);

		//data labels
		this.ctx.fillStyle = Chart.Colors.text;

		let even_index = 0;
		data.forEach((dt, index) => {
			if(index % labels_density !== 0)
				return;
			
			this.ctx.fillText(String(dt.x_value), 
				points[index].x, this.canvas.height-2 - (17 * ((even_index++)%2)), 
				Chart.max_label_width);
		});

		this.ctx.lineWidth = Chart.grid_lines_thickness;
		this.ctx.fillStyle = Chart.Colors.grid;
		this.ctx.beginPath();
			this.ctx.lineTo(Chart.left_panel_width, this.canvas.height - Chart.offset_bottom + 0.5);
			this.ctx.lineTo(this.canvas.width, this.canvas.height - Chart.offset_bottom + 0.5);
		this.ctx.stroke();

		//LEFT PANEL
		this.ctx.beginPath();
			this.ctx.lineTo(Chart.left_panel_width + 0.5, 0);
			this.ctx.lineTo(Chart.left_panel_width + 0.5, this.canvas.height);
		this.ctx.stroke();

		this.ctx.fillStyle = Chart.Colors.text;
		//this.ctx.fillText('TODO', Chart.left_panel_width/2, this.canvas.height /2);

		let slices = 4;//slice max value n times

		this.ctx.strokeStyle = Chart.Colors.chart_grid;
		for(var i=0; i<slices; i++) {
			var val_y = Math.round(Chart.offset_top + chart_height / slices * i);
			
			this.ctx.textAlign = 'right';
			this.ctx.fillText(String( Math.round((max_y_value / slices*(slices-i))*100) / 100 ), 
				Chart.left_panel_width-17/2, val_y);

			this.ctx.beginPath();
				this.ctx.lineTo(Chart.left_panel_width, val_y + 0.5);
				this.ctx.lineTo(this.canvas.width, val_y + 0.5);
			this.ctx.stroke();
		}
		// console.log('maxY:', max_y_value);
	}

	getCanvas() {
		return this.canvas;
	}

	//calculations
	private drawLines(ctx: CanvasRenderingContext2D, pts: number[]) {
	  	ctx.moveTo(pts[0], pts[1]);
	  	for(var i=2;i<pts.length-1;i+=2) 
	  		ctx.lineTo(pts[i], pts[i+1]);
	}

	private getCurvePoints(pts_u: PointJSON[], tension = 0.5, isClosed= false, numOfSegments= 16) {
		// use input value if provided, or use a default value	 
		//tension = (typeof tension != 'undefined') ? tension : 0.5;
		//isClosed = isClosed ? isClosed : false;
		//numOfSegments = numOfSegments ? numOfSegments : 16;

		var pts: number[] = [];
		for(var p of pts_u)
			pts.push(p.x, p.y);

		var _pts: number[] = [], res: number[] = [],	// clone array
			x: number, y: number,			// our x,y coords
			t1x, t2x, t1y, t2y,	// tension vectors
			c1, c2, c3, c4,		// cardinal points
			st, t, i;		// steps based on num. of segments

		// clone array so we don't change the original
		//
		_pts = pts.slice(0);

		// The algorithm require a previous and next point to the actual point array.
		// Check if we will draw closed or open curve.
		// If closed, copy end points to beginning and first points to end
		// If open, duplicate first points to befinning, end points to end
		if (isClosed) {
			_pts.unshift(pts[pts.length - 1]);
			_pts.unshift(pts[pts.length - 2]);
			_pts.unshift(pts[pts.length - 1]);
			_pts.unshift(pts[pts.length - 2]);
			_pts.push(pts[0]);
			_pts.push(pts[1]);
		}
		else {
			_pts.unshift(pts[1]);	//copy 1. point and insert at beginning
			_pts.unshift(pts[0]);
			_pts.push(pts[pts.length - 2]);	//copy last point and append
			_pts.push(pts[pts.length - 1]);
		}

		// ok, lets start..

		// 1. loop goes through point array
		// 2. loop goes through each segment between the 2 pts + 1e point before and after
		for (i=2; i < (_pts.length - 4); i+=2) {
			for (t=0; t <= numOfSegments; t++) {

				// calc tension vectors
				t1x = (_pts[i+2] - _pts[i-2]) * tension;
				t2x = (_pts[i+4] - _pts[i]) * tension;

				t1y = (_pts[i+3] - _pts[i-1]) * tension;
				t2y = (_pts[i+5] - _pts[i+1]) * tension;

				// calc step
				st = t / numOfSegments;

				// calc cardinals
				c1 =   2 * Math.pow(st, 3) 	- 3 * Math.pow(st, 2) + 1; 
				c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2); 
				c3 = 	   Math.pow(st, 3)	- 2 * Math.pow(st, 2) + st; 
				c4 = 	   Math.pow(st, 3)	- 	  Math.pow(st, 2);

				// calc x and y cords with common control vectors
				x = c1 * _pts[i]	+ c2 * _pts[i+2] + c3 * t1x + c4 * t2x;
				y = c1 * _pts[i+1]	+ c2 * _pts[i+3] + c3 * t1y + c4 * t2y;

				//store points in array
				res.push(x);
				res.push(y);

			}
		}

		return res;
	}
}