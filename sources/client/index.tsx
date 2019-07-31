//disable logs and errors in production (deprecated since adding 'drop_console' option in webpack's uglify plugin)
/*if(process.env.NODE_ENV !== 'development') {
	console.clear();
	console.log('%cLogs disabled in production code.\n¯\\_(ツ)_/¯',
		'color: #f44336; font-weight: bold; font-size: 25px;');
	//NOTE: table method is not included deliberately
	console.log = console.error = console.info = console.trace = console.warn = function(){};
}*/

import Loader from './components/widgets/loader';

import * as React from 'react';
import { render } from 'react-dom';
import Loadable from 'react-loadable';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Config from '../common/config';
import ServerApi from './utils/server_api';
import SwManager from './sw_manager';

import './styles/main.scss';

import Layout from './components/layout';
import NotFound from './pages/not_found';
import Home from './pages/home';
import Rankings from './pages/rankings';
import Search from './pages/search';
import GameDetails from './pages/game_details';
import UserDetails from './pages/user_details';

function __async(_loader: () => any) {
	return Loadable({
		loader: _loader,
		loading: Loader
	});
}

const Game = __async(
	() => import(/* webpackChunkName: "game", webpackPrefetch: true */ './game/core'));
const Gallery = __async(
	() => import(/* webpackChunkName: "gallery", webpackPrefetch: true */ './pages/gallery'));
const Admin = __async(
	() => import(/* webpackChunkName: "admin", webpackPrefetch: true */ './pages/admin'));
const PaymentResult = __async(
	() => import(/* webpackChunkName: "admin", webpackPrefetch: true */ './pages/payment_result'));

class LayoutRoutes extends React.Component<any, {compactHeader: boolean, online: boolean}> {
	state = {
		compactHeader: false,
		online: true
	};
	
	async componentDidMount() {
		if(this.props.location.pathname.length > 1)
			this.setState({compactHeader: true});
		
		this.checkServerOnline();
		
		SwManager.init().catch(console.error);
	}
	
	async componentDidUpdate(prevProps: any) {
		//routed
		if(this.props.location.pathname !== prevProps.location.pathname) {
			this.setState({compactHeader: true});
			this.checkServerOnline();
		}
	}
	
	private async checkServerOnline() {
		this.setState({online: await ServerApi.pingServer()});
	}
	
	render() {
		return <Layout compactHeader={this.state.compactHeader} online={this.state.online}>
			<Switch>
				<Route path='/' exact component={Home}/>
				
				<Route path='/rankings/:type/:page' component={Rankings}/>
				<Route path='/rankings/:type' component={Rankings}/>
				<Route path='/rankings' component={Rankings}/>
				
				<Route path='/search/:category/:value' component={Search}/>
				<Route path='/search/:category' component={Search}/>
				<Route path='/search' component={Search}/>
				
				<Route path='/games/:id' component={GameDetails}/>
				<Route path='/users/:id' component={UserDetails}/>
				
				<Route path={'/payment_result/:result'} component={PaymentResult}/>
				<Route path={'/payment_result'} component={PaymentResult}/>
				
				<Route path='/gallery' component={Gallery}/>
				<Route path='/admin' component={Admin}/>
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