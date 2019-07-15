import * as path from 'path';
import * as fs from 'fs';
import ERROR_CODES from '../common/error_codes';
import Config from '../common/config';
import {makeSureFolderExists} from "./utils";
import * as Canvas from 'canvas';

const Image = Canvas.Image;

const AVATAR_SIZE = Config.CONVERTED_AVATARS_RESOLUTION;

// const Canvas = require('canvas');
// const Image = Canvas.Image;

export const UPLOADS_FOLDER = path.join(__dirname, '..', '..', 'uploads');
const AVATARS_FOLDER = path.join(UPLOADS_FOLDER, 'avatars');

makeSureFolderExists(UPLOADS_FOLDER);
makeSureFolderExists(AVATARS_FOLDER);

export default {
	//URL encoded image data
	saveAvatar(file_name: string, image_data: string): Promise<{error: ERROR_CODES, file_name: string}> {
		//force file_name extension to .png
		file_name = file_name.replace(/\..+$/i, '') + '.png';

		return new Promise((resolve, reject) => {
			let img = new Image();
		
			img.onload = () => {

				let canv = Canvas.createCanvas(AVATAR_SIZE, AVATAR_SIZE);
				let ctx = canv.getContext('2d');

				let aspect = img.width / img.height;
				if(img.width >= img.height)
		  			ctx.drawImage(img, 
		  				(AVATAR_SIZE/2) - (AVATAR_SIZE/2)*aspect, 0, AVATAR_SIZE * aspect, AVATAR_SIZE);
		  		else
		  			ctx.drawImage(img, 0, 
		  				(AVATAR_SIZE/2) - (AVATAR_SIZE/2)/aspect, AVATAR_SIZE, AVATAR_SIZE/aspect);

		  		let out = fs.createWriteStream( path.join(AVATARS_FOLDER, file_name) ), 
		    		stream = canv.createPNGStream();
				 
				stream.on('data', function(chunk: any) {
				 	out.write(chunk);
				});
				 
				stream.on('end', function() {
				 	resolve({error: ERROR_CODES.SUCCESS, file_name });
				});

			};
			img.onerror = (e) => {
				console.error(e);
				reject({error: ERROR_CODES.SERVER_ERROR});
			};
			img.src = image_data;

		});
	},

	removeAvatar(file_name: string) {
		try {
			file_name = file_name.replace(/\..+$/i, '') + '.png';
			fs.unlinkSync( path.join(AVATARS_FOLDER, file_name) );
		}
		catch(e) {}
	}
}