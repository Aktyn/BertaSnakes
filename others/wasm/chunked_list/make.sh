#!/bin/bash
#128 MB of memory
em++ --bind --std=c++11 -O3 -Wall chunked_list.cpp -s WASM=1 -s BINARYEN_ASYNC_COMPILATION=1 -s "BINARYEN_METHOD='native-wasm'" -s TOTAL_MEMORY=134217728 -s EXTRA_EXPORTED_RUNTIME_METHODS="['addOnPostRun']" -o cpp_libs.js