//disable logs and errors in production
if(process.env.NODE_ENV !== 'development') {
	console.clear();
	console.log('%cLogs disabled in production code.\n¯\\_(ツ)_/¯',
		'color: #f44336; font-weight: bold; font-size: 25px;');
	console.log = console.error = console.info = console.trace = console.warn = function(){};
}

import * as React from 'react';
import { render } from 'react-dom';
import Loadable from 'react-loadable';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Config from '../common/config';

import './styles/main.scss';

import Loader from './components/widgets/loader';

import Layout from './components/layout';
import Home from './pages/home';
import Rankings from './pages/rankings';
import GameDetails from './pages/game_details';
import UserDetails from './pages/user_details';

function __async(_loader: () => any) {
	return Loadable({
		loader: _loader,
		loading: Loader
	});
}

const Game = __async(() => import(/* webpackChunkName: "game", webpackPrefetch: true */ './game/core'));
const Gallery = __async(() => import(/* webpackChunkName: "gallery", webpackPrefetch: true */ './pages/gallery'));

function NotFound() {
	return <div><p>SORRY<br/>REQUESTED PAGE WAS NOT FOUND</p></div>;
}

class LayoutRoutes extends React.Component<any, {compactHeader: boolean}> {
	state = {
		compactHeader: false
	};
	
	componentDidMount() {
		if(this.props.location.pathname.length > 1)
			this.setState({compactHeader: true});
	}
	
	componentDidUpdate(prevProps: any) {
		//routed
		if(this.props.location.pathname !== prevProps.location.pathname)
			this.setState({compactHeader: true});
	}
	
	render() {
		return <Layout compactHeader={this.state.compactHeader}>
			<Switch>
				<Route path='/' exact component={Home}/>
				<Route path='/rankings/:type/:page' component={Rankings}/>
				<Route path='/rankings/:type' component={Rankings}/>
				<Route path='/rankings' component={Rankings}/>
				<Route path='/games/:id' component={GameDetails}/>
				<Route path='/users/:id' component={UserDetails}/>
				<Route path='/gallery' component={Gallery}/>
				<Route component={NotFound}/>
			</Switch>
		</Layout>;
	}
}

document.title = Config.PAGE_TITLE;

render(<BrowserRouter>
	    <Switch>
		    <Route path='/play/:room_id' component={Game} />
			<Route path='/play' component={Game} />
			
			<Route path={'/'} component={LayoutRoutes} />
		</Switch>
	</BrowserRouter>,
    document.getElementById('page'),
);