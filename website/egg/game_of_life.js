"use strict";
//Created by Aktyn
//If code you see in this file is JavaScript note that it has been transpiled from TypeScript.
(function GameOfLifeInit() {
    if (!document.body) { //waiting for page to load (not tested)
        window.addEventListener('onload', GameOfLifeInit, false);
        return;
    }
    window.removeEventListener('onload', GameOfLifeInit, false);
    var screen_r = {
        //@ts-ignore
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        //@ts-ignore
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    };
    //PARAMS
    const SIZE = 5;
    const width = Math.floor(screen_r.width / SIZE), height = Math.floor(screen_r.height / SIZE); //pixels
    const visibleWidth = screen_r.width + 'px', visibleHeight = screen_r.height + 'px';
    const color = Uint8ClampedArray.of(255, 150, 150, 255); //must include alpha channel value
    const FREQUENCY = 100; //game state update each n milisecond
    const POPULATION_PERCENTAGE = 0.1; //initial percentage of active pixels
    //predeclared variables
    var x, y, xx, yy, p_i, p_ii, state_it, neighbours, nb;
    ////////////////////////////////////////////////////////////////
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const MAP = (function (ctx) {
        //Author's signature
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.font = String(Math.floor(screen_r.height / SIZE / 8)) + 'px Helvetica';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.clearRect(0, 0, width, height);
        ctx.fillText("Created by Aktyn", width / 2, height / 2);
        return {
            clear: () => ctx.clearRect(0, 0, width, height),
            redraw: (data) => ctx.putImageData(data, 0, 0),
            getData: () => ctx.getImageData(0, 0, width, height),
            set: (data, x, y, active) => {
                p_i = (x + y * width) * 4;
                if (active) {
                    for (p_ii = 0; p_ii < 4; p_ii++)
                        data[p_i + p_ii] = color[p_ii];
                }
                else {
                    for (p_ii = 0; p_ii < 4; p_ii++)
                        data[p_i + p_ii] = 0;
                }
            },
            get: (data, x, y) => {
                p_i = (x + y * width) * 4;
                for (p_ii = 0; p_ii < 4; p_ii++) {
                    if (data[p_i + p_ii] !== color[p_ii])
                        return false;
                }
                return true;
            },
            isEmpty: (data) => {
                for (y = 0; y < height; y++) {
                    for (x = 0; x < width; x++) {
                        p_i = (x + y * width) * 4;
                        if (data.data[p_i + 3] > 0) //at least one pixel is visible
                            return false; //so map is not empty
                    }
                }
                return true;
            }
        };
    })(canvas.getContext('2d', { antialias: false, alpha: true }));
    const logic = {
        generate: function (data) {
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    if (Math.random() > 1 - POPULATION_PERCENTAGE)
                        MAP.set(data.data, x, y, true);
                }
            }
        },
        //@ts-ignore
        countNeighbours: function (data, x, y) {
            nb = 0;
            for (xx = -1; xx <= 1; xx++) {
                for (yy = -1; yy <= 1; yy++) {
                    if (x + xx >= 0 && x + xx < width && y + yy >= 0 && y + yy < height && !(xx === 0 && yy === 0)) {
                        if (MAP.get(data, x + xx, y + yy))
                            nb++;
                    }
                }
            }
            return nb;
        },
        step: function (current_state, data) {
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    state_it = MAP.get(current_state, x, y);
                    neighbours = this.countNeighbours(current_state, x, y);
                    if (state_it === false && neighbours === 3) //death cell with 3 neighbours
                        MAP.set(data, x, y, true); //becomes alive
                    if (state_it === true && !(neighbours === 2 || neighbours === 3))
                        MAP.set(data, x, y, false);
                }
            }
        }
    };
    setTimeout(() => {
        var running = true;
        MAP.clear(); //make sure map is empty
        var data = MAP.getData(); //to get clean data for generating initial state
        //buffer holding copy of current state while calculating next step in algorithm
        var current_state_array = new Uint8ClampedArray(data.data.length);
        var tick = () => {
            if (MAP.isEmpty(data))
                logic.generate(data);
            else {
                current_state_array.set(data.data); //copy current state
                logic.step(current_state_array, data.data);
            }
            MAP.redraw(data);
            if (running)
                setTimeout(tick, FREQUENCY);
        };
        tick();
    }, 3000); //delayed start for showing author's signature
    //styling and appending canvas to page
    Object.assign(canvas.style, {
        'image-rendering': 'pixelated',
        'pointer-events': 'none',
        //position in center of the screen
        'position': 'fixed',
        'left': '0px',
        'right': '0px',
        'top': '0px',
        'bottom': '0px',
        'margin': 'auto',
        //change visible size
        'width': visibleWidth,
        'height': visibleHeight
    });
    document.body.appendChild(canvas);
})();
