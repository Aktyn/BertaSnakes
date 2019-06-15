import * as React from 'react';
import AccountSidepop from './account_sidepop';
import {offsetTop, removeWhitechars} from './sidepops_common';
import Config from '../../../common/config';

function checkPasswordsMatch(self: AccountSidepop) {
	if(!self.password_input || !self.password_confirm_input)
		return;
	if(self.password_input.value === self.password_confirm_input.value)
		self.password_confirm_input.classList.remove('incorrect');
	else
		self.password_confirm_input.classList.add('incorrect');
}

export default function renderRegisterSection(self: AccountSidepop, 
	tryRegister: () => Promise<void>) 
{
	return <section>
		<h1 key='register_h' className='fader-in'>Create new account</h1>
		<input key='register_username' className='fader-in' type='text' placeholder='Username'
			ref={el => self.username_input = el} onKeyDown={e => {
				if(e.keyCode === 13 && self.password_input)
					self.password_input.focus();
			}} onChange={removeWhitechars} maxLength={Config.MAX_LOGIN_LENGTH} />
		<input key='register_password' className='fader-in' type='password' placeholder='Password' 
			ref={el => self.password_input = el} style={offsetTop}
			onKeyDown={e => {
				if(e.keyCode === 13 && self.password_confirm_input)
					self.password_confirm_input.focus();
			}} onChange={e => {
				checkPasswordsMatch(self);
				removeWhitechars(e);
			}} maxLength={Config.MAX_PASSWORD_LENGTH} />
		<input key='register_password_confirm' className='fader-in' type='password' 
			placeholder='Confirm password' 
			ref={el => self.password_confirm_input = el} style={offsetTop}
			onKeyDown={e => {
				if(e.keyCode === 13 && self.email_input)
					self.email_input.focus();
			}} onChange={e => {
				checkPasswordsMatch(self);
				removeWhitechars(e);
			}} maxLength={Config.MAX_PASSWORD_LENGTH} />
		<input key='email_input' className='fader-in' type='email' name='email'
			placeholder='Email address' 
			ref={el => self.email_input = el} style={offsetTop}
			onKeyDown={e => {
				if(e.keyCode === 13 && self.register_btn) 
					tryRegister();
			}} onChange={removeWhitechars} maxLength={256} />
		<button key='register_btn' style={offsetTop} className='fader-in'
			ref={el => self.register_btn = el} onClick={() => tryRegister()}>CREATE</button>
	</section>;
}