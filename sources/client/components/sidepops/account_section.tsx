import * as React from 'react';
import {Link} from 'react-router-dom';
import AccountSidepop, {VIEWS} from './account_sidepop';
import Account, {AccountSchema} from '../../account';
import {offsetTop, removeWhitechars} from './sidepops_common';
import Config from '../../../common/config';
import ServerApi from '../../utils/server_api';
import Social from '../../social/social';
import ShipWidget from "../widgets/ship_widget";
import RecentConversations from '../recent_conversations';
import {PLAYER_TYPES} from "../../../common/game/objects/player";
import SkillWidget, {DIRECTION} from "../widgets/skill_widget";

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

class AccountDataView extends React.Component<{
	self: AccountSidepop;
	account: AccountSchema;
	updateSetup: (ship_type: PLAYER_TYPES, skillsbar: (number | null)[]) => Promise<void>;
}, any>
{
	
	private renderAvailableShips(account: AccountSchema) {
		return account.available_ships.map((ship) => {
			let selected = ship === account.ship_type;
			return <ShipWidget key={selected ? ship + 374511 : ship} type={ship} selected={selected} onClick={() => {
				this.props.updateSetup(ship, account.skills).catch(console.error);
			}} />;
		});
	}
	
	private renderAvailableSkills(account: AccountSchema) {
		return account.available_skills.filter((skill) => {
			return account.skills.indexOf(skill) === -1;//show only those skills that are not in skillsbar
		}).map((skill) => {
			return <SkillWidget key={skill} skill={skill} onClick={() => {
				if( account.skills.indexOf(skill) !== -1 )//skill already in skillsbar
					return;
				for(let i=0; i<account.skills.length; i++) {
					if(account.skills[i] === null) {
						account.skills[i] = skill;
						this.props.updateSetup(account.ship_type, account.skills).catch(console.error);
						break;
					}
				}
			}} />;
		});
	}
	
	private renderSkillsBar(account: AccountSchema) {
		if(account.skills.length !== Config.SKILLS_SLOTS)
			return <div className='error'>Incorrect account's skillsbar length</div>;
		return account.skills.map((skill, index) => {
			return <div key={index} className={'skill-slot'}>
				<SkillWidget key={skill || 0} skill={skill}
				             onClick={widget => widget.showControls()} onPutOff={() => {
					account.skills[index] = null;
					this.props.updateSetup(account.ship_type, account.skills).catch(console.error);
				}} onMove={dir => {
					if( account.skills[index] === null )//prevent moving empty slot
						return;
					let target_i = index + (dir === DIRECTION.LEFT ? -1 : 1);
					if(target_i < 0)
						target_i += account.skills.length;
					else if(target_i >= account.skills.length)
						target_i -= account.skills.length;
					
					//swap slots
					let temp = account.skills[target_i];
					account.skills[target_i] = account.skills[index];
					account.skills[index] = temp;
					
					this.props.updateSetup(account.ship_type, account.skills).catch(console.error);
				}} />
				<span>{index + 1}</span>
			</div>;
		});
	}
	
	private renderFriendRequestsInfo() {
		let pending = Social.getPotentialFriendsList().length;
		if(pending === 0)
			return undefined;
		return <>
			<label className={'separating-label'} style={offsetTop}>
				You have {pending} pending friend request{pending > 1 ? 's' : ''}
			</label>
			<button onClick={() => this.props.self.setState({view: VIEWS.FRIENDS})}>CHECK IT</button>
		</>;
	}
	
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
			</div>
			{this.props.account.admin && <Link to={'/admin'} className={'fader-in button-style'} style={{
				display: 'inline-block',
				...offsetTop
			}}>ADMIN PANEL</Link>}
			<hr />
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
			<div className={'fader-in'} style={offsetTop}>
				<label className={'separating-label'}>Your ships</label>
				<div>{this.renderAvailableShips(account)}</div>
				
				<label className={'separating-label'} style={offsetTop}>Available skills</label>
				<div style={{minHeight: '38px'}}>{this.renderAvailableSkills(account)}</div>
				
				<label className={'separating-label'} style={offsetTop}>Skillsbar</label>
				<div>{this.renderSkillsBar(account)}</div>
			</div>
			<div className={'fader-in'}>
				<RecentConversations />
				{this.renderFriendRequestsInfo()}
			</div>
			<hr/>
		</>;
	}
}

export default class AccountSection extends React.Component<{
	self: AccountSidepop;
	account: AccountSchema;
	clearAvatar: () => void;
	uploadAvatar: (clear?: boolean) => Promise<void>;
	tryVerify: () => Promise<void>;
	tryResendVerificationCode: () => Promise<void>;
	updateSetup: (ship_type: PLAYER_TYPES, skillsbar: (number | null)[]) => Promise<void>;
}, any>
{
	render() {
		let account = this.props.account;
		let self = this.props.self;
		
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
						//...no_avatar_style
						backgroundSize: 'contain'
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
				<AccountDataView {...{self, account}} updateSetup={this.props.updateSetup} /> :
				<VerificationView {...{self, account, tryVerify: this.props.tryVerify,
					tryResendVerificationCode: this.props.tryResendVerificationCode}} />}
			<button key='logout-btn' className='fader-in' onClick={() => {
				Account.logout();
			}}>LOG OUT
			</button>
		</section>;
	}
}