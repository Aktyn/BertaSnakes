"use strict";
//const Colors = (function() {/*GAME COLORS PALETTE*/
var ColorsScope;
(function (ColorsScope) {
    const toHexString = (number) => '#' + ('000000' + number.toString(16)).substr(-6);
    var i;
    function gen(r, g, b) {
        return {
            byte_buffer: new Uint8Array([r, g, b /*, 1*/]),
            buffer: new Float32Array([r / 255, g / 255, b / 255, 1]),
            hex: toHexString(r << 16 | g << 8 | b << 0)
        };
    }
    const PALETTE = {
        PLAYERS_COLORS: [
            gen(225, 53, 61),
            gen(139, 195, 74),
            gen(14, 177, 190),
            gen(207, 218, 34),
            gen(251, 140, 44),
            gen(158, 94, 140),
            gen(233, 30, 99),
            gen(121, 85, 72) //BROWN
        ],
        WHITE: gen(255, 255, 255),
        BLACK: gen(0, 0, 0),
        WALLS: gen(156, 185, 237),
        SAFE_AREA: gen(96, 255, 96),
        ENEMY_SPAWN: gen(245, 68, 55),
        POISON: gen(178, 204, 101),
        HEALTH_BAR: gen(229, 115, 104),
        IMMUNITY_AUREOLE: gen(255, 255, 59)
    };
    ColorsScope.Colors = Object.assign({ 
        //NOTE - alpha value does not matter
        compareByteBuffers: function (buff1, buff2) {
            for (i = 0; i < 3; i++) {
                if (buff1[i] != buff2[i])
                    return false;
            }
            return true;
        }, isPlayerColor: function (buff) {
            for (var player_col_i = 0; player_col_i < PALETTE.PLAYERS_COLORS.length; player_col_i++) {
                if (ColorsScope.Colors.compareByteBuffers(PALETTE.PLAYERS_COLORS[player_col_i].byte_buffer, buff) === true)
                    return true;
            }
            return false;
        }, PLAYERS_COLORS: PALETTE.PLAYERS_COLORS }, PALETTE);
    //Object.assign(self, PALETTE);
    //return self;
})(ColorsScope || (ColorsScope = {}));
var Colors = ColorsScope.Colors;
try { //export for NodeJS
    module.exports = Colors;
}
catch (e) { }
