import * as React from 'react';
import {offsetTop, removeWhitechars} from './sidepops_common';
import ServerApi from '../../utils/server_api';
import Config from '../../../common/config';
import ERROR_CODES, {errorMsg} from "../../../common/error_codes";

function checkPasswordsMatch(self: PasswordResetSection) {
	if(!self.password_input || !self.password_confirm_input)
		return;
	if(self.password_input.value === self.password_confirm_input.value)
		self.password_confirm_input.classList.remove('incorrect');
	else
		self.password_confirm_input.classList.add('incorrect');
}

const success_style: React.CSSProperties = {
	fontWeight: 'bold',
	color: '#8BC34A',
	...offsetTop
};

interface PasswordResetProps {
	onError: (msg?: string) => void;
	onBackToLogin: () => void;
}

interface PasswordResetState {
	code_send_success: boolean;
	code_send_loading: boolean;
	password_reset_success: boolean;
}

export default class PasswordResetSection extends React.Component<PasswordResetProps, PasswordResetState> {
	private email_input: HTMLInputElement | null = null;
	public password_input: HTMLInputElement | null = null;
	public password_confirm_input: HTMLInputElement | null = null;
	private reset_code_input: HTMLInputElement | null = null;
	
	state: PasswordResetState = {
		code_send_success: false,
		code_send_loading: false,
		password_reset_success: false
	};
	
	constructor(props: PasswordResetProps) {
		super(props);
	}
	
	async trySendPasswordResetCode() {
		if(!this.email_input)
			return;
		this.props.onError(undefined);
		this.setState({code_send_loading: true});
		
		let email = this.email_input.value;
		
		if( !email.match(/[^@]+@[a-z0-9]+\.[a-z0-9]+/i) ) {
			this.email_input.focus();
			return this.props.onError('Email address is not correct');
		}
		
		try {
			let res = await ServerApi.postRequest('/request_password_reset_code', {
				email
			});
			
			if (res.error !== ERROR_CODES.SUCCESS) {
				this.props.onError(errorMsg(res.error));
				this.setState({code_send_loading: false});
			}
			else
				this.setState({code_send_success: true, code_send_loading: false});
		}
		catch(e) {
			this.setState({code_send_loading: false});
			this.props.onError(errorMsg(ERROR_CODES.SERVER_UNREACHABLE));
		}
	}
	
	async tryResetPassword() {
		if(!this.reset_code_input || !this.password_input || !this.password_confirm_input)
			return;
		let password = this.password_input.value;
		
		if(password.length < Config.MIN_PASSWORD_LENGTH) {
			this.password_input.focus();
			return this.props.onError('Password must be at least 6 characters long');
		}
		if(password !== this.password_confirm_input.value) {
			this.password_confirm_input.focus();
			return this.props.onError('Passwords does not match');
		}
		
		let code = this.reset_code_input.value;
		console.log('password reset code:', code);
		
		try {
			let res = await ServerApi.postRequest('/reset_password', {
				new_password: password,
				reset_code: code
			});
			
			if (res.error !== ERROR_CODES.SUCCESS)
				this.props.onError(errorMsg(res.error));
			else
				this.setState({password_reset_success: true});
		}
		catch(e) {
			this.props.onError(errorMsg(ERROR_CODES.SERVER_UNREACHABLE));
		}
	}
	
	render() {
		return <section>
			<label key={'reset_label'} className='fader-in'
			       style={offsetTop}>Type an email used to register your account</label>
			<input key='reset_email_input' className='fader-in' type='email' name='email'
			       placeholder='Email address'
			       ref={el => this.email_input = el} style={offsetTop}
			       onKeyDown={e => {
				       if (e.keyCode === 13)
					       this.trySendPasswordResetCode().catch(console.error);
			       }} onChange={removeWhitechars} maxLength={256}/>
			<button key={'reset_code_btn'} className='fader-in' style={offsetTop} onClick={() => {
				this.trySendPasswordResetCode().catch(console.error);
			}}>SEND PASSWORD RESET CODE</button>
			{this.state.code_send_loading && <div style={offsetTop}>Sending...</div>}
			{this.state.code_send_success &&
				<div className={'fader-in'} style={success_style}>Code sent, check your email inbox.</div>}
			
			<hr/>
			
			<input key='reset_password' className='fader-in' type='password' placeholder='New password'
			       ref={el => this.password_input = el} style={offsetTop}
			       onKeyDown={e => {
				       if (e.keyCode === 13 && this.password_confirm_input)
					       this.password_confirm_input.focus();
			       }} onChange={e => {
				checkPasswordsMatch(this);
				removeWhitechars(e);
			}} maxLength={Config.MAX_PASSWORD_LENGTH}/>
			<input key='reset_password_confirm' className='fader-in' type='password'
			       placeholder='Confirm new password'
			       ref={el => this.password_confirm_input = el} style={offsetTop}
			       onKeyDown={e => {
				       if (e.keyCode === 13 && this.reset_code_input)
					       this.reset_code_input.focus();
			       }} onChange={e => {
				checkPasswordsMatch(this);
				removeWhitechars(e);
			}} maxLength={Config.MAX_PASSWORD_LENGTH}/>
			<input key={'reset_code_input'} className='fader-in' type='text' placeholder='Reset code'
				onChange={removeWhitechars} onKeyDown={e => {
					if(e.keyCode === 13)
						this.tryResetPassword().catch(console.error);
				}} ref={el => this.reset_code_input = el}  style={offsetTop}/>
				
			<button className={'fader-in'} style={offsetTop}
			        onClick={this.tryResetPassword.bind(this)}>RESET PASSWORD</button>
			{this.state.password_reset_success && <>
				<div className={'fader-in'} style={success_style}>Reset successful.<br/>
					You can now login with your new password.</div>
				<button className={'fader-in'} style={offsetTop} onClick={() => {
					this.props.onBackToLogin();
				}}>BACK TO LOGIN</button>
			</>}
		</section>;
	}
}