///<reference path="utils.ts"/>
///<reference path="bg.tsx"/>
///<reference path="webpage.tsx"/>

$$.onPageLoaded(() => {
	$$.runAsync(runBackground);
	ReactDOM.render(<WebPage />, document.body);

	//additional toys
	var type_str = ""; 
	window.addEventListener('keydown', e => {
		if(!e || !e.key) return;
		type_str += e.key.toLowerCase();
		if( !"tetris".startsWith(type_str) &&
			!"fractal".startsWith(type_str) && 
			!"gameoflife".startsWith(type_str)) 
		{
			type_str = "";
		}
		/*if(type_str === 'tetris')
			$$.loadScript('egg/tetris.js', true);
		else if(type_str === 'fractal')
			$$.loadScript('egg/egg.js', true);
		else */
		if(type_str === 'gameoflife')
			$$.loadScript('egg/game_of_life.js', true);
	}, false);

	//$$.loadScript('egg/game_of_life.js', true);
});

