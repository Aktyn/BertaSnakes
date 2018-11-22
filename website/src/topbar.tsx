///<reference path="link.tsx"/>
///<reference path="page_navigator.ts"/>
///<reference path="session.ts"/>

class Topbar extends React.Component<{logged_in: boolean, current: string}, {}> {
	private static MENU_LINKS: {[index: string]: string} = {
		'FORUM': '/forum',
		'RANKING': '/ranking',
		'INFO': '/info'
	};

	constructor(props: any) {
		super(props);
	}

	getAvatarPath() {
		if(this.props.logged_in) {
			//console.log(Session.getData().AVATAR);
			var avatar = Session.getData().AVATAR;
			if(avatar === null)
				return 'img/no_avatar.png';
			return '/avatars/' + Session.getData().AVATAR;
		}
		else
			return 'img/account.png';
	}

	render() {
		return <div id='topbar'>
			<div className='topbar_side' style={{textAlign: 'left'}}>
				<Link href='/'>
					<img src='/img/icons/logo.png' style={{verticalAlign: 'bottom'}} />
				</Link>
			</div>
			
			<div className='links'>
				<a href='play' target='_self'>PLAY</a>
				{Object.keys(Topbar.MENU_LINKS).map(link_name => {
					return <Link href={Topbar.MENU_LINKS[link_name]} 
						current={this.props.current === Topbar.MENU_LINKS[link_name]}>
						{link_name}
					</Link>;
				})}
			</div>
			
			<div className='topbar_side'>
				<Link href={this.props.logged_in ? "/account" : "/login"}>
					<img className='icon_btn' style={{
						maxHeight: '40px', 
						maxWidth: '40px', 
						marginBottom: '5px',
						opacity: 1
					}} src={this.getAvatarPath()} />
				</Link>
			</div>
		</div>;
	}
}