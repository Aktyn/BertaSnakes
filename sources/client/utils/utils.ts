import ERROR_CODES from '../../common/error_codes';
import Config from '../../common/config';

export default {
	GAMEMODES_NAMES: ['Cooperation', 'Competition'],

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

	trimString(str: string, max_len: number, suffix = '...') {
		if(str.length > max_len)
			return str.substr(0, max_len-suffix.length) + suffix;
		return str;
	}
};