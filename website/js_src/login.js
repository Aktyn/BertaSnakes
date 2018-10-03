(function() {
	let body_loader = null;

	function loginUser(nick, pass) {
		$$('#login_error').append( body_loader = COMMON.createLoader() );

		//NOTE - base64 encoded password
		$$.postRequest('/login_request', {username: nick, password: btoa(pass)}, res => {
			res = JSON.parse(res);
			//console.log(res);

			if(res.result !== 'SUCCESS') {
				
				$$("#login_error").setText( (function(error_name) {
					switch(error_name) {
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
				})(res.result) );

				if(res.result === 'ACCOUNT_NOT_VERIFIED') {
					//<div><button id='account_logout'>LOG OUT</button></div>
					let new_line = $$.create("DIV");
					let resend_btn = $$.create("BUTTON");
					resend_btn.innerText = "RESEND VERIFICATION EMAIL";
					let sending = false;
					resend_btn.on('click', () => {
						if(sending === true)
							return;
						sending = true;
						//console.log('TODO');//resend verification email request
						$$.postRequest('/resend_verification_link_request', 
						{username: nick, password: btoa(pass)}, res => {

							sending = false;
							res = JSON.parse(res);
							console.log(res);

							if(res.result !== 'SUCCESS')
								$("#login_error").innerText = res.result;
							else
								location.reload();
						});
					});
					new_line.append(resend_btn);
					$$("#login_error").append( new_line );
				}

				return;
			}

			//set cookie from res.user_key
			//console.log( 'user_key:', res.user_key );
			let d = new Date();
    		d.setTime(d.getTime() + (7*24*60*60*1000));//7 days cookie lifetime
			document.cookie = 'user_session=' + res.user_key + 
				";expires=" + d.toUTCString() + ";path=/";

			location.href = '/account';
		});
	}

	$$.load(() => {
		$$("#login_submit").on('click', () => {
			try {
				loginUser($$('input[name="username"]').value, $$('input[name="password"]').value);
			}
			catch(e) {
				console.error('Login error:', e);
			}
		});
	});
})();