const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'BertaSnakes@gmail.com',
		pass: 'tajne/poufne'
	}
});

var basic_options = {
	from: '"Berta Snakes" <BertaSnakes@gmail.com>',
};

module.exports = {
	sendVerificationCode: (code, target_email) => {
		return new Promise((resolve, reject) => {
			let msg = 'Congratulations! Your account has been successfuly registered. ' + 
				'Once you open below link in your browser, you will be able to login.';
			let link = 'http://localhost/verify?code=' + code;

			let opts = Object.assign({
				subject: 'Account verification',
				to: target_email,
				text: msg + '\n' + link,
				html: '<p>' + msg + '</p>' + '<a href="' + link + '">verification link</a>'
			}, basic_options);

			console.log('Sending verification email to:', target_email, 'with code:', code);
			transporter.sendMail(opts, function(error, info) {
				if(error)
					reject(error);
				else
					resolve(info);
			});
		});
	}
};