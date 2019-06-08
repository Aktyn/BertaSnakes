import * as React from 'react';
import {Link} from 'react-router-dom';

import StageBase, {BaseProps, BaseState, StageContext} from './stage_base';
import Network from './../engine/network';

import HeaderNotifications from './header_notifications';

import RoomView from './room_view';
import Chat from './chat';

import UserProfile, {UserProfileProps} from './popups/user_profile';

// import './../../styles/menu_stage.scss';

interface MenuState extends BaseState {
	
}

export default class extends StageBase<BaseProps, MenuState> {
	private chat: Chat | null = null;

	state: MenuState = {

	}

	constructor(props: any) {
		super(props);
	}

	public onChatMessage(from: string, is_room_msg: boolean, id: number, msg: string) {
		if(this.chat)
			this.chat.onMessage(from, is_room_msg, id, msg);
	}

	render() {
		return <StageContext.Provider value={{
			onPrivateConversation: (user) => {
				if(this.chat)
					this.chat.openBookmark(user.id, user.nick);
			},
			openPopupStage: this.props.openPopupStage
		}}><div className='menu-stage'>
			<header>
				<HeaderNotifications ref={el=>this.notifications=el} />
				<button className='account-widget' onClick={() => {
					if(this.props.openPopupStage) {
						this.props.openPopupStage(UserProfile.prototype, 
							{user: this.props.account} as UserProfileProps);
					}
				}}>{
					this.props.account ? this.props.account.nick : 'OFFLINE'
				}</button>
				<button className='glossy coin'>SHOP</button>
				<button className='glossy settings'>SETTINGS</button>
				<Link className='closer shaky-icon' to='/' onClick={Network.disconnect}></Link>
			</header>
			<aside>
				<h1>Avaible rooms</h1>
				<div className='options'>
					<button className='glossy add' onClick={Network.createRoom}>
						CREATE
					</button>
				</div>
				<div className='rooms_list'>
					<table>
						<tbody>
							{this.props.rooms_list.map((room, i) => {
								let is_current = this.props.room && this.props.room.id === room.id;
								return <tr key={i} onClick={()=>Network.joinRoom(room.id)}
										className={is_current ? 'current' : ''}>
									<td>{room.name}</td>
									<td>{room.getTakenSits()}/{room.sits.length}</td>
									<td>{room.duration} min</td>
									<td>{room.map}</td>
									<td>{room.gamemode}</td>
								</tr>;
							})}
						</tbody>
					</table>
				</div>
				<hr style={{marginBottom: '0px'}}/>
				<Chat ref={el => this.chat = el} room={this.props.room} />
			</aside>
			<main>
				{this.props.room && <RoomView room={this.props.room} account={this.props.account} />}
			</main>
		</div></StageContext.Provider>;
	}
}