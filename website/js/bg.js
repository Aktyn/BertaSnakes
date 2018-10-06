"use strict";
/* animated background */
///<reference path="utils.ts"/>
var BackgroundEffect = (function () {
    console.info("Initializing animated background");
    var canv = $$.create("CANVAS");
    $$.expand(canv, $$.getScreenSize()); //sets width and height
    var ctx = canv.getContext("2d", { antialias: true });
    if (ctx === null)
        return;
    $$.expand(canv.style, {
        "z-index": "-1",
        display: "inline-block",
        // background: "#f55",
        position: "fixed",
        margin: "0px",
        padding: "0px",
        left: "0px",
        top: "0px"
    }, true);
    $$.load(function () {
        $$(document.body).appendAtBeginning(canv);
        $$(document.body).style.background = "none"; //needed for proper display
    });
    (function () {
        //unit - pixels
        var radius = 2;
        var def_speed = 0.01;
        var speed_vary = 0.01;
        var start_dots = 50;
        var max_dots = 100;
        var dots = [];
        var save = function () {
            console.log("Saving background state");
            sessionStorage.setItem('background_state', JSON.stringify(dots));
        };
        var restore = function () {
            var data = sessionStorage.getItem('background_state');
            if (data != null) {
                console.log("Restoring background state");
                dots = JSON.parse(data);
            }
            else {
                dots = [];
                for (var i = 0; i < start_dots; i++)
                    addDot(true);
            }
        };
        restore();
        var corners = [[0, 0], [canv.width, 0], [canv.width, canv.height], [0, canv.height]];
        function addDot(random_pos) {
            if (random_pos === void 0) { random_pos = false; }
            dots.push({
                x: random_pos === true ? (Math.random() * canv.width)
                    : (corners[~~(Math.random() * 4)][0]),
                y: random_pos === true ? (Math.random() * canv.height) :
                    (corners[~~(Math.random() * 4)][1]),
                speed: def_speed + (Math.random() * 2.0 - 1.0) * speed_vary,
                angle: Math.random() * Math.PI * 2
            });
        }
        var fixDotPos = function (dot) {
            dot.x = Math.max(Math.min(dot.x, canv.width), 0);
            dot.y = Math.max(Math.min(dot.y, canv.height), 0);
        };
        var time_sum = 0;
        var time_samples = 0;
        var perf_accuracy = 60;
        //let alpha = 0.;
        var last = performance.now();
        var tick = function () {
            var now = performance.now();
            var dt = now - last;
            //console.log(dt);
            last = now;
            if (dt > 1000.0)
                dt = 0.0;
            //clearing screen
            ctx.clearRect(0, 0, canv.width, canv.height);
            ctx.fillStyle = "#ffffff20";
            ctx.strokeStyle = "#ffffff50";
            //if(alpha < 1)
            //	ctx.globalAlpha = Math.min(1, Math.pow(alpha+=dt*0.0005, 2));
            for (var _i = 0, dots_1 = dots; _i < dots_1.length; _i++) {
                var dot = dots_1[_i];
                //updating
                var dx = Math.cos(dot.angle) * dt * dot.speed;
                var dy = Math.sin(dot.angle) * dt * dot.speed;
                dot.x += dx;
                if (dot.x < 0 || dot.x > canv.width) {
                    dot.angle = Math.atan2(dy, -dx);
                    fixDotPos(dot);
                }
                dot.y += dy;
                if (dot.y < 0 || dot.y > canv.height) {
                    dot.angle = Math.atan2(-dy, dx);
                    fixDotPos(dot);
                }
                //rendering
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2, true);
                ctx.fill();
            }
            //lines
            for (var i = 0; i < dots.length; i++) {
                for (var j = i + 1; j < dots.length; j++) {
                    var dst = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y) /
                        Math.max(canv.width, canv.height);
                    dst = Math.pow(1.0 - dst, 16);
                    if (dst < 0.01)
                        continue;
                    ctx.lineWidth = dst;
                    ctx.beginPath();
                    ctx.lineTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
            time_sum += performance.now() - last;
            if (++time_samples >= perf_accuracy) {
                //less than x miliseconds
                if (time_sum / time_samples < 1.0) {
                    if (dots.length < max_dots) {
                        //adding more dots
                        for (var i = 0; i < 5; i++)
                            addDot();
                    }
                }
                else if (time_sum / time_samples > 2.0) { //lag
                    for (var i = 0; i < 2 + ~~(time_sum / time_samples); i++)
                        dots.pop();
                }
                time_sum = 0;
                time_samples = 0;
            }
            //@ts-ignore
            requestAnimFrame(tick);
        };
        tick();
        function onResize(res) {
            $$.expand(canv, res, true); //sets width and height
            ctx = canv.getContext("2d", { antialias: true });
        }
        window.addEventListener('resize', function () { return onResize($$.getScreenSize()); }, false);
        onResize($$.getScreenSize());
        window.addEventListener('unload', save, false);
    })();
})();
