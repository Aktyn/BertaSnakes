///<reference path="page_navigator.ts"/>

interface RouteProps {
	path: string;
	component: typeof React.Component;
}

class ExRoute extends React.Component<RouteProps, any> {
	constructor(props: RouteProps) {
		super(props);
		console.log(props);
	}
	render() {
		throw new Error('This shouldn\'t be rendered: ' + this.props.path);
		return <div>Error</div>;
	}
}

class ExRouter extends React.Component<any, any> {
	state = {
		path: PageNavigator.getCurrentPageName()
	}

	constructor(props: any) {
		super(props);
		//$$.runAsync( () => this.setState({path: window.location.pathname}) );

		PageNavigator.onUrlChange( () => this.setState({path: PageNavigator.getCurrentPageName()}) );

		//this.findRoute = this.findRoute.bind(this);
	}

	findRoute() {
		//@ts-ignore
		var found = this.props.children.find((child: React.Component<RouteProps, any>) => {
			if(child.props.path === this.state.path || child.props.path === '*')
				return true;
		});

		if(found)
			return <found.props.component />;
		else
			return "Error 1337_404";
	}

	render() {
		return <main id='webpage'>
			{this.findRoute.bind(this)()}
		</main>
	}
}