/*
	Developement use - compiles js files using google closure compiler
*/

console.log('Google Closure Compilation');

const compile = require('google-closure-compiler-js').compile;
const fs = require('fs');
const path = require('path');

const sources = './js/';

function postModify(code) {
	return '"use strict";' + code;
}

fs.readdir(sources, (err, files) => {
	files.forEach(file => {
		file = path.join(sources, file);
		console.log( file );
		
		var code = fs.readFileSync(file, 'utf8' );
		//console.log(code);

		const flags = {
			jsCode: [{src: code}],
			
			languageOut: 'ES5',
			compilationLevel: 'ADVANCED',
			warningLevel: 'VERBOSE'
		};
		const out = compile(flags);

		fs.writeFileSync(file, postModify(out.compiledCode), 'utf8');
	});
});