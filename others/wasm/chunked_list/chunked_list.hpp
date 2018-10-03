/**
	@author: Aktyn (UmFkb3NsYXcgS3JhamV3c2tpCg==)

	Use this structure for storing data in which order of elements does not matter.
	Adding new elements is efficient.
	Iterating through every element is quite efficient but extracting single element is not.
	Removing single element from structure is quite efficient but breaks order of elements.
	Structure has "unlimited" capacity of elements.
	Because order of elements are chaotic, structure doesn't allow removing values by position (index).
	Only removing by searching matching value is implemented (not very efficient though).

	Approximate memory usage in bytes is:
		s * (n + c - (n % c))
		where: 	s = size of single element (bytes)
				n = number of elements
				c = size of single chunk

	NOTE  -	maximum size of chunk is 65535 (16 bit unsigned short)
			default size of chunk is defined as DEFAULT_CHUNK_SIZE

	EXAMPLE USAGE:
		try {
			ChunkedList<float, 512> list;
			list.insert(2.72f);
			list.insert(3.14f);
			list.removeValue(2.72f);

			for(ChunkedList<float, 512>::iterator it=list.begin(); it != list.end(); it++)
				printf("%f\n", *it);
		} catch(const ChunkedListError &e) {
			e.what();
		}
**/

#ifndef CHUNKED_LIST_H
#define CHUNKED_LIST_H

#include <stdio.h>
#include <stdlib.h>//malloc
#include <string.h>//strlen

typedef unsigned short u_short;
#ifdef __EMSCRIPTEN__//emscripten does not support 64 bit integer bindings
	#include <emscripten/bind.h>
	typedef unsigned long u_int64;
#else
	typedef unsigned long long u_int64;
#endif
typedef const u_int64& INDEX;

#define DEFAULT_VALUE_TYPE int
#define DEFAULT_CHUNK_SIZE 1024
#define DEFAULT_REMOVE_EVERY false

// #define CHL_DEBUG

#ifndef nullptr
	#define nullptr 0
#endif

struct ChunkedListError {
	public:
		ChunkedListError(const char* _message = nullptr) {
			if(_message == nullptr) {
				message = nullptr;
				return;
			}
			size_t msg_bytes = sizeof(char) * (strlen(_message) + 1);
			message = (char*)malloc( msg_bytes );
			memcpy(message, _message, msg_bytes);
		}
		ChunkedListError(const ChunkedListError& ch_err) : ChunkedListError(ch_err.message) {}

		virtual ~ChunkedListError() {
			free(message);
		}
		void what() const {
			printf("%s\n", message);
		}

		ChunkedListError& operator = (const ChunkedListError& ch_err) = default;
	private:
		char* message;
};

template<class Type = DEFAULT_VALUE_TYPE, u_short chunk_size = DEFAULT_CHUNK_SIZE> 
class ChunkedList {
	private:
		struct ChunkNode {
			ChunkNode *prev, *next;

			u_short len;
			Type* type_array;

			ChunkNode(ChunkNode* _prev = nullptr, ChunkNode* _next = nullptr) {
				prev = _prev;
				next = _next;
				len = 0;

				type_array = (Type*)malloc( u_int64(chunk_size) * (u_int64)sizeof(Type) );
			}
			virtual ~ChunkNode() {
				free(type_array);//releasing chunk memory
			}

			void insert(const Type& value) {
				//assuming that len < chunk_size
				type_array[len++] = value;
			}

			void removeLastItem() {
				len--;
			}

			bool isFull() const {
				return len == chunk_size;
			}
			bool isEmpty() const {
				return len == 0;
			}		
		};

		struct Marker {
			ChunkNode *node;
			u_short relative_index;
		};

		ChunkNode *first, *last;
		u_int64 total_length;
	public:
		class iterator {
			public:
				iterator(ChunkNode *_node, const u_short& rel_i = 0) {
					node = _node;
					relative_index = rel_i;
				}
				virtual ~iterator() {

				}

				Type& value() {
					return node->type_array[relative_index];
				}

				iterator& next() {
					relative_index ++;
					if(relative_index == node->len) {
						if(node->next) {
							node = node->next;
							relative_index = 0;
						}
					}
					return *this;
				}

				bool equals(const iterator& _in_it) const {
					return _in_it.node == this->node && _in_it.relative_index == relative_index;
				}

				//operators overloading
				const bool operator==(const iterator& _in_it) const {
					return equals(_in_it);
				}

				const bool operator!=(const iterator& _in_it) const {
					return !( _in_it == *this );
				}

				Type& operator*() {
					return value();
				}

				iterator& operator++() {//assuming node is not null
					return (*this).next();
				}

				iterator& operator++(int i) {//assuming node is not null
					return (*this).next();
				}

				iterator& operator--() {//assuming node is not null
					return (*this)+=-1;
				}

				iterator& operator--(int i) {//assuming node is not null
					return (*this)+=-1;
				}

				iterator& operator+=(int i) {//assuming node is not null
					if(i < 0 && u_short(-i) > relative_index) {
						if(node->prev == nullptr) {
							relative_index = 0;
							return *this;
						}
						node = node->prev;
						relative_index = node->len - (u_short(-i) - relative_index);
					}
					else
						relative_index += i;
					if(relative_index >= node->len) {
						if(node->next) {
							relative_index -= node->len;
							node = node->next;
						}
						else
							relative_index = node->len;
					}
					return *this;
				}
			private:
				ChunkNode *node;
				u_short relative_index;

				friend class ChunkedList;
		};

		ChunkedList() {
			first = last = nullptr;
			total_length = 0;
		}
		virtual ~ChunkedList() {//releasing memory iteratively
			clear();
		}

		const u_short getChunkSize() const {
			return chunk_size;
		}

		const u_int64& length() const {
			return total_length;
		}

		iterator begin() {
			return iterator(first);
		}

		iterator end() {
			return iterator(last, last == nullptr ? 0 : last->len);
		}

		#ifdef CHL_DEBUG
			void print() const {//NOTE - debugging works just for integer type
				ChunkNode *curr = first;
				u_int64 i = 1;
				while(curr) {
					printf("chunk %llu:\n", i++);
					for(u_short j=0; j<curr->len; j++)
						printf("%d ", curr->type_array[j]);
					printf("\n");

					curr = curr->next;
				}
			}
		#endif

		void insert(const Type& value) {
			if(first == nullptr)
				first = last = new ChunkNode();
			if(last->isFull()) {
				last = new ChunkNode(last, nullptr);
				last->prev->next = last;
			}
			
			last->insert(value);

			total_length++;
		}

		//value on given index is replacing by last value in entire structure
		//last value is then removing
		bool removeValue(const Type& value, const bool remove_every = DEFAULT_REMOVE_EVERY) {
			bool result = false;

			ChunkNode *curr = first;
			while(curr) {
				for(u_short j=0; j<curr->len; j++) {
					if(value == (const Type)curr->type_array[j]) {//value found

						curr->type_array[j] = last->type_array[last->len-1];
						last->removeLastItem();//len--
						total_length--;

						if(last->isEmpty())
							removeLastChunk();

						if(remove_every == false)
							return true;
						result = true;

					}
				}
				curr = curr->next;
			}

			return result;
		}

		void remove(const iterator& it) {
			puts("x");
			it.node->type_array[it.relative_index] = last->type_array[last->len-1];
			last->removeLastItem();//len--
			total_length--;

			if(last->isEmpty())
				removeLastChunk();
		}

		void clear() {
			ChunkNode *curr = first, *next;
			while(curr) {
				next = curr->next;
				delete curr;
				curr = next;
			}
			first = last = nullptr;
			total_length = 0;
		}

		//operators overloading
		Type& operator[] (INDEX index_of_value) {
			const Marker marker = getMarker(index_of_value);
			return marker.node->type_array[marker.relative_index];
		}
	private:
		inline const Marker getMarker(INDEX index_of_value) {
			if(index_of_value >= total_length)
				throw ChunkedListError("Index out of bounds");
			u_int64 chunk_index = index_of_value / chunk_size;
			u_short relative_index = index_of_value - chunk_index * chunk_size;//relative to chunk

			ChunkNode *curr = first;
			while(curr) {
				if(0 == chunk_index--)
					return {curr, relative_index};
				curr = curr->next;
			}

			throw ChunkedListError("Undefined behavior");
		}

		inline void removeLastChunk() {
			if(last == first) {
				//if(total_length != 0)
				//	throw ChunkedListError("Logic mismatch\n");
				delete first;
				first = last = nullptr;
				total_length = 0;
			}
			else {
				if(last->len)
					total_length -= last->len;
				last = last->prev;
				delete last->next;
				last->next = nullptr;
			}
		}
};

#endif