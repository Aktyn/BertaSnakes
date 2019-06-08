//import * as React from 'react';
import React from 'react';
import { render } from 'react-dom';
import Loadable from 'react-loadable';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import './styles/main.scss';

import Loader from './components/loader';

import Layout from './components/layout';
import Home from './pages/home';
//import Ranking from './pages/ranking';

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
			<Route path='/play' exact component={Game} />
			<Route component={NotFound} />
		</Switch>
	</BrowserRouter>,
    document.getElementById('page'),
);