import * as React from 'react';
import {Link} from 'react-router-dom';

import StageBase, {BaseProps, BaseState} from './stage_base';
import Network from './../engine/network';

import HeaderNotifications from '../../components/header_notifications';
import UserBtn from '../../components/widgets/user_btn';
import RoomsList from '../../components/rooms_list';
import RightPanel, {MessageSchema} from '../../components/menu_right_panel';
import RoomView from './room_view';
import AccountSidepop, {VIEWS} from '../../components/sidepops/account_sidepop';

import SettingsSidepop from "../../components/sidepops/settings_sidepop";
import NotificationsIndicator from '../../components/widgets/notifications_indicator';
import Device, {EVENTS, ORIENTATION} from '../engine/device';

import '../../styles/menu_stage.scss';

const device_icon = require('../../img/icons/device.svg');

interface MenuProps extends BaseProps {
	indicate_room_deletion: boolean;
	start_game_countdown: number | null;
}

interface MenuState extends BaseState {
	account_view?: VIEWS;
	hide_rooms_list: boolean;
	show_settings: boolean;
	orientation_warning: boolean;
	force_orientation_error: boolean;
	v8_warning: boolean;
	show_fullscreen_icon: boolean;
}

export default class extends StageBase<MenuProps, MenuState> {
	private right_panel: RightPanel | null = null;
	private readonly orientation_change_listener: (orientation: ORIENTATION) => void;
	private readonly fullscreen_change_listener: (fullscreen: boolean) => void;

	state: MenuState = {
		account_view: undefined,
		hide_rooms_list: false,//effect visible only in small screen
		show_settings: false,
		orientation_warning: false,
		force_orientation_error: false,
		v8_warning: false,
		show_fullscreen_icon: false
	};

	constructor(props: MenuProps) {
		super(props);
		
		this.orientation_change_listener = this.onOrientationChange.bind(this);
		this.fullscreen_change_listener = this.onFullscreenChange.bind(this);
	}
	
	componentDidMount() {
		Device.on(EVENTS.ORIENTATION_CHANGE, this.orientation_change_listener);
		Device.on(EVENTS.FULLSCREEN_CHANGE, this.fullscreen_change_listener);
		this.onOrientationChange( Device.getOrientation() );
		
		if( !Device.isV8() )
			this.setState({v8_warning: true});
		this.onFullscreenChange( Device.isFullscreen() );
	}
	
	componentWillUnmount() {
		Device.off(EVENTS.ORIENTATION_CHANGE, this.orientation_change_listener);
		Device.off(EVENTS.FULLSCREEN_CHANGE, this.fullscreen_change_listener);
	}
	
	private onOrientationChange(orientation: ORIENTATION) {
		if( Device.isMobile() ) {
			let do_warn = orientation === ORIENTATION.PORTRAIT;
			this.setState({
				orientation_warning: do_warn,
				hide_rooms_list: do_warn || this.state.hide_rooms_list
			});
		}
	}
	
	private onFullscreenChange(fullscreen: boolean) {
		if( Device.isMobile() ) {
			this.setState({show_fullscreen_icon: !fullscreen});
		}
	}
	
	public onChatMessage(msg: MessageSchema) {
		if(this.right_panel && this.right_panel.chatHandle)
			this.right_panel.chatHandle.pushMessage(msg);
	}
	
	public onSpamWarning() {
		if(this.right_panel && this.right_panel.chatHandle)
			this.right_panel.chatHandle.spamWarning();
	}
	
	private renderInfos() {
		const info_style: React.CSSProperties = {
			fontSize: '14px',
			padding: '0px 10px'
		};
		
		return <div style={{
			marginTop: '50px'
		}}>
			<div style={info_style}>
				Choose suitable room from list on the left or create new one and invite friends to join.
			</div>
			{
				this.state.orientation_warning && <>
					<hr/>
					<div>
						<div style={info_style}>You should turn your device horizontally for better experience</div>
						<img className={'infinite-shaker'} src={device_icon} alt={'device image'} style={{
							height: '100px'
						}} /><br/>
						{this.state.force_orientation_error ?
							<span>Forcing orientation isn't available on this device</span>
							:
							<button onClick={async () => {
								Device.goFullscreen();
								if( false === await Device.setOrientation(ORIENTATION.LANDSCAPE) )
									this.setState({force_orientation_error: true});
							}}>
								FORCE LANDSCAPE ORIENTATION
							</button>}
					</div>
				</>
			}
			{
				this.state.v8_warning && <>
					<hr/>
					<div>
						<div style={info_style}>
							<div>This game is optimized for JavaScript's V8 engine.</div>
							<div>Consider using different browser like Chrome or Opera for better performance.</div>
						</div>
					</div>
				</>
			}
		</div>;
	}

	render() {
		return <div className='menu-stage'>
			<header>
				<div className={'left-side'}>
					<UserBtn user={this.props.current_user} />

					{
						this.props.current_user ?
						(!this.props.current_user.isGuest() && <>
							<button className='shop shaky-icon' style={{marginLeft: '10px'}}
								onClick={() => this.setState({account_view: VIEWS.SHOP})}/>

							<button className='friends shaky-icon' style={{marginLeft: '10px'}}
								onClick={() => this.setState({account_view: VIEWS.FRIENDS})}/>
						</>)
						: 
						<button className='glossy no-icon' style={{marginLeft: '10px'}}
							onClick={Network.reconnect}>RECONNECT</button>
					}
				</div>
				
				<div className={'social-notifications'}>
					<NotificationsIndicator />
				</div>
				
				<div className={'game-notifications'}>
					<HeaderNotifications />
				</div>
				
				<div className={'right-side'}>
					{
						this.state.show_fullscreen_icon && <>
							<button className={`fullscreen shaky-icon`} onClick={() => {
								Device.goFullscreen();
							}}/>
							<span className='separator'/>
						</>
					}
					<button className='settings shaky-icon'
					        onClick={() => this.setState({show_settings: true})}/>
					<span className='separator'/>
					<Link className='closer shaky-icon' to='/' onClick={Network.disconnect}/>
				</div>
			</header>
			<section>
				<aside className={`${this.state.hide_rooms_list ? 'hidden ' : ''}left-aside`}>
					<h1 className='info-header'>Available rooms</h1>
					<div style={{textAlign: 'right'}}>
						<button className='rooms-list-toggler glossy' onClick={() => {
							this.setState({hide_rooms_list: !this.state.hide_rooms_list});
						}}>{this.state.hide_rooms_list ? 'SHOW' : 'HIDE'}</button>
					</div>
					<div className='options'>
						<button className='glossy add' 
							onClick={Network.createRoom} style={{marginBottom: '20px'}}>CREATE</button>
						<div className={`refresh-indicator${this.props.indicate_room_deletion ? ' indicate' : ''}`}/>
					</div>
					<div className='rooms-list-container'>
						<RoomsList rooms={this.props.rooms_list} 
							current_room={this.props.current_room} />
					</div>
				</aside>
				<main>
					{
						this.props.current_room && this.props.current_user ?
							<RoomView room={this.props.current_room} current_user={this.props.current_user}
								start_game_countdown={this.props.start_game_countdown} />
						:
							this.renderInfos()
					}
				</main>
				{
					this.props.current_room && <RightPanel room={this.props.current_room}
						current_user={this.props.current_user}
						ref={el => this.right_panel = el} />
				}
			</section>
			{this.state.account_view && <AccountSidepop force_view={this.state.account_view}
			onClose={() => {
				this.setState({account_view: undefined});
				Network.requestAccountData();
			}} />}
			{this.state.show_settings && <SettingsSidepop
				onClose={() => this.setState({show_settings: false})} />}
		</div>;
	}
}