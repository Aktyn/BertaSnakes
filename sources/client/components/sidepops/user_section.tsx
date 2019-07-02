import * as React from 'react';
import ERROR_CODES from "../../../common/error_codes";
import Loader from '../widgets/loader';
import ServerApi from '../../utils/server_api';
import {PublicAccountSchema} from '../../../server/database';

import '../../styles/user_section.scss';
import {offsetTop} from "./sidepops_common";
import GamesSection from "./games_section";
import SharePanel from "./share_panel";

interface UserSectionProps {
	onError: (code: ERROR_CODES) => void;
	onGamesListToggle?: () => void;
	account_id: string;
	container_mode: boolean;
}

interface UserSectionState {
	loading: boolean;
	user: PublicAccountSchema | null;
	show_games: boolean;
}

export default class UserSection extends React.Component<UserSectionProps, UserSectionState> {
	static defaultProps: Partial<UserSectionProps> = {
		container_mode: false
	};
	
	state: UserSectionState = {
		loading: true,
		user: null,
		show_games: false
	};
	
	async componentDidMount() {
		try {
			this.setState({loading: true});
			if(false === await ServerApi.pingServer())
				return this.props.onError( ERROR_CODES.SERVER_UNREACHABLE );

			let res = await ServerApi.postRequest('/get_user_public_data', {
				account_id: this.props.account_id
			});
			if (res.error !== ERROR_CODES.SUCCESS)
				return this.props.onError( res.error );
			//console.log(res);
			if(res.data)
				this.setState({user: res.data, loading: false});
		}
		catch(e) {
			console.error(e);
			this.props.onError( ERROR_CODES.UNKNOWN );
		}
	}
	
	componentDidUpdate(prevProps: Readonly<UserSectionProps>, prevState: Readonly<UserSectionState>) {
		if(this.props.onGamesListToggle && prevState.show_games !== this.state.show_games)
			this.props.onGamesListToggle();
	}
	
	public canReturn() {
		return this.state.show_games;
	}
	
	public return() {
		if(this.state.show_games)
			this.setState({show_games: false});
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
	
	render() {
		if(this.state.show_games && this.state.user) {
			return <GamesSection onError={this.props.onError} account={this.state.user}
				total_games={this.state.user.total_games} container_mode={this.props.container_mode}/>;
		}
		return <section className={'user-section'}>
			{this.state.loading && <Loader color='#ef5350' />}
			{this.state.user && UserSection.renderUserDetails(this.state.user)}
			<div className={'fader-in'} style={offsetTop}>
				<button onClick={() => this.setState({show_games: true})}>GAMES</button>
			</div>
			{!this.props.container_mode && this.state.user && <>
				<hr/>
				<SharePanel link={'/users/' + this.state.user.id} />
			</>}
			<hr/>
			<div className={'fader-in'}>TODO: get friendship info and shop private chat section (but not to yourself) and request/remove friend button depending on friendship state</div>
		</section>;
	}
}