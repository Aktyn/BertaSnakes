/* jshint esversion:6 */

const Module = require('./cpp_libs.js');

Module.addOnPostRun(() => {
	setTimeout(chunked_list_test, 1000);
	setTimeout(array_test, 2000);
	//for(var it=chunked_list.begin(); !it.equals( chunked_list.end() ); it = it.next())
	//	console.log( it.value() );
});

function chunked_list_test() {
	var chunked_list = new Module.ChunkedList();

	console.time('ch512 insert');
	for(var i=0; i<100000; i++)
		chunked_list.insert(i);
	console.timeEnd('ch512 insert');

	console.time('ch512 remove');
	i=0;
	for(var it=chunked_list.begin(); !it.equals( chunked_list.end() ); it = it.next(), i++) {
		console.log(i);
		if(i%10 === 0) {
			let next = it.next();
			chunked_list.remove(it);
			it = next;
		}
	}
	console.timeEnd('ch512 remove');

	console.log(chunked_list.length());

	chunked_list.delete();
}

function array_test() {
	var arr = [];

	console.time('array push');
	for(var i=0; i<100000; i++)
		arr.push(i);
	console.timeEnd('array push');

	console.time('array remove');
	for(i=0; i<100000; i++) {
		if(i%10 === 0)
			arr.splice(i, 1);
	}
	console.timeEnd('array remove');

	console.log(arr.length);

	arr = null;
}