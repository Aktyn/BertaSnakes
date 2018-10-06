"use strict";
///<reference path="utils.ts"/>
(function (w, h) {
    var c = $$.create("CANVAS"); //document.createElement("CANVAS");
    c.width = w;
    c.height = h;
    c.style.position = "fixed";
    c.style.left = c.style.top = "0px";
    $$(document.body).addChild(c);
    var ctx = c.getContext("2d", { antialias: true });
    function getScriptPath(foo) {
        return window.URL.createObjectURL(new Blob([foo.toString().match(/^\s*function\s*\(\s*\)\s*\{(([\s\S](?!\}$))*[\s\S])/)[1]], { type: 'text/javascript' }));
    }
    function drawFractal(input_values) {
        var calc_thread = new Worker(getScriptPath(function () {
            self.addEventListener('message', function (e) {
                var linear_interpolate = function (c1, c2, factor) {
                    if (c1 === undefined || c2 === undefined)
                        return [0, 0, 0];
                    return c1.map(function (v, i) { return v * (1 - factor) + c2[i] * factor; });
                };
                //@ts-ignore
                function fix255(v, t, p) {
                    return Array.from(arguments).map(function (x) { return ~~(x * 255); });
                }
                function HSVtoRGB(h, s, v) {
                    var i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
                    switch (i % 6) {
                        default:
                        case 0: return fix255(v, t, p);
                        case 1: return fix255(q, v, p);
                        case 2: return fix255(p, v, t);
                        case 3: return fix255(p, q, v);
                        case 4: return fix255(t, p, v);
                        case 5: return fix255(v, p, q);
                    }
                }
                var max_iteration = 1000, chunks = 5;
                var xtemp, x0, y0, x, y;
                var palette = [];
                for (var i = 0; i < max_iteration; i++)
                    palette.push(HSVtoRGB(i / max_iteration, (i % 256) / 512.0 + 0.5, 1.0));
                var last = performance.now();
                for (var j = 0; j < chunks; j++) {
                    for (var k = 0; k < chunks; k++) {
                        for (var Py = j; Py < e.data.h; Py += chunks) {
                            for (var Px = k; Px < e.data.w; Px += chunks) {
                                x0 = (Px / (e.data.w / 2) - 1.) * e.data.scale + e.data.x;
                                y0 = (Py / (e.data.h / 2) - 1.) * e.data.scale - e.data.y;
                                x = 0.0, y = 0.0;
                                var iteration = 0;
                                while (x * x + y * y < (1 << 16) && iteration++ < max_iteration) {
                                    xtemp = x * x - y * y + x0;
                                    y = 2. * x * y + y0;
                                    x = xtemp;
                                }
                                if (iteration < max_iteration)
                                    iteration = iteration + 1 - Math.log((Math.log(x * x + y * y) / 2)
                                        / Math.log(2)) / Math.log(2);
                                var color = linear_interpolate(palette[Math.floor(iteration)], palette[Math.floor(iteration) + 1], iteration % 1);
                                for (var i = 0; i < 3; i++)
                                    e.data.id.data[(Py * e.data.h + Px) * 4 + i]
                                        = color[i] * (0.5 + (iteration % 255) / 512.0);
                                e.data.id.data[(Py * 512 + Px) * 4 + 3] = 255;
                            }
                            if (performance.now() - last > 1000 / 30) {
                                //@ts-ignore
                                self.postMessage(e.data.id);
                                last = performance.now();
                            }
                        }
                    }
                }
                //@ts-ignore
                self.postMessage(e.data.id); //final result
            }, false);
        }));
        calc_thread.addEventListener('message', function (e) { return ctx.putImageData(e.data, 0, 0); }, false);
        calc_thread.postMessage(input_values);
        return calc_thread;
    }
    var draw_thread;
    var params = {
        x: -0.77568377,
        y: 0.13646737,
        scale: 1,
        w: w,
        h: h,
        id: undefined
    };
    var refresh = function () {
        if (draw_thread)
            draw_thread.terminate();
        params.id = ctx.getImageData(0, 0, w, h);
        draw_thread = drawFractal(params);
    };
    //@ts-ignore
    c.onwheel = c.onscroll = function (e) {
        var scale_factor = 1. + 0.1 * e.wheelDelta / 120.0;
        params.scale /= scale_factor;
        ctx.drawImage(c, 0, 0, c.width / scale_factor, c.height / scale_factor, c.width * (1. - scale_factor) / 2, c.height * (1. - scale_factor) / 2, c.width, c.height);
        refresh();
    };
    var drag, last_drag;
    var setDrag = function (e) { return drag = { x: e.clientX, y: e.clientY }; };
    c.onmouseup = c.onmouseout = function () { drag = undefined; refresh(); };
    c.onmousedown = function (e) {
        setDrag(e);
        last_drag = drag;
        if (draw_thread)
            draw_thread.terminate();
    };
    c.onmousemove = function (e) {
        if (!drag || !last_drag)
            return;
        setDrag(e);
        var dx = drag.x - last_drag.x;
        var dy = drag.y - last_drag.y;
        params.x -= dx / c.width * 2 * params.scale;
        params.y += dy / c.height * 2 * params.scale;
        last_drag = drag;
        ctx.drawImage(c, dx, dy);
    };
    refresh();
})(512, 512);
