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

var code = fs.readFileSync(target_file, 'utf8')
	.replace(/([^/\n]*)(var|const|let).*require\([^)]+\);/gi, '$1throw "skipping server-side code";')
	.replace(/(\ *).*require\([^)]+\);/gi, '$1//removed require function')
	.replace(/try {[^\n]*\n\ *module.exports[^;]*;\n}[^\n]*\ncatch.*/gi, '//removed server-side code')
	.replace(/\/\/\/<reference path=[^>]+>/gi, '//removed typescript reference');

process.argv.forEach(function (val) {
	if(val === '-disable-logs') {
		//disable console.log
		code = code.replace(/.use strict./i, `'use strict';
			console.log('%clogs disabled\\n¯\\\\_(ツ)_/¯', 
				'color: #f44336; font-weight: bold; font-size: 25px;');
			console.log = console.info = function() {};`);
	}
});

function onCompiled(compiled_code) {
	fs.writeFileSync(target_file, compiled_code, 'utf8');
	console.log('Compilation succesful');
}

let data = {
	//'SIMPLE_OPTIMIZATIONS', 'ADVANCED_OPTIMIZATIONS', 'WHITESPACE_ONLY',
	compilation_level: 'ADVANCED_OPTIMIZATIONS',
	js_code: code,
	output_format: 'text',
	output_info: 'compiled_code',
	use_types_for_optimization: true,//causes weird issues (functions dissapears)
	// language: 'ECMASCRIPT5_STRICT',
	language_out: 'ECMASCRIPT6_STRICT'//ECMASCRIPT6_STRICT, ECMASCRIPT5_STRICT
};

request.post({
	url: closure_compiler_url, form: data
}, (err, response, body) => {
	if(err)
		console.error(err);
	else
		onCompiled(body);//saveResult(body);
});
// onCompiled(code);