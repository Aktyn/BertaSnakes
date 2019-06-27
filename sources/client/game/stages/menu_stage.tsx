import * as React from 'react';
import {Link} from 'react-router-dom';

import StageBase, {BaseProps, BaseState} from './stage_base';
import Network from './../engine/network';

import HeaderNotifications from '../../components/header_notifications';
import UserBtn from '../../components/user_btn';
import RoomsList from '../../components/rooms_list';
import RightPanel, {MessageSchema} from '../../components/menu_right_panel';
import RoomView from './room_view';
import AccountSidepop, {VIEWS} from '../../components/sidepops/account_sidepop';

import '../../styles/menu_stage.scss';

interface MenuProps extends BaseProps {
	indicate_room_deletion: boolean;
	start_game_countdown: number | null;
}

interface MenuState extends BaseState {
	account_view?: VIEWS;
	hide_rooms_list: boolean;
}

export default class extends StageBase<MenuProps, MenuState> {
	private right_panel: RightPanel | null = null;

	state: MenuState = {
		account_view: undefined,
		hide_rooms_list: true//effect visible only in small screen
	};

	constructor(props: MenuProps) {
		super(props);
	}

	public onChatMessage(msg: MessageSchema) {
		if(this.right_panel)
			this.right_panel.pushMessage(msg);
	}

	render() {
		return <div className='menu-stage'>
			<header>
				<div style={{justifySelf: 'left'}}>
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

				<HeaderNotifications />
				
				<div style={{justifySelf: 'right'}}>
					<button className='settings shaky-icon'/>
					<span className='separator'/>
					<Link className='closer shaky-icon' to='/' onClick={Network.disconnect}/>
				</div>
			</header>
			<section>
				<aside className={`${this.state.hide_rooms_list ? 'hidden ' : ''}left-aside`}>
					<h1 className='info-header'>Avaible rooms</h1>
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
					{this.props.current_room && this.props.current_user && <RoomView 
						room={this.props.current_room} current_user={this.props.current_user}
						start_game_countdown={this.props.start_game_countdown} />}
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
		</div>;
	}
}