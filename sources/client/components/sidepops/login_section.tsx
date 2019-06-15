import * as React from 'react';
import AccountSidepop, {VIEWS} from './account_sidepop';
import {offsetTop, removeWhitechars} from './sidepops_common';
import Config from '../../../common/config';

export default function renderLoginSection(self: AccountSidepop, tryLogin: () => Promise<void>) 
{
	return <section>
		<h1 key={'login_h'} className='fader-in'>Log in to your account</h1>
		<input key='login_username' className='fader-in' type='text' placeholder='Username' 
			ref={el => self.username_input = el} onKeyDown={e => {
				if(e.keyCode === 13 && self.password_input)
					self.password_input.focus();
			}} onChange={removeWhitechars} maxLength={Config.MAX_LOGIN_LENGTH} name='username'/>
		<input key='login_password' className='fader-in' type='password' placeholder='Password' 
			ref={el => self.password_input = el} style={offsetTop}
			onKeyDown={e => {
				if(e.keyCode === 13)
					tryLogin();
			}} onChange={removeWhitechars} maxLength={Config.MAX_PASSWORD_LENGTH} 
			name='password' />
		<button key='login_btn' className='fader-in' style={offsetTop} 
			onClick={tryLogin}>LOG IN</button>
		<hr />
		<label key='no_acc_label' className='fader-in'>No account yet?</label>
		<br/>
		<button key='register_view_btn' className='fader-in' style={offsetTop} 
			onClick={() => {
				self.setState({
					//register_view: true, 
					view: VIEWS.REGISTER,
					error: undefined, 
					loading: false, 
					verify_info: false
				});
			}}>REGISTER</button>
	</section>;
}