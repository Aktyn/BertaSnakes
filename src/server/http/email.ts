// import * as nodemailer from 'nodemailer';
const nodemailer = require('nodemailer');
import * as ip from 'ip';

var prompt = require('prompt-sync')();

var email_pass = process.env.npm_config_emailpass;
if(!email_pass) {

	try {//ask user to type password in console
		email_pass = prompt('Email password: ');
	}
	catch(e) {
		console.error(
			'You must specify email password adding --emailpass=PASSWORD to console npm command');
		process.exit();
	}
}

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'BertaSnakes@gmail.com',
		pass: email_pass
	}
});

var basic_options = {
	from: '"Berta Snakes" <BertaSnakes@gmail.com>',
};

export default {
	sendVerificationCode: (code: string, target_email: string) => {
		return new Promise((resolve, reject) => {
			let msg = 'Congratulations! Your account has been successfuly registered. ' + 
				'Once you open below link in your browser, you will be able to login.';
			let link = `http://${ip.address()}${global._HOMEPATH_}verify?code=${code}`;

			let opts = Object.assign({
				subject: 'Account verification',
				to: target_email,
				text: msg + '\n' + link,
				html: `<p>${msg}</p><a href='${link}'>verification link</a>`
			}, basic_options);

			console.log('Sending verification email to:', target_email, 'with code:', code);
			transporter.sendMail(opts, function(error: Error, info: string) {
				if(error)
					reject(error);
				else
					resolve(info);
			});
		});
	}
};