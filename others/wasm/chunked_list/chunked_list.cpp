#include "chunked_list.hpp"
#include <emscripten/bind.h>

typedef ChunkedList<emscripten::val, 2048> Chunked512;

EMSCRIPTEN_BINDINGS(utils_bindings) {
  	emscripten::class_<Chunked512>("ChunkedList")
		.constructor<>()
		.function("getChunkSize", &Chunked512::getChunkSize)
		.function("length", &Chunked512::length)
		.function("begin", &Chunked512::begin)
		.function("end", &Chunked512::end)
		.function("insert", &Chunked512::insert)
		// .function("removeValue", &Chunked512::removeValue) //not supported
		.function("remove", &Chunked512::remove)
		.function("clear", &Chunked512::clear)
		;
	emscripten::class_<Chunked512::iterator>("ChunkedListIterator")
		.function("next", &Chunked512::iterator::next)
		.function("value", &Chunked512::iterator::value)
		.function("equals", &Chunked512::iterator::equals);
}