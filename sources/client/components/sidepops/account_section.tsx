import * as React from 'react';
import AccountSidepop, {VIEWS} from './account_sidepop';
import Account, {AccountSchema} from '../../account';
import {offsetTop, removeWhitechars} from './sidepops_common';
import Config from '../../../common/config';
import ServerApi from '../../utils/server_api';

class VerificationView extends React.Component<{self: AccountSidepop, account: AccountSchema,
	tryVerify: () => Promise<void>, tryResendVerificationCode: () => Promise<void>}, any>
{
	render() {
		return <>
			<hr/>
			<h2 key='not_verified_label' className='error fader-in'>Account is not verified</h2>
			<div key='verification_panel' className='fader-in'>
			<input type='text' placeholder='VERIFICATION CODE' style={{textAlign: 'center'}}
				ref={el => this.props.self.verification_code_input = el} onChange={removeWhitechars} />
			<button style={offsetTop} onClick={this.props.tryVerify}>VERIFY</button>
			{this.props.self.state.verification_resend ?
				<div className='success' style={offsetTop}>
					Verification code has been sent. Expect an email soon.
				</div>
				:
				<>
					<p>No code?</p>
					<button onClick={this.props.tryResendVerificationCode}>RESEND VERIFICATION CODE</button>
					<div style={{marginTop: '5px'}}>
						Code will be sent to given email: {this.props.account.email}</div>
				</>
			}
			</div>
			<hr/>
		</>;
	}
}

class AccountDataView extends React.Component<{self: AccountSidepop, account: AccountSchema}, any> {
	render() {
		let account = this.props.account;
		let exp_percent = Math.round(account.exp*100) + '%';
		return <>
			<hr/>
			{this.props.self.state.verify_info &&
				<h2 key='verified_label' className='success fader-in'>Verification successful</h2>}
			<div key='account_email' className='fader-in details-list'>
				<label>Email:</label>
				<div>{account.email}</div>
				
				<label>Registered since:</label>
				<div>{new Date(account.creation_time).toLocaleDateString()}</div>
	
				<label>Rank:</label>
				<div>{Math.round(account.rank)}</div>
	
				<label>Level:</label>
				<div>
					{account.level}
					<div className='experience-bar'><span style={{width: exp_percent}}>&nbsp;</span></div>
					({exp_percent})
				</div>
	
				<label>Coins:</label>
				<div>{account.coins}</div>
				
				<label>Total games:</label>
				<div>{account.total_games}</div>
	
				<label>TODO:</label>
				<div>ships and skills chooserers as separate components (it will take some space)</div>
			</div>
			<nav key='other_views' className='user-views-selector fader-in' style={{
				gridTemplateColumns: '1fr 1fr 1fr',
				maxWidth: '350px',
				...offsetTop
			}}>
				<button onClick={() => this.props.self.setState({view: VIEWS.SHOP})}>SHOP</button>
				<button onClick={() => this.props.self.setState({view: VIEWS.FRIENDS})}>FRIENDS</button>
				<button onClick={() => this.props.self.setState({view: VIEWS.GAMES})}
					disabled={this.props.account.total_games === 0}>GAMES</button>
			</nav>
			<hr/>
		</>;
	}
}

export default class AccountSection extends React.Component<{self: AccountSidepop, account: AccountSchema,
	clearAvatar: () => void, uploadAvatar: (clear?: boolean) => Promise<void>,
	tryVerify: () => Promise<void>, tryResendVerificationCode: () => Promise<void>}, any>
{
	render() {
		let account = this.props.account;
		let self = this.props.self;
		const no_avatar_style = account.avatar ? {
			backgroundSize: 'contain'
		} : {
			backgroundSize: '61%',
		};
		
		return <section>
			<h1 key='welcome-key' className='fader-in welcomer'>
				<span>Hello {account.username}</span>
				<div className='avatar-chooser' style={account.avatar ? {} : {
					backgroundColor: '#90A4AE',
					boxShadow: '0px 2px 4px #0008'
				}}>
					<div key={account.avatar || 'no-avatar'}
					     className='avatar' style={{
						backgroundImage: `url(${ServerApi.getAvatarPath(account.avatar)})`,
						...no_avatar_style
					}}/>
					{
						account.avatar ? <button className='avatar-select-btn'
						                         ref={el => self.clear_avatar_btn = el}
						                         onClick={this.props.clearAvatar}>CLEAR</button>
							:
							<button className='avatar-select-btn'
							        onClick={() => this.props.uploadAvatar()}>
								UPLOAD<br/>({Config.MAXIMUM_IMAGE_FILE_SIZE / 1024 / 1024}MB&nbsp;>)
							</button>
					}
				</div>
			</h1>
			{account.verified ?
				<AccountDataView {...{self, account}} /> :
				<VerificationView {...{self, account, tryVerify: this.props.tryVerify,
					tryResendVerificationCode: this.props.tryResendVerificationCode}} />}
			<button key='logout-btn' className='fader-in' onClick={() => {
				Account.logout();
			}}>LOG OUT
			</button>
		</section>;
	}
}