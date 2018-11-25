/*
	Developement use - compiles website js files using google closure compiler
*/

console.log('Google Closure Compilation');

const compile = require('google-closure-compiler-js').compile;
const fs = require('fs');
const path = require('path');

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