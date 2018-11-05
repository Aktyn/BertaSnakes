/*
	Developement use - compiles single game generated js file using google closure compiler
*/

console.log('Google Closure Compilation (game code)');

const fs = require('fs');
const path = require('path');
const request = require('request');

const closure_compiler_url = 'https://closure-compiler.appspot.com/compile';
const target_file = __dirname + '/compiled/game_compiled.js';

function postModify(code) {
	return '"use strict";' + code;
}

var code = fs.readFileSync(target_file, 'utf8');

function onCompiled(compiled_code) {
	fs.writeFileSync(target_file, compiled_code, 'utf8');
	console.log('Compilation succesful');
}

let data = {
	//'SIMPLE_OPTIMIZATIONS', 'ADVANCED_OPTIMIZATIONS', 'WHITESPACE_ONLY',
	compilation_level: 'SIMPLE_OPTIMIZATIONS',
	js_code: code,
	output_format: 'text',
	output_info: 'compiled_code',
	language_out: 'ECMASCRIPT5_STRICT'//ECMASCRIPT6_STRICT, ECMASCRIPT5_STRICT
};

request.post({
	url: closure_compiler_url, form: data
}, (err, response, body) => {
	if(err)
		console.error(err);
	else
		onCompiled(body);//saveResult(body);
});
