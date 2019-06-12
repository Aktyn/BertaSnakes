import * as nodemailer from 'nodemailer';
//const emailExists = require('email-exists');

import {getArgument} from './utils';

const email_address = getArgument('EMAIL_ADDRESS');
const email_pass = getArgument('EMAIL_PASSWORD');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: email_address,
		pass: email_pass
	}
});

const basic_options = {
	from: `"Berta Snakes" <${email_address}>`,
};

export default {
	sendVerificationCode(code: string, target_email: string) {
		return new Promise((resolve, reject) => {
			let msg = 'Congratulations! Your account has been successfuly registered. ' + 
				'Before you can enjoy full possibilities of BertaSnakes game you must verify your account with this code: ' + code;
			//`http://${ip.address()}/verify?code=${code}`;

			let opts = Object.assign({
				subject: 'Account verification',
				to: target_email,
				text: msg,
				html: msg,//TODO - html version
			}, basic_options);

			transporter.sendMail(opts, function(error: Error | null, info: string) {
				if(error)
					reject(error);
				else
					resolve(info);
			});
		});
	},

	/*checkExistence(email: string) {
		return emailExists({ 
			sender: email_address,
			recipient: email
		});
	}*/
};