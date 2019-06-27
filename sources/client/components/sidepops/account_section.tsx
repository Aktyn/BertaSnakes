import * as React from 'react';
import AccountSidepop, {VIEWS} from './account_sidepop';
import Account, {AccountSchema} from '../../account';
import {offsetTop, removeWhitechars} from './sidepops_common';
import Config from '../../../common/config';
import ServerApi from '../../utils/server_api';

function renderVerificationPrompt(self: AccountSidepop, account: AccountSchema,
	tryVerify: () => Promise<void>, tryResendVerificationCode: () => Promise<void>) {
	return <>
		<hr/>
		<h2 key='not_verified_label' className='error fader-in'>Account is not verified</h2>
		<div key='verification_panel' className='fader-in'>
			<input type='text' placeholder='VERIFICATION CODE' style={{textAlign: 'center'}}
				ref={el => self.verification_code_input = el} onChange={removeWhitechars} />
			<button style={offsetTop} onClick={tryVerify}>VERIFY</button>
			{self.state.verification_resend ? 
				<div className='success' style={offsetTop}>
					Verification code has been sent. Expect an email soon.
				</div>
				:
				<>
					<p>No code?</p>
					<button onClick={tryResendVerificationCode}>RESEND VERIFICATION CODE</button>
					<div style={{marginTop: '5px'}}>
						Code will be sent to given email: {account.email}</div>
				</>
			}
		</div>
		<hr/>
	</>;
}

function renderAccountData(self: AccountSidepop, account: AccountSchema) {
	return <>
		<hr/>
		{self.state.verify_info &&
			<h2 key='verified_label' className='success fader-in'>Verification successful</h2>}
		<div key='account_email' className='fader-in account-details'>
			<label>Email:</label>
			<div>{account.email}</div>
			
			<label>Registered since:</label>
			<div>{new Date(account.creation_time).toLocaleDateString()}</div>

			<label>Rank:</label>
			<div>{account.rank}</div>

			<label>Level:</label>
			<div>{account.level}</div>

			<label>Experience:</label>
			<div>{account.exp}</div>

			<label>Coins:</label>
			<div>{account.coins}</div>

			<label>TODO:</label>
			<div>ships and skills choicers as separate components (it will take some space)</div>
		</div>
		<nav key='other_views' className='user-views-selector fader-in' style={{
			gridTemplateColumns: '1fr 1fr 1fr',
			maxWidth: '350px',
			...offsetTop
		}}>
			<button onClick={() => self.setState({view: VIEWS.SHOP})}>SHOP</button>
			<button onClick={() => self.setState({view: VIEWS.FRIENDS})}>FRIENDS</button>
			<button onClick={() => self.setState({view: VIEWS.GAMES})}>GAMES</button>
		</nav>
		<hr/>
	</>;
}

export default function renderAccountSection(self: AccountSidepop, account: AccountSchema,
	clearAvatar: () => void, uploadAvatar: (clear?: boolean) => Promise<void>,
	tryVerify: () => Promise<void>, tryResendVerificationCode: () => Promise<void>) 
{
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
						onClick={clearAvatar}>CLEAR</button> 
					:
					<button className='avatar-select-btn' 
						onClick={() => uploadAvatar()}>
						UPLOAD<br/>({Config.MAXIMUM_IMAGE_FILE_SIZE/1024/1024}MB&nbsp;>)
					</button>
				}
			</div>
		</h1>
		{account.verified ? 
			renderAccountData(self, account) : 
			renderVerificationPrompt(self, account, tryVerify, tryResendVerificationCode)}
		<button key='logout-btn' className='fader-in' onClick={() => {
			Account.logout();
		}}>LOG OUT</button>
	</section>;
}