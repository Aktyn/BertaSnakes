import * as React from 'react';
import {Link} from 'react-router-dom';

import StageBase, {BaseProps, BaseState} from './stage_base';
import Network from './../engine/network';

import HeaderNotifications from './header_notifications';

import RoomView from './room_view';

import './../../styles/menu_stage.scss';

interface MenuState extends BaseState {
	
}

export default class extends StageBase<BaseProps, MenuState> {
	state: MenuState = {

	}

	constructor(props: any) {
		super(props);
	}

	render() {
		return <div className='menu-stage'>
			<header>
				<div style={{justifySelf: 'left'}}>
					<button className='account-btn' onClick={() => {
						//TODO - open account sidepop
					}}>{
						this.props.account ? this.props.account.nick : 'OFFLINE'
					}</button>
				</div>

				<HeaderNotifications ref={el=>this.notifications=el} />
				
				<div style={{justifySelf: 'right'}}>
					<button className='shop shaky-icon'></button>
					<button className='settings shaky-icon' style={{marginLeft: '5px'}}></button>
					<span className='separator'></span>
					<Link className='closer shaky-icon' to='/' onClick={Network.disconnect}></Link>
				</div>
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
				<span>TODO - chat</span>
			</aside>
			<main>
				{this.props.room && <RoomView room={this.props.room} account={this.props.account} />}
			</main>
		</div>;
	}
}