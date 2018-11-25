///<reference path="page_navigator.ts"/>

interface LinkProps {
	type: string;//regular, user_link, game_link, forum_link
	vertical: boolean;
	href: string;
	current?: boolean;
	className: string;
	preventPropagation: boolean;
}

class Link extends React.Component<LinkProps, any> {
	static defaultProps = {
		type: 'regular',//
		vertical: false,
		className: '',
		preventPropagation: false
	};

	constructor(props: LinkProps) {
		super(props);
	}

	render() {
		switch(this.props.type) {
			case 'user_link':
			case 'game_link':
			case 'forum_link':
				return <a onClick={(e) => {
					if(this.props.preventPropagation)
						e.stopPropagation();
					PageNavigator.redirect(this.props.href);
				}} style={{
					backgroundImage: this.props.vertical ? 'url(img/icons/more_vert.png)' 
						: 'url(img/icons/more_hor.png)',
					backgroundSize: 'cover',
					display: 'inline-block',
					height: '30px',
					width: '30px'
				}} className='icon_btn'></a>;
			default:
			case 'regular':
				return <a onClick={(e) => {
						if(this.props.preventPropagation)
							e.stopPropagation();
						PageNavigator.redirect(this.props.href);
					}} 
					className={this.props.current ? 'current' : this.props.className}>
						{this.props.children}
				</a>;
		}
	}
}