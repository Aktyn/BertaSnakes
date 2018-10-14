"use strict";
// global._CLIENT_ = false;
Object.defineProperty(exports, "__esModule", { value: true });
// import RoomInfo from './../include/room_info';
// import UserInfo from './../include/user_info';
///<reference path="./../include/user_info.ts"/>
///<reference path="./../include/room_info.ts"/>
////<reference path="./../include/game/maps.ts"/>
////<reference path="server_game.ts"/>
//import NetworkCodes from './../include/network_codes.js';
/*declare global {
    namespace NodeJS {
        export interface Global {
            _CLIENT_: boolean;
            DATE_VERSION: string;
        }
    }
}
global._CLIENT_ = false;*/
const server_game_1 = require("./server_game");
// import Maps from './../include/game/maps';
// if( (<NodeModule>process.mainModule).parent !== null ) {
console.log = (function (MSG_PREFIX) {
    const log = console.log; //preserve
    //@ts-ignore
    return function () { log.apply(console, [MSG_PREFIX, ...arguments]); };
})('[Game#' + process.pid + '] =>');
console.log('Child process initialized');
var game = null;
let waitForGameInitialize = (callback) => {
    if (game != null && game.initialized === true)
        callback();
    else
        setTimeout(waitForGameInitialize, 100, callback);
};
process.on('message', function (msg) {
    var RoomInfo = require('./../include/room_info');
    var UserInfo = require('./../include/user_info');
    var Maps = require('./../include/game/maps');
    // var ServerGame = require('./server_game');
    //console.log(msg);
    if (msg.user_id) { //message from client
        try {
            //console.log('TEST');
            //@ts-ignore
            game.onClientMessage(msg.user_id, msg.data.data);
        }
        catch (e) {
            console.error('cannot process byte data from client:');
            console.error(e);
        }
    }
    else {
        //@msg - {action, ...} where @action - string representing given action
        switch (msg.action) {
            case 'init_game':
                console.log('Initializing server-side game');
                var room = RoomInfo.fromJSON(msg.room_info);
                msg.users.forEach((user) => room.addUser(UserInfo.fromFullJSON(user)));
                Maps.onLoad(() => {
                    try {
                        game = new server_game_1.default.Class(Maps.getByName(room.map), room);
                        setTimeout(function () {
                            console.log('Game lifetime expired. Canceling process');
                            process.exit(); //TODO - onexit event in core.js
                        }, 1000 * 60 * 40); //40 minutes (maximum game lifetime)
                    }
                    catch (e) {
                        console.error('TODO - handle this impossible error', e);
                        process.exit();
                        //process.send( {action: NetworkCodes.START_GAME_FAIL_ACTION} );
                    }
                });
                //console.log(room);
                break;
            case 'run_game':
                console.log('Running game');
                waitForGameInitialize(() => {
                    if (game !== null)
                        game.start();
                });
                break;
        }
    }
});
//}
// export default "GameProcess module";
// setInterval(() => console.log('x'), 2000);
