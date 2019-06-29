const toHexString = (number: number) => '#'+('000000'+number.toString(16)).substr(-6);

let i;

export interface ColorI {
	byte_buffer: Uint8Array;
	buffer: Float32Array;
	hex: string;
}

function gen(r: number, g: number, b: number): ColorI {
	return {
		byte_buffer: new Uint8Array([r, g, b]),//Uint8ClampedArray
		buffer: new Float32Array([r / 255, g / 255, b / 255, 1]),
		hex: toHexString(r << 16 | g << 8 | b << 0)
	};
}

interface PaletteSchema {
	PLAYERS_COLORS: ColorI[];
	WHITE: ColorI;
	BLACK: ColorI;
	//WALLS: ColorI;
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

	//WALLS: 		gen(255, 255, 255),//156, 185, 237
	SAFE_AREA: 	gen(96, 255, 96),
	ENEMY_SPAWN:gen(245, 68, 55),
	POISON:		gen(178, 204, 101),
	HEALTH_BAR: gen(229, 115, 104),
	IMMUNITY_AUREOLE: gen(255, 255, 59),
};

interface ColorsSchema extends PaletteSchema {
	compareByteBuffers(buff1: Uint8Array | number[], buff2: Uint8Array | number[]): boolean;
	isPlayerColor(buff: Uint8Array | number[]): boolean;
	gen(r: number, g: number, b: number): ColorI;

	[index: string]: ColorI | Array<ColorI> | boolean | Function;
}

const Colors = {//utils methods
	//NOTE: alpha value does not matter
	compareByteBuffers: function(buff1, buff2) {
		for(i=0; i<3; i++) {
			if(buff1[i] !== buff2[i])
				return false;
		}
		return true;
	},
	isPlayerColor: function(buff) {
		for(let player_col_i=0; player_col_i<(<ColorI[]>PALETTE.PLAYERS_COLORS).length;
			player_col_i++) 
		{
			if( Colors.compareByteBuffers((<ColorI[]>PALETTE.PLAYERS_COLORS)[player_col_i].byte_buffer, buff) )
				return true;
		}
		return false;
	},
	gen: gen,

	//PLAYERS_COLORS: PALETTE.PLAYERS_COLORS,//TODO - check for duplicate

	...PALETTE
} as ColorsSchema;

export default Colors;
