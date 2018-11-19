/*
	Developement use - compiles website js files using google closure compiler
*/

console.log('Google Closure Compilation');

const compile = require('google-closure-compiler-js').compile;
const fs = require('fs');
const path = require('path');

/*const sources = __dirname + '/out/';

const ignored_files = [];
// const files_for_simple_compilation = ['utils.js'];

function postModify(code) {
	return '"use strict";' + code;
}

fs.readdir(sources, (err, files) => {
	files.forEach(file => {
		if( ignored_files.indexOf(file) !== -1 )
			return;//ignore
		//var run_simple = files_for_simple_compilation.indexOf(file) !== -1;
		file = path.join(sources, file);
		console.log( file );
		
		var code = fs.readFileSync(file, 'utf8' );
		//console.log(code);

		const flags = {
			jsCode: [{src: code}],
			externs: '$$',
			
			languageOut: 'ES6',
			compilationLevel: 'ADVANCED',//'SIMPLE', 'ADVANCED'
			warningLevel: 'VERBOSE'
		};
		const out = compile(flags);

		fs.writeFileSync(file, postModify(out.compiledCode), 'utf8');
	});
});*/

const source = __dirname + '/out/index.js';

var code = fs.readFileSync(source, 'utf8' );
const flags = {
	jsCode: [{src: code}],
	externs: ['React', 'ReactDOM'],
	
	languageOut: 'ES6',
	compilationLevel: 'ADVANCED',//'SIMPLE', 'ADVANCED'
	warningLevel: 'VERBOSE'
};

const out = compile(flags);

fs.writeFileSync(source, out.compiledCode, 'utf8');//write output back to source file