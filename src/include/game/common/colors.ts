//const Colors = (function() {/*GAME COLORS PALETTE*/
namespace ColorsScope {
	const toHexString = (number: number) => '#'+('000000'+number.toString(16)).substr(-6);

	var i;

	export interface ColorI {
		byte_buffer: Uint8Array;
		buffer: Float32Array;
		hex: string;
	}

	function gen(r: number, g: number, b: number): ColorI {
		return {
			byte_buffer: new Uint8Array([r, g, b/*, 1*/]),//Uint8ClampedArray
			buffer: new Float32Array([r / 255, g / 255, b / 255, 1]),
			hex: toHexString(r << 16 | g << 8 | b << 0)
		};
	}

	interface PaletteSchema {
		PLAYERS_COLORS: ColorI[];
		WHITE: ColorI;
		BLACK: ColorI;
		WALLS: ColorI;
		SAFE_AREA: ColorI;
		ENEMY_SPAWN: ColorI;
		POISON: ColorI;
		HEALTH_BAR: ColorI;
		IMMUNITY_AUREOLE: ColorI;
	}

	const PALETTE: PaletteSchema = {
		PLAYERS_COLORS: [
			gen(225, 53, 61),//RED
			gen(139, 195, 74),//GREEN
			gen(14, 177, 190),//BLUE
			gen(207, 218, 34),//YELLOW
			gen(251, 140, 44),//ORANGE
			gen(158, 94, 140),//PURPLE
			gen(233, 30, 99),//PINK
			gen(121, 85, 72)//BROWN
		],

		WHITE: 	gen(255, 255, 255),
		BLACK: 	gen(0, 0, 0),

		WALLS: 		gen(156, 185, 237),
		SAFE_AREA: 	gen(96, 255, 96),
		ENEMY_SPAWN:gen(245, 68, 55),
		POISON:		gen(178, 204, 101),
		HEALTH_BAR: gen(229, 115, 104),
		IMMUNITY_AUREOLE: gen(255, 255, 59)
	};

	interface ColorsSchema extends PaletteSchema {
		compareByteBuffers: any;
		isPlayerColor: any; 
	}

	export var Colors: ColorsSchema = {//utils methods
		//NOTE - alpha value does not matter
		compareByteBuffers: function(buff1: Uint8Array, buff2: Uint8Array) {
			for(i=0; i<3; i++) {
				if(buff1[i] != buff2[i])
					return false;
			}
			return true;
		},
		isPlayerColor: function(buff: Uint8Array) {
			for(var player_col_i=0; player_col_i<(<ColorI[]>PALETTE.PLAYERS_COLORS).length; 
				player_col_i++) 
			{
				if(Colors.compareByteBuffers(
					(<ColorI[]>PALETTE.PLAYERS_COLORS)[player_col_i].byte_buffer, buff) === true)
					return true;
			}
			return false;
		},

		PLAYERS_COLORS: PALETTE.PLAYERS_COLORS,//TODO - check for duplicate

		...PALETTE
	};

	//Object.assign(self, PALETTE);

	//return self;
}

var Colors = ColorsScope.Colors;

try {//export for NodeJS
	module.exports = Colors;
}
catch(e) {}