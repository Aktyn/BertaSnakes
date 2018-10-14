/*
	Developement use - compiles single game generated js file using google closure compiler
*/

console.log('Google Closure Compilation (game code)');

const compile = require('google-closure-compiler-js').compile;
const fs = require('fs');
const path = require('path');

//file containing code (this file will be replaced with compiled code)
const target_file = __dirname + '/compiled/game_compiled.js';

// const ignored_files = [];
// const files_for_simple_compilation = ['utils.js'];

function postModify(code) {
	return '"use strict";' + code;
}

try {
	var code = fs.readFileSync(target_file, 'utf8');
}
catch(e) {
	console.log(`Cannot read target file (${target_file})\n`);
	//console.error(e);
	process.exit();
}

const flags = {
	jsCode: [{src: code}],
	externs: '$$',

	languageOut: 'ES5',
	compilationLevel: 'ADVANCED',// 'SIMPLE'
	warningLevel: 'VERBOSE'
};
const out = compile(flags);

fs.writeFileSync(target_file, postModify(out.compiledCode), 'utf8');