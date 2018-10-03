"use strict";
//@ts-ignore
const $ = (function () {
    if (typeof Array.isArray === 'undefined') {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }
    function assert(condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (typeof Error !== "undefined")
                throw new Error(message);
            throw message; //fallback in case of poor browser support
        }
    }
    //removes every char except letters and digit from strng
    function justLettersAndDigits(str) {
        return str.replace(/[^(a-zA-Z0-9)]*/gi, '');
    }
    const static_methods = {
        assert: assert,
        expand: function (parent, child, override = false) {
            if (!override)
                return Object.assign(parent, child);
            //override
            Object.getOwnPropertyNames(child).forEach(function (prop) {
                parent[prop] = child[prop];
            });
            return parent;
        },
        load: function (callback) {
            if (!document.body)
                document.onload = window.onload = callback;
            else if (typeof callback === 'function')
                callback();
        },
        loadFile: function (source, callback) {
            try {
                let xmlhttp = new XMLHttpRequest();
                xmlhttp.open("GET", source, true);
                xmlhttp.onreadystatechange = function () {
                    if (typeof callback !== 'function')
                        return;
                    if (xmlhttp.readyState == 4) //complete
                        callback(xmlhttp.status == 200 ? xmlhttp.responseText : undefined);
                };
                xmlhttp.send();
            }
            catch (e) {
                console.error('Cannot load file:', e);
                if (typeof callback === 'function')
                    callback();
            }
        },
        postRequest: function (php_file, params, callback) {
            try {
                if (typeof params !== 'string') //format params object to string
                    params = Object.keys(params).map(pname => pname + '=' + params[pname]).join('&');
                //params = Object.entries(params).map((entry) => entry.join("=")).join("&");
                let xmlhttp = new XMLHttpRequest();
                xmlhttp.open('POST', php_file, true);
                xmlhttp.onreadystatechange = function () {
                    if (typeof callback !== 'function')
                        return;
                    if (xmlhttp.readyState == 4) //complete
                        callback(xmlhttp.status == 200 ? xmlhttp.responseText : undefined); //success
                };
                xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                xmlhttp.send(params);
            }
            catch (e) {
                console.error('Post request error:', e);
                if (typeof callback === 'function')
                    callback(undefined);
            }
        },
        loadScript: function (source, async, onload) {
            assert(!!document.head, 'Document head not found');
            let script = static_methods.create('SCRIPT');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', source);
            script.setAttribute('async', String(!!async));
            //script.async = !!async;
            //searching for arleady loaded script
            if (fromQuery('SCRIPT').some((s) => s.src.indexOf(source) != -1)) {
                if (typeof onload === 'function')
                    onload();
                return;
            }
            if (typeof onload === 'function')
                script.onload = onload;
            //@ts-ignore
            document.head.appendChild(script);
        },
        try: function (func, catch_label) {
            try {
                func.apply(func, Array.from(arguments).slice(2, arguments.length));
            }
            catch (e) {
                console.error(catch_label || "error: ", e);
            }
        },
        runAsync: function (func, delay = 1) {
            setTimeout(func, delay);
        },
        create: function (value) {
            var new_element = document.createElement(justLettersAndDigits(value));
            return static_methods.expand(new_element, extender);
        },
        getScreenSize: function () {
            return {
                //@ts-ignore
                width: window.innerWidth || document.documentElement.clientWidth ||
                    document.body.clientWidth,
                //@ts-ignore
                height: window.innerHeight || document.documentElement.clientHeight ||
                    document.body.clientHeight
            };
        },
        base64encode: function (str) {
            return window.btoa(str);
        },
        base64decode: function (str) {
            return window.atob(str);
        }
    };
    const extender = {
        html: function (content) {
            /*if(typeof content === 'string') {
                this.innerHTML = content;
                return <$_face>this;
            }
            return <string>this.innerHTML;*/
            this.innerHTML = String(content);
            return this;
        },
        setText: function (content) {
            //if(content === undefined)
            //	return this.innerText;
            //else {
            this.innerText = String(content);
            return this;
            //}
        },
        addText: function (content) {
            this.appendChild(document.createTextNode(content));
            return this;
        },
        addClass: function (class_name) {
            this.classList.add(class_name);
            return this;
        },
        removeClass: function (class_name) {
            this.classList.remove(class_name);
            return this;
        },
        setClass: function (class_name) {
            this.className = class_name; //overrides existing classes
            return this;
        },
        getChildren: function (query) {
            return fromQuery(query, this);
        },
        add: function (element) {
            if (Array.isArray(element)) {
                for (var i = 0; i < element.length; i++)
                    this.append(element[i]);
                return this;
            }
            this.appendChild(element);
            return this;
        },
        appendAtBeginning: function (element) {
            if (Array.isArray(element)) {
                for (var i = 0; i < element.length; i++)
                    this.appendAtBeginning(element[i]);
                return this;
            }
            this.insertBefore(element, this.firstChild);
            return this;
        },
        delete: function () {
            this.remove();
        },
        setStyle: function (css) {
            static_methods.expand(this.style, css, true);
            return this;
        },
        attribute: function (name, value) {
            if (typeof value === 'string' || typeof value === 'number') {
                this.setAttribute(name, String(value));
                return this;
            }
            else
                return this.getAttribute(name);
        },
        // isHover: function() {
        // return (this.parentHTMLElement.querySelector(':hover') === this);
        // },
        getPos: function () {
            var rect = this.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        },
        width: function () {
            var rect = this.getBoundingClientRect();
            return rect.right - rect.left;
        },
        height: function () {
            var rect = this.getBoundingClientRect();
            return rect.bottom - rect.top;
        },
        //NEW - less troublesome events support
        on: function (event, func) {
            if (this.addEventListener) // most non-IE browsers and IE9
                this.addEventListener(event, func, false);
            else
                throw new Error('no addEventListener support');
            //else if(this.attachEvent)//Internet Explorer 5 or above
            //   this.attachEvent('on' + event, func);
            return this;
        },
        off: function (event, func) {
            if (this.removeEventListener) // most non-IE browsers and IE9
                this.removeEventListener(event, func, false);
            else
                throw new Error('no removeEventListener support');
            //else if(this.detachEvent)//Internet Explorer 5 or above
            //   this.detachEvent('on' + event, func);
            return this;
        }
    };
    function fromQuery(query, parent) {
        var value = Array.from((parent || document).querySelectorAll(query))
            .map(HTMLElement => static_methods.expand(HTMLElement, extender, true));
        if (value.length === 1) //returning single found HTMLElement
            return value[0];
        return smartArrayExtend(value);
    }
    //smart extending array object of extender methods
    function smartArrayExtend(arr) {
        Object.getOwnPropertyNames(extender).forEach(function (method) {
            if (typeof extender[method] !== 'function' || arr.hasOwnProperty(method))
                return;
            var array_extender = {}; //temporary object
            array_extender[method] = function () {
                var args = Array.from(arguments);
                var result = [];
                arr.forEach(function (extended_HTMLElement) {
                    result.push(extended_HTMLElement[method].apply(extended_HTMLElement, args));
                });
                return smartArrayExtend(Array.prototype.concat.apply([], result)); //unrap and extend
            };
            static_methods.expand(arr, array_extender);
        });
        return arr;
    }
    function __self(value) {
        if (value instanceof HTMLElement) { //DOM HTMLElement
            static_methods.expand(value, extender, true);
            return value;
        }
        else if (typeof value === 'string')
            return fromQuery(value);
        else
            throw new Error("Given argument type is incopatible (" + typeof value + ")");
    }
    static_methods.expand(__self, static_methods);
    return __self;
})();
class Chart {
    constructor(width = 512, height = 256) {
        this.canvas = $.create('CANVAS').setStyle({
        // 'border': '1px solid #abc'
        });
        this.canvas.width = width;
        this.canvas.height = height;
        let ctx = this.canvas.getContext('2d', { antialias: true });
        if (ctx === null)
            throw new Error('Cannot get canvas 2d context.');
        this.ctx = ctx;
        this.ctx.fillStyle = Chart.Colors.background;
        this.ctx.textAlign = 'center';
        this.ctx.font = "17px Helvetica";
        this.ctx.fillRect(0, 0, width, height);
    }
    feedWithData(data) {
        let max_y_value = data.reduce((prev, curr) => {
            return prev.y_value > curr.y_value ? prev : curr;
        }).y_value;
        let chart_width = this.canvas.width - Chart.left_panel_width, chart_height = (this.canvas.height - Chart.offset_top - Chart.offset_bottom);
        // console.log(data);
        let points = data.map((dt, index) => {
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
        points.forEach(point => {
            this.ctx.fillStyle = Chart.Colors.dot;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, Chart.dot_radius, 0, Math.PI * 2, false);
            this.ctx.fill();
            if (Chart.dot_hollow_radius > 0) {
                this.ctx.fillStyle = Chart.Colors.background;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, Chart.dot_hollow_radius, 0, Math.PI * 2, false);
                this.ctx.fill();
            }
        });
        let labels_density = Math.round((data.length * Chart.max_label_width * 0.75) / chart_width);
        // console.log(labels_density);
        //data labels
        this.ctx.fillStyle = Chart.Colors.text;
        let even_index = 0;
        data.forEach((dt, index) => {
            if (index % labels_density !== 0)
                return;
            this.ctx.fillText(String(dt.x_value), points[index].x, this.canvas.height - 2 - (17 * ((even_index++) % 2)), Chart.max_label_width);
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
        let slices = 4; //slice max value n times
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
    }
    getCanvas() {
        return this.canvas;
    }
    //calculations
    drawLines(ctx, pts) {
        ctx.moveTo(pts[0], pts[1]);
        for (var i = 2; i < pts.length - 1; i += 2)
            ctx.lineTo(pts[i], pts[i + 1]);
    }
    getCurvePoints(pts_u, tension = 0.5, isClosed = false, numOfSegments = 16) {
        // use input value if provided, or use a default value	 
        //tension = (typeof tension != 'undefined') ? tension : 0.5;
        //isClosed = isClosed ? isClosed : false;
        //numOfSegments = numOfSegments ? numOfSegments : 16;
        var pts = [];
        for (var p of pts_u)
            pts.push(p.x, p.y);
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
    }
}
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
///<reference path="utils.ts"/>
///<reference path="chart.ts"/>
function createVisitsChart(VISITS) {
    let chart = new Chart(800, 400);
    let daily_visits = {};
    VISITS.map((visit) => visit.TIME.replace(/\ [0-9]{2}:[0-9]{2}/, ''))
        .forEach(date => daily_visits[date] = (daily_visits[date] || 0) + 1);
    let chart_data = Object.keys(daily_visits).sort((a, b) => {
        return a.localeCompare(b);
    }).map(key => {
        return { x_value: key, y_value: daily_visits[key] };
    });
    chart.feedWithData(chart_data);
    return chart.getCanvas();
}
function createVisitsTable(VISITS) {
    let visits_table = $.create('TABLE').addClass('dark_evens').setStyle({ 'width': '100%' }).add($.create('TR')
        .add($.create('TH').setText('IP'))
        .add($.create('TH').setText('TIME')));
    const cell_style = {
        'white-space': 'nowrap',
        'text-align': 'left'
    };
    VISITS.forEach((visit) => {
        //console.log(visit);
        visits_table.add($.create('TR')
            .add($.create('TD').setStyle(cell_style).setText(visit.IP))
            .add($.create('TD').setStyle(cell_style).setText(visit.TIME)));
    });
    return visits_table;
}
function refreshStatistics() {
    $('#statistics_container').setText('loading...');
    $.postRequest('statistics_request', {
        from: $('input[name="stats_from_date"]').value + ' 00:00',
        to: $('input[name="stats_to_date"]').value + '23:59'
    }, (unparsed_res) => {
        if (unparsed_res === undefined)
            return;
        let res = JSON.parse(unparsed_res);
        if (res.result !== 'SUCCESS') {
            $('#statistics_container').setText('Cannot fetch data');
            return;
        }
        $('#visits_table_container').html('').add($.create('DIV').add(createVisitsTable(res.VISITS)).setStyle({
            'max-height': '500px',
            'overflow-y': 'auto'
        }));
        $('#visits_chart_container').html('').add(createVisitsChart(res.VISITS));
    });
}
$.load(() => {
    try {
        let today_date = new Date().toLocaleDateString(); //DD.MM.YYYY
        let date_in_array = today_date.split('.').reverse(); //['YYYY', 'MM', 'DD']
        $('input[name="stats_to_date"]').attribute('value', date_in_array.join('-')); //YYYY-MM-DD
        date_in_array[2] = '01';
        $('input[name="stats_from_date"]').attribute('value', date_in_array.join('-')); //YYYY-MM-01
    }
    catch (e) {
        console.error(e);
    }
    $('#ban_user_btn').on('click', e => {
        let user_name = $('input[name="user_to_ban"]').value;
        $.postRequest('ban_user_admin_request', { username: user_name }, (unparsed_res) => {
            if (unparsed_res === undefined)
                return;
            let res = JSON.parse(unparsed_res);
            if (res.result !== 'SUCCESS') {
                if (res.result === 'USER_NOT_FOUND')
                    $('#ban_info').setText('Cannot find user or he is already banned');
                else
                    $('#ban_info').setText('Only Admin can ban other users.');
                return;
            }
            $('#ban_info').setText('User banned');
        });
    });
    $('#stats_refresh_btn').on('click', refreshStatistics);
    refreshStatistics(); //refresh after page load
});
