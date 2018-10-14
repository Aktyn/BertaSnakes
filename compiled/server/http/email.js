"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as nodemailer from 'nodemailer';
const nodemailer = require('nodemailer');
const ip = require("ip");
var prompt = require('prompt-sync')();
var email_pass;
try {
    email_pass = prompt('Email password: ');
}
catch (e) {
    console.error('Cannot prompt user fro email password since server is running in nodemon');
    email_pass = '';
}
// console.log( 'Email:', email_pass );
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
exports.default = {
    sendVerificationCode: (code, target_email) => {
        return new Promise((resolve, reject) => {
            let msg = 'Congratulations! Your account has been successfuly registered. ' +
                'Once you open below link in your browser, you will be able to login.';
            let link = 'http://' + ip.address() + '/verify?code=' + code;
            let opts = Object.assign({
                subject: 'Account verification',
                to: target_email,
                text: msg + '\n' + link,
                html: '<p>' + msg + '</p>' + '<a href="' + link + '">verification link</a>'
            }, basic_options);
            console.log('Sending verification email to:', target_email, 'with code:', code);
            transporter.sendMail(opts, function (error, info) {
                if (error)
                    reject(error);
                else
                    resolve(info);
            });
        });
    }
};
