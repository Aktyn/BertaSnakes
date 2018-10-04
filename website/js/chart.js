"use strict";
///<reference path="utils.ts"/>
var Chart = /** @class */ (function () {
    function Chart(width, height) {
        if (width === void 0) { width = 512; }
        if (height === void 0) { height = 256; }
        this.canvas = $$.create('CANVAS').setStyle({
        // 'border': '1px solid #abc'
        });
        this.canvas.width = width;
        this.canvas.height = height;
        var ctx = this.canvas.getContext('2d', { antialias: true });
        if (ctx === null)
            throw new Error('Cannot get canvas 2d context.');
        this.ctx = ctx;
        this.ctx.fillStyle = Chart.Colors.background;
        this.ctx.textAlign = 'center';
        this.ctx.font = "17px Helvetica";
        this.ctx.fillRect(0, 0, width, height);
    }
    Chart.prototype.feedWithData = function (data) {
        var _this = this;
        if (data.length === 0)
            return;
        var max_y_value = data.reduce(function (prev, curr) {
            return prev.y_value > curr.y_value ? prev : curr;
        }).y_value;
        var chart_width = this.canvas.width - Chart.left_panel_width, chart_height = (this.canvas.height - Chart.offset_top - Chart.offset_bottom);
        // console.log(data);
        var points = data.map(function (dt, index) {
            var x_percent = (index) / (data.length - 1);
            var y_percent = dt.y_value / max_y_value;
            return {
                x: x_percent * (chart_width - Chart.max_label_width) +
                    Chart.max_label_width / 2 + Chart.left_panel_width,
                y: (1.0 - y_percent) * chart_height + Chart.offset_top
            };
        });
        //stroking curve
        this.ctx.lineWidth = Chart.line_thickness;
        this.ctx.beginPath();
        this.drawLines(this.ctx, this.getCurvePoints(points, 0.5));
        this.ctx.strokeStyle = Chart.Colors.plot_line;
        this.ctx.stroke();
        //drawing points
        points.forEach(function (point) {
            _this.ctx.fillStyle = Chart.Colors.dot;
            _this.ctx.beginPath();
            _this.ctx.arc(point.x, point.y, Chart.dot_radius, 0, Math.PI * 2, false);
            _this.ctx.fill();
            if (Chart.dot_hollow_radius > 0) {
                _this.ctx.fillStyle = Chart.Colors.background;
                _this.ctx.beginPath();
                _this.ctx.arc(point.x, point.y, Chart.dot_hollow_radius, 0, Math.PI * 2, false);
                _this.ctx.fill();
            }
        });
        var labels_density = Math.round((data.length * Chart.max_label_width * 0.75) / chart_width);
        // console.log(labels_density);
        //data labels
        this.ctx.fillStyle = Chart.Colors.text;
        var even_index = 0;
        data.forEach(function (dt, index) {
            if (index % labels_density !== 0)
                return;
            _this.ctx.fillText(String(dt.x_value), points[index].x, _this.canvas.height - 2 - (17 * ((even_index++) % 2)), Chart.max_label_width);
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
        var slices = 4; //slice max value n times
        this.ctx.strokeStyle = Chart.Colors.chart_grid;
        for (var i = 0; i < slices; i++) {
            var val_y = Math.round(Chart.offset_top + chart_height / slices * i);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(String(Math.round((max_y_value / slices * (slices - i)) * 100) / 100), Chart.left_panel_width - 17 / 2, val_y);
            this.ctx.beginPath();
            this.ctx.lineTo(Chart.left_panel_width, val_y + 0.5);
            this.ctx.lineTo(this.canvas.width, val_y + 0.5);
            this.ctx.stroke();
        }
        // console.log('maxY:', max_y_value);
    };
    Chart.prototype.getCanvas = function () {
        return this.canvas;
    };
    //calculations
    Chart.prototype.drawLines = function (ctx, pts) {
        ctx.moveTo(pts[0], pts[1]);
        for (var i = 2; i < pts.length - 1; i += 2)
            ctx.lineTo(pts[i], pts[i + 1]);
    };
    Chart.prototype.getCurvePoints = function (pts_u, tension, isClosed, numOfSegments) {
        // use input value if provided, or use a default value	 
        //tension = (typeof tension != 'undefined') ? tension : 0.5;
        //isClosed = isClosed ? isClosed : false;
        //numOfSegments = numOfSegments ? numOfSegments : 16;
        if (tension === void 0) { tension = 0.5; }
        if (isClosed === void 0) { isClosed = false; }
        if (numOfSegments === void 0) { numOfSegments = 16; }
        var pts = [];
        for (var _i = 0, pts_u_1 = pts_u; _i < pts_u_1.length; _i++) {
            var p = pts_u_1[_i];
            pts.push(p.x, p.y);
        }
        var _pts = [], res = [], // clone array
        x, y, // our x,y coords
        t1x, t2x, t1y, t2y, // tension vectors
        c1, c2, c3, c4, // cardinal points
        st, t, i; // steps based on num. of segments
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
            _pts.unshift(pts[1]); //copy 1. point and insert at beginning
            _pts.unshift(pts[0]);
            _pts.push(pts[pts.length - 2]); //copy last point and append
            _pts.push(pts[pts.length - 1]);
        }
        // ok, lets start..
        // 1. loop goes through point array
        // 2. loop goes through each segment between the 2 pts + 1e point before and after
        for (i = 2; i < (_pts.length - 4); i += 2) {
            for (t = 0; t <= numOfSegments; t++) {
                // calc tension vectors
                t1x = (_pts[i + 2] - _pts[i - 2]) * tension;
                t2x = (_pts[i + 4] - _pts[i]) * tension;
                t1y = (_pts[i + 3] - _pts[i - 1]) * tension;
                t2y = (_pts[i + 5] - _pts[i + 1]) * tension;
                // calc step
                st = t / numOfSegments;
                // calc cardinals
                c1 = 2 * Math.pow(st, 3) - 3 * Math.pow(st, 2) + 1;
                c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2);
                c3 = Math.pow(st, 3) - 2 * Math.pow(st, 2) + st;
                c4 = Math.pow(st, 3) - Math.pow(st, 2);
                // calc x and y cords with common control vectors
                x = c1 * _pts[i] + c2 * _pts[i + 2] + c3 * t1x + c4 * t2x;
                y = c1 * _pts[i + 1] + c2 * _pts[i + 3] + c3 * t1y + c4 * t2y;
                //store points in array
                res.push(x);
                res.push(y);
            }
        }
        return res;
    };
    Chart.dot_radius = 5;
    Chart.dot_hollow_radius = 3;
    Chart.line_thickness = 2;
    Chart.grid_lines_thickness = 1;
    Chart.left_panel_width = 100; //equal or biggen than max_label_width
    Chart.offset_top = 30; //pixels
    Chart.offset_bottom = 36; //font_size*2 + 2
    Chart.max_label_width = 100; //pixels
    Chart.Colors = {
        background: '#fff',
        plot_line: '#607D8B',
        dot: '#607D8B',
        text: '#333',
        grid: '#89a',
        chart_grid: '#abc'
    };
    return Chart;
}());
