import * as React from 'react';
import Loadable from 'react-loadable';
import {Link} from 'react-router-dom';
import ERROR_CODES from "../../../common/error_codes";
import ServerApi from '../../utils/server_api';
import Utils from '../../utils/utils';
import Account from '../../account';
import Loader from '../widgets/loader';
import Social, {EVENT_NAMES, FriendSchema} from '../../social/social';
import Chat from '../../social/chat';
import {AccountSchema, PublicAccountSchema} from '../../../server/database';
import {offsetTop} from "./sidepops_common";
import GamesSection from "./games_section";
import SharePanel from "./share_panel";
import PotentialFriendsTable from "./potential_friends_table";
import NotificationsIndicator, {COMMON_LABELS} from '../widgets/notifications_indicator';
import {RoomCustomData} from "../../../common/room_info";

import '../../styles/user_section.scss';

const AsyncAdminPowers = Loadable({
	loader: () => import(/* webpackChunkName: "admin_powers", webpackPrefetch: true */ './admin_powers'),
	loading: Loader,
});

interface UserSectionProps {
	onError: (code: ERROR_CODES) => void;
	onGamesListToggle?: () => void;
	account_id: string;
	container_mode: boolean;
	focus_chat: boolean;
}

interface UserSectionState {
	loading: boolean;
	user: PublicAccountSchema | null;
	account: AccountSchema | null;
	friend: FriendSchema | null;
	potential_friend: PublicAccountSchema | null;
	requested_friend: PublicAccountSchema | null;
	friend_id_to_remove?: string;
	show_games: boolean;
	show_admin_powers: boolean;
}

export default class UserSection extends React.Component<UserSectionProps, UserSectionState> {
	private readonly onFriendsUpdate: (account: AccountSchema | null) => void;
	private remove_friend_tm: NodeJS.Timeout | null = null;
	private readonly account_listener: (account: AccountSchema | null) => void;
	
	static defaultProps: Partial<UserSectionProps> = {
		container_mode: false,
		focus_chat: false
	};
	
	state: UserSectionState = {
		loading: true,
		user: null,
		account: null,
		friend: null,
		potential_friend: null,
		requested_friend: null,
		
		show_games: false,
		show_admin_powers: false//set true for testing
	};
	
	constructor(props: UserSectionProps) {
		super(props);
		
		this.onFriendsUpdate = this.updateFriends.bind(this);
		this.account_listener = this.updateAccount.bind(this);
	}
	
	async componentDidMount() {
		Social.on(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, this.onFriendsUpdate);
		Social.on(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, this.onFriendsUpdate);
		Account.addLoginListener( this.account_listener );
		
		try {
			this.setState({loading: true});
			if(false === await ServerApi.pingServer())
				return this.props.onError( ERROR_CODES.SERVER_UNREACHABLE );

			let res = await ServerApi.postRequest('/get_user_public_data', {
				account_id: this.props.account_id,
				//self_token: Account.getToken()//used for getting friendship data
			});
			if (res.error !== ERROR_CODES.SUCCESS)
				return this.props.onError( res.error );
			//console.log(res);
			if(res.data) {
				this.setState({
					user: res.data,
					account: Account.getAccount(),
					loading: false,
					friend: Social.getFriend(res.data.id) || null,
					potential_friend: Social.getPotentialFriend(res.data.id) || null,
					requested_friend: Social.getRequestedFriend(res.data.id) || null
				});
				
				NotificationsIndicator.close(COMMON_LABELS.FRIEND_REQUEST_ACCEPTED + res.data.username);
				NotificationsIndicator.close(res.data.username + COMMON_LABELS.FRIEND_REQUEST_REJECTED);
				NotificationsIndicator.close(res.data.username + COMMON_LABELS.FRIEND_REMOVED);
			}
		}
		catch(e) {
			console.error(e);
			this.props.onError( ERROR_CODES.UNKNOWN );
		}
	}
	
	componentWillUnmount() {
		Social.off(EVENT_NAMES.ON_FRIENDS_LIST_UPDATE, this.onFriendsUpdate);
		Social.off(EVENT_NAMES.ON_FRIENDS_REQUEST_UPDATE, this.onFriendsUpdate);
		Account.removeLoginListener( this.account_listener );
		
		if(this.remove_friend_tm)
			clearTimeout(this.remove_friend_tm);
	}
	
	componentDidUpdate(prevProps: Readonly<UserSectionProps>, prevState: Readonly<UserSectionState>) {
		if(this.props.onGamesListToggle && prevState.show_games !== this.state.show_games)
			this.props.onGamesListToggle();
	}
	
	private updateFriends() {
		if( !this.state.account || !this.state.user )
			return;
		NotificationsIndicator.close(this.state.user.username + COMMON_LABELS.FRIEND_REMOVED);
		this.setState({
			friend: Social.getFriend(this.state.user.id) || null,
			potential_friend: Social.getPotentialFriend(this.state.user.id) || null,
			requested_friend: Social.getRequestedFriend(this.state.user.id) || null,
		});
	}
	
	private updateAccount(account: AccountSchema | null) {
		this.setState({account});
	}
	
	public canReturn() {
		return this.state.show_games;
	}
	
	public return() {
		if(this.state.show_games)
			this.setState({show_games: false});
	}
	
	private cancelRemoveFriend() {
		this.setState({friend_id_to_remove: undefined});
		this.remove_friend_tm = null;
	}
	
	private static renderUserDetails(user: PublicAccountSchema) {
		let exp_percent = Math.round(user.exp*100) + '%';
		return <>
			<h1 className={'fader-in'}>
				<span>{user.username}</span>
				<img src={ServerApi.getAvatarPath(user.avatar)} alt={'user avatar'} />
			</h1>
			<hr/>
			<div className={'fader-in details-list bold'}>
				<label>Registered since:</label>
				<div>{new Date(user.creation_time).toLocaleDateString()}</div>
				
				<label>Last login:</label>
				<div>{new Date(user.last_login).toLocaleString('pl-PL')
					.replace(',', '')}</div>
				
				<label>Rank:</label>
				<div>{Math.round(user.rank)}</div>
				
				<label>Level:</label>
				<div>
					{user.level}
					<div className='experience-bar'><span style={{width: exp_percent}}>&nbsp;</span></div>
					({exp_percent})
				</div>
				
				<label>Total games:</label>
				<div>{user.total_games}</div>
			</div>
		</>;
	}
	
	private static renderRoomInfo(room: RoomCustomData | null, is_playing: boolean) {
		if(room === null)
			return <div>Friend is not in any room</div>;
		return <>
			<div>
				<span>{Utils.trimString(room.name, 20)}</span>
				<span className={'separator'}/>
				<span>{room.map}</span>
				<span className={'separator'}/>
				<span>{room.sits.filter(s => s).length}/{room.sits.length}</span>
				<span className={'separator'}/>
				<span>{(room.duration/60)|0}&nbsp;min</span>
				<span className={'separator'}/>
				<span>{Utils.GAMEMODES_NAMES[room.gamemode]}</span>
			</div>
			<div style={offsetTop}>{!is_playing ?
				<Link to={'/play/' + room.id} className={'button-style'}>JOIN ROOM</Link>
				:
				<span>Game started</span>
			}</div>
		</>;
	}
	
	private renderSocialSection() {
		if(!this.state.account || !this.state.user || this.state.user.id === this.state.account.id)
			return undefined;
		
		if( this.state.potential_friend ) {
			return <>
				<label>Pending friend request</label><br/>
				<PotentialFriendsTable users={[this.state.potential_friend]} show_user={false} />
			</>;
		}
		
		if( this.state.requested_friend ) {
			return <div style={{fontWeight: 'bold'}}>Friend request sent</div>;
		}
		
		if( !this.state.friend )
			return <button onClick={() => {
				if(this.state.user)
					Social.requestFriend(this.state.user.id);
			}}>SEND FRIEND REQUEST</button>;
		
		return <>
			<div style={{
				color: this.state.friend.online ? '#8BC34A' : '#e57373',
				fontWeight: 'bold'
			}}>{this.state.friend.online ? 'online' : 'offline'}</div>
			{this.state.friend.online && !(this.state.friend.room_data === null && this.state.friend.is_playing) &&
				UserSection.renderRoomInfo(this.state.friend.room_data, this.state.friend.is_playing)}
			<button style={offsetTop} onClick={() => {
				if(!this.state.user)
					return;
				if( this.state.friend_id_to_remove ) {
					Social.removeFriend(this.state.friend_id_to_remove);
					
					if(this.remove_friend_tm)
						clearTimeout(this.remove_friend_tm);
					this.cancelRemoveFriend();
				}
				else {
					this.setState({friend_id_to_remove: this.state.user.id});
					this.remove_friend_tm = setTimeout(this.cancelRemoveFriend.bind(this), 5000) as never;
				}
			}}>{this.state.friend_id_to_remove ? 'CONFIRM' : 'REMOVE FROM FRIENDS'}</button>
		</>;
	}
	
	render() {
		if(this.state.show_games && this.state.user) {
			return <GamesSection onError={this.props.onError} account={this.state.user}
				total_games={this.state.user.total_games} container_mode={this.props.container_mode}/>;
		}
		return <section className={'user-section'}>
			<div className={'user-container'}>
				{this.state.loading && <Loader color='#ef5350' />}
				{this.state.user && UserSection.renderUserDetails(this.state.user)}
				<div className={'fader-in'} style={offsetTop}>
					<button onClick={() => this.setState({show_games: true})}>GAMES</button>
				</div>
				{
					this.state.account && this.state.account.admin && !this.state.show_admin_powers &&
					<div className={'fader-in'} style={offsetTop}>
						<button onClick={() => {
							this.setState({show_admin_powers: true});
						}}>UNLEASH ADMIN'S POWERS</button>
					</div>
				}
				{this.state.show_admin_powers && this.state.user &&
					<AsyncAdminPowers user={this.state.user} onError={this.props.onError}
					                  container={this.props.container_mode} />}
				{!this.props.container_mode && this.state.user && <>
					<hr/>
					<SharePanel link={'/users/' + this.state.user.id} />
				</>}
				<hr/>
				<div className={'fader-in'}>{this.renderSocialSection()}</div>
			</div>
			{(
				this.state.account && this.state.friend && this.state.user &&
				this.state.user.id !== this.state.account.id
			) && <div className={'chat-container fader-in'} style={
				this.props.container_mode ? {marginBottom: '-9px', minHeight: '300px'} : {minHeight: '300px'}
			}>
				<Chat recipient={this.state.friend} account={this.state.account} autofocus={this.props.focus_chat}
					minHeight={300}/>
			</div>}
		</section>;
	}
}