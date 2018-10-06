"use strict";
/*Loads avaible maps data from files alogn with each map's texture*/
//NOTE - accessable object is of a JSON format with each key name coresponding to map name
var Maps = (function () {
    var MAP_FOLDER = typeof module === 'undefined' ? 'maps/' : 'assets/maps/';
    var fs, Canvas, Image;
    if (typeof module !== 'undefined') {
        fs = require('fs');
        Canvas = require('canvas');
        Image = Canvas.Image;
    }
    var pending = 1; //currently loading resources (0 means loaded)
    var onLoadCallbacks = [];
    var self = {
        loaded: function () { return pending === 0; },
        onLoad: function (callback) {
            if (typeof callback !== 'function')
                throw new Error('callback must be a function');
            if (this.loaded())
                callback();
            else
                onLoadCallbacks.push(callback);
        },
        getByName: function (map_name) {
            for (var map_i in this) {
                if (typeof this[map_i] !== 'object')
                    continue;
                if (this[map_i].name === map_name) {
                    return this[map_i];
                }
            }
            return null;
        }
    };
    var printErr = function (e) { return console.error(e); };
    function fixJSON(str) {
        str = str.replace(/(\/\/.*)|\n|\s/gi, '');
        str = '{' + str + '}';
        return str
            .replace(/(,|\{)([^,:\{\}]+):/gi, '$1"$2":')
            .replace(/,\}/g, '}');
    }
    function onMapDataLoadedClient(map) {
        //loading .png map texture
        var map_png = document.createElement('IMG');
        map_png.onload = function () {
            map.image = map_png;
            self[map.name] = map;
            pending--;
            //console.log(self);
            /*if(index === maps_names.length-1) {
                console.log('Maps data loaded');
                console.log(self);
            }*/
        };
        map_png.onerror = printErr;
        map_png.src = MAP_FOLDER + map.name + '.png';
    }
    function onMapDataLoadedServer(map) {
        fs.readFile(MAP_FOLDER + map.name + '.png', function (err, squid) {
            if (err)
                throw err;
            var map_png = new Image();
            map_png.src = squid;
            //ctx.drawImage(img, 0, 0, img.width / 4, img.height / 4);
            map.image = map_png;
            self[map.name] = map;
            pending--;
        });
    }
    function loadMaps(maps_names) {
        //console.log(maps_names);
        maps_names.forEach(function (map_name, index) {
            pending++;
            //self[map_name] = {};
            //console.log(map_name);
            var map = {
                name: map_name,
                data: null,
                image: null //IMG DOM element
            };
            //loading map data
            if (typeof module === 'undefined') { //client side
                fetch(MAP_FOLDER + map_name + '.map').then(function (resp) { return resp.text(); }).then(function (map_data) {
                    map.data = JSON.parse(fixJSON(map_data));
                    onMapDataLoadedClient(map);
                }).catch(printErr);
            }
            else { //server side
                fs.readFile(MAP_FOLDER + map_name + '.map', 'utf8', function (err, map_data) {
                    if (err)
                        throw err;
                    map.data = JSON.parse(fixJSON(map_data));
                    onMapDataLoadedServer(map);
                });
            }
            //loading map texture
        });
        pending--;
    }
    //loading list of files in MAP_FOLDER
    if (typeof module === 'undefined') {
        //client side
        fetch('/get_list_of_maps').then(function (resp) { return resp.json(); })
            .then(loadMaps).catch(printErr);
    }
    else {
        //server side
        fs.readdir(MAP_FOLDER, function (err, files) {
            if (err)
                throw err;
            //console.log( files.filter(f => f.endsWith('.map')).map(f => f.split('.')[0]) );
            loadMaps(files.filter(function (f) { return f.endsWith('.map'); }).map(function (f) { return f.split('.')[0]; }));
        });
    }
    var checkLoaded = function () {
        if (self.loaded())
            onLoadCallbacks.forEach(function (cb) { return cb(); });
        else
            setTimeout(checkLoaded, 100);
    };
    checkLoaded();
    return self;
})();
try { //export for NodeJS
    module.exports = Maps;
}
catch (e) { }
