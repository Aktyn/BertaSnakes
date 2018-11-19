///<reference path="link.tsx"/>
///<reference path="page_navigator.ts"/>


class Topbar extends React.Component<{logged_in: boolean, current: string}, {}> {
	private static MENU_LINKS: {[index: string]: string} = {
		'FORUM': '/forum',
		'RANKING': '/ranking',
		'INFO': '/info'
	};

	constructor(props: any) {
		super(props);
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
					<img className='icon_btn' style={{maxHeight: '40px'}}
						src={this.props.logged_in ? "img/account_on.png" : "img/account.png"} />
				</Link>
			</div>
		</div>;
	}
}