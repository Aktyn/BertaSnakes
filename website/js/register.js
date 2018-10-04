"use strict";
///<reference path="utils.ts"/>
///<reference path="main.ts"/>
(function () {
    var body_loader = null;
    var registerUser = function (nick, pass, email) {
        $$('#register_error').setText('').append(body_loader = COMMON.createLoader());
        //NOTE - base64 encoded password
        $$.postRequest('/register_request', { username: nick, password: btoa(pass), email: email }, function (raw_res) {
            if (body_loader)
                body_loader.delete();
            if (raw_res === undefined)
                return;
            var res = JSON.parse(raw_res);
            //console.log(res);
            if (res.result !== 'SUCCESS') {
                $$("#register_error").setText((function (error_name) {
                    switch (error_name) {
                        case "USERNAME_TOO_SHORT":
                            return "User name must be at least 3 characters long";
                        case "PASSWORD_TOO_SHORT":
                            return "Password too short";
                        case "INCORRECT_EMAIL":
                            return "Email format incorrect";
                        case "USER_ALREADY_EXISTS":
                            return "User name taken";
                        case "EMAIL_IN_USE":
                            return "Email already in use";
                        case "EMAIL_SEND_ERROR":
                            return "Cannot send email with verification code";
                        default:
                            return "Register error";
                    }
                })(res.result));
                return;
            }
            $$("#register_error").setText("Registration successful. Check your email for verification link");
        });
    };
    $$.load(function () {
        $$("#register_submit").on('click', function () {
            try {
                registerUser($$('input[name="username"]').value, $$('input[name="password"]').value, $$('input[name="email"]').value);
            }
            catch (e) {
                console.error('Register error:', e);
            }
        });
    });
})();
