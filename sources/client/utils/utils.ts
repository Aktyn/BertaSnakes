import ERROR_CODES from '../../common/error_codes';
import Config from '../../common/config';

const DEFAULT_LABELS = {
	hours: '',
	minutes: '',
	seconds: ''
};

function zeroPad(num: number) {
	return num < 10 ? `0${num}` : num.toString();
}

export default {
	GAMEMODES_NAMES: ['Cooperation', 'Competition'],
	
	SHIP_TEXTURES: [
		require('../img/textures/players/type_1.png'),
		require('../img/textures/players/type_2.png'),
		require('../img/textures/players/type_3.png'),
	],

	openImageFile(max_size = Config.MAXIMUM_IMAGE_FILE_SIZE): Promise<string> {
		return new Promise((resolve, reject) => {
			let file_input = document.createElement('input');
			file_input.setAttribute('type', 'file');
			file_input.setAttribute('accept', 'image/*');
			file_input.onchange = (e) => {
				try {
					//@ts-ignore
					let file: File = e.target.files[0];
					if (!file) {
						// reject(new Error('Cannot open file'));
						reject( ERROR_CODES.CANNOT_OPEN_FILE );
						return;
					}

					if(file.size > max_size) {
						// reject(new Error('File too large'));
						reject( ERROR_CODES.FILE_TOO_LARGE );
						return;
					}

					let reader = new FileReader();
					reader.onload = (e) => {
						//@ts-ignore
						resolve(e.target.result);
					};
					//reader.readAsText(file);
					reader.readAsDataURL(file);
				}
				catch(e) {
					console.error(e);
					reject( ERROR_CODES.UNKNOWN );
				}
			};
			file_input.click();
		});
	},

	secondsToTime: (sec: number, delimiter = ':', labels = DEFAULT_LABELS) => {
		sec |= 0;
		let min = (sec/60)|0;
		sec -= min*60;
		let hour = (min/60)|0;
		min -= hour*60;
		if(hour > 0)
			return `${zeroPad(hour)}${labels.hours}${delimiter}${
			zeroPad(min)}${labels.minutes}${delimiter}${zeroPad(sec)}${labels.seconds}`;
		else if(min > 0)
			return `${zeroPad(min)}${labels.minutes}${delimiter}${zeroPad(sec)}${labels.seconds}`;
		else
			return `${zeroPad(sec)}${labels.seconds}`;
	},
	
	formatTime: (timestamp: number) => {
		let dt = new Date(timestamp);
		let h = dt.getHours();
		let m = dt.getMinutes();
		return `${h < 10 ? '0':''}${h}:${m < 10 ? '0':''}${m}`;
	},

	trimString(str: string, max_len: number, suffix = '...') {
		if(str.length > max_len)
			return str.substr(0, max_len-suffix.length) + suffix;
		return str;
	},

	getScreenSize() {
		return {width: window.innerWidth, height: window.innerHeight};
	}
};