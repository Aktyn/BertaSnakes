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
	from: `"Berta Snakes" \<${email_address}\>`,
};

function sendEmail(text_content: string, html_content: string, subject: string, target_email: string) {
	return new Promise((resolve, reject) => {
		let opts = Object.assign({
			subject,
			to: target_email,
			text: text_content,
			html: html_content,
		}, basic_options);

		transporter.sendMail(opts, function(error: Error | null, info: string) {
			if(error)
				reject(error);
			else
				resolve(info);
		});
	});
}

export default {
	getAddress() {
		return email_address;
	},
	
	sendVerificationCode(code: string, target_email: string) {
		let msg = 'Congratulations! Your account has been successfully registered. ' +
			'Before you can enjoy full possibilities of BertaSnakes game you must verify your account with this code: ' + code;
		//TODO: html version
		return sendEmail(msg, msg, 'Account verification', target_email);
	},
	
	sendPasswordResetCode(code: string, target_email: string) {
		let msg = 'Password reset code: ' + code;
		return sendEmail(msg, msg, 'Password reset', target_email);
	}

	/*checkExistence(email: string) {
		return emailExists({ 
			sender: email_address,
			recipient: email
		});
	}*/
};