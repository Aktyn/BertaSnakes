import * as React from 'react';
import { render } from 'react-dom';
import Loadable from 'react-loadable';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import './styles/main.scss';

import Loader from './components/widgets/loader';

import Layout from './components/layout';
import Home from './pages/home';
import Rankings from './pages/rankings';
import GameDetails from './pages/game_details';
import UserDetails from './pages/user_details';

//disable logs and errors in production
if(process.env.NODE_ENV !== 'development') {
	console.log('%cLogs disabled in production code.\n¯\\_(ツ)_/¯', 
		'color: #f44336; font-weight: bold; font-size: 25px;');
	console.log = console.error = console.info = console.trace = function(){};
}

function __async(_loader: () => any) {
	return Loadable({
		loader: _loader,
		loading: Loader
	});
}

function NotFound() {
	return <Layout><p>SORRY<br/>REQUESTED PAGE WAS NOT FOUND</p></Layout>;
}

const Game = __async(
	() => import(/* webpackChunkName: "game", webpackPrefetch: true */ './game/core')
);

render(
    <BrowserRouter>
    	<Switch>
			<Route path='/' exact component={Home} />
			<Route path='/play' component={Game} />
			<Route path='/rankings/:type/:page' component={Rankings} />
			<Route path='/rankings/:type' component={Rankings} />
			<Route path='/rankings' component={Rankings} />
			<Route path='/games/:id' component={GameDetails} />
			<Route path='/users/:id' component={UserDetails} />
			<Route component={NotFound} />
		</Switch>
	</BrowserRouter>,
    document.getElementById('page'),
);