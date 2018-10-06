"use strict";
///<reference path="utils.ts"/>
///<reference path="main.ts"/>
(function () {
    var body_loader = null;
    function loginUser(nick, pass) {
        $$('#login_error').append();
        //NOTE - base64 encoded password
        $$.postRequest('/login_request', { username: nick, password: btoa(pass) }, function (raw_res) {
            if (body_loader)
                body_loader.delete();
            if (raw_res === undefined)
                return;
            var res = JSON.parse(raw_res);
            //console.log(res);
            if (res.result !== 'SUCCESS') {
                $$("#login_error").setText((function (error_name) {
                    switch (error_name) {
                        case "INCORRECT_PASSWORD":
                            return "Incorrect password";
                        case "USER_DOES_NOT_EXISTS":
                            return "User does not exists";
                        case "ACCOUNT_NOT_VERIFIED":
                            return "Account not verified. Check your email for verification link or:";
                        case "ACCOUNT_BANNED":
                            return "Account banned";
                        default:
                            return "Login error";
                    }
                })(res.result));
                if (res.result === 'ACCOUNT_NOT_VERIFIED') {
                    //<div><button id='account_logout'>LOG OUT</button></div>
                    var new_line = $$.create("DIV");
                    var resend_btn = $$.create("BUTTON");
                    resend_btn.innerText = "RESEND VERIFICATION EMAIL";
                    var sending_1 = false;
                    resend_btn.on('click', function () {
                        if (sending_1 === true)
                            return;
                        sending_1 = true;
                        //console.log('TODO');//resend verification email request
                        $$.postRequest('/resend_verification_link_request', { username: nick, password: btoa(pass) }, function (resend_res_raw) {
                            if (resend_res_raw === undefined) {
                                $$("#login_error").setText('Incorrect server response');
                                return;
                            }
                            sending_1 = false;
                            var resend_res = JSON.parse(resend_res_raw);
                            console.log(resend_res);
                            if (resend_res.result !== 'SUCCESS')
                                $$("#login_error").innerText = resend_res.result;
                            else
                                location.reload();
                        });
                    });
                    new_line.append(resend_btn);
                    $$("#login_error").append(new_line);
                }
                return;
            }
            //set cookie from res.user_key
            //console.log( 'user_key:', res.user_key );
            var d = new Date();
            d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000)); //7 days cookie lifetime
            document.cookie = 'user_session=' + res.user_key +
                ";expires=" + d.toUTCString() + ";path=/";
            location.href = '/account';
        });
    }
    $$.load(function () {
        $$("#login_submit").on('click', function () {
            try {
                loginUser($$('input[name="username"]').value, $$('input[name="password"]').value);
            }
            catch (e) {
                console.error('Login error:', e);
            }
        });
    });
})();
