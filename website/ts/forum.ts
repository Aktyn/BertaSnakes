///<reference path="utils.ts"/>
///<reference path="main.ts"/>

(function() {
	var body_loader: $_face | null = null;

	var category = 1, cat_page = 0, current_thread = 0, thread_page = 0;

	interface PostWidget {
		AUTHOR_NICK: string;
		AUTHOR_ID: number;
		TIME: string;
		CONTENT: string;
	}

	interface ThreadData {
		ID: number;
		SUBJECT: string;
		AUTHOR_NICK: string;
		AUTHOR_ID: number;
		TIME: string;
		TOTAL_POSTS: number;
		LAST_POST: string;
	}

	interface ThreadsInfo {
		THREADS: ThreadData[];
		total_threads: number;
		rows_per_page: number;
		page: number;
	}

	function onError(error_details?: string) {
		$$('#forum_error').addChild(
			$$.create('DIV').setStyle({
				'color': '#fff',
				'background': '#f44336',
    			'padding': '5px 20px'
			}).setText(error_details || 'FORUM ERROR')
		);
	}

	function createPostWidget(post: PostWidget) {
		return $$.create('SECTION').addChild(
			$$.create('DIV').addClass('post_header').addChild(//author
				$$.create('A').setText(post.AUTHOR_NICK).setStyle({//TODO - link to user's page
					// float: 'left',
					'marginRight': '20px'
				}).setAttrib('href', '/user/' + post.AUTHOR_ID)
			)
			.addChild(//date
				$$.create('SPAN').setText(post.TIME).setStyle({
					'float': 'right',
					'fontSize': '15px'
				})
			)
		).addChild(
			$$.create('DIV').addClass('content').setText(post.CONTENT)
		);

		//.setText(post.CONTENT);
	}

	function changeUrl(page: string, url: string) {
        if (typeof (history.pushState) != "undefined") {
            var obj = {Page: page, Url: url};
            history.pushState(obj, page, url);
            return true;
        } else {
            window.location.href = url;//support fallback
            return false;
        }
    }

	function showThread(id: number, data: ThreadsInfo) {
		let new_href = '/forum?c=' + category + '&thread=' + id + '&cat_page=' + cat_page;

		if(window.location.toString().indexOf(new_href) !== -1) {
			window.location.reload();
			return;
		}
	  	if( changeUrl('', new_href) === false)
	  		return;

	  	current_thread = id;

	  	$$('#forum_content').html('');
	  	$$('#threads_shortcuts').html('').addChild( createThreadsShortcuts( data ) );
	  	
	  	try {
		  	loadThreadContent(id);
		}
		catch(e) {
			console.error(e);
		}
	}

	function createThreadsTable(data: ThreadsInfo) {
		let table = $$.create('TABLE').setClass('threads_list').addChild(
			$$.create('TR')
				.addChild( $$.create('TH').setText('Subject') )
				.addChild( $$.create('TH').setText('Author') )
				.addChild( $$.create('TH').setText('Created') )
				.addChild( $$.create('TH').setText('Posts') )
				.addChild( $$.create('TH').setText('Last answer') )
		);

		data.THREADS.forEach(thread => {
			//console.log( thread );

			let thread_row = $$.create('TR').on('click', (e) => {
				//@ts-ignore
				if( e.target.parentNode === thread_row )//checking if current row was clicked directly
					showThread(thread.ID, data);
			})	.addChild( $$.create('TD').setText(thread.SUBJECT) )
				.addChild( $$.create('TD').setText(thread.AUTHOR_NICK).addChild(
					COMMON.makeUserLink(thread.AUTHOR_ID, true)
				) )
				.addChild( $$.create('TD').setText(thread.TIME) )
				.addChild( $$.create('TD').setText(thread.TOTAL_POSTS) )
				.addChild( $$.create('TD').setText(thread.LAST_POST) );

			table.addChild( thread_row );
		});

		if(data.total_threads > data.rows_per_page) {//at least two pages
			let pages_container = COMMON.createPagesRow(data.total_threads, data.rows_per_page, 
				data.page, '/forum?c=' + category + '&cat_page=');
			table.addChild( $$.create('TR').addChild(
				pages_container.setStyle({'textAlign': 'center'})
			) );
		}

		return table;
	}

	function createThreadsShortcuts(data: ThreadsInfo) {
		let shortcuts = $$.create('UL').setStyle({
			'maxHeight': 'calc(100vh - 55px - 50px - 1px)',
			'overflowY': 'auto'
		}).addChild(
			$$.create('DIV').setText('ANOTHER THREADS').setStyle({
				'padding': '15px 5px',
				'backgroundColor': '#26323820'
			})
		);

		data.THREADS.forEach((thread: ThreadData) => {
			/*if(thread.ID === (current_thread|0)) {
				refreshThreadSubject( thread.SUBJECT );
				return;
			}*/

			let li = $$.create('LI').setText( thread.SUBJECT )
				.setAttrib('id', 'thread_shortcut_' + thread.ID).on('click', 
				() => {
					if(thread.ID !== (current_thread|0)) {
						thread_page = 0;
						showThread(thread.ID, data);
					}
				});
			
			if(thread.ID === (current_thread|0))
				li.addClass('current');

			shortcuts.addChild( li );
		});
		
		//'/forum?c=' + category + '&thread=' + current_thread + 
		//'&th_page=' + thread_page + '&cat_page='
		if(data.total_threads > data.rows_per_page) {//at least two pages
			let pages_container = COMMON.createPagesRow(data.total_threads, data.rows_per_page, 
				data.page, (cat_page_id) => {
					if(changeUrl('', '/forum?c=' + category + '&thread=' + current_thread + 
						'&cat_page=' + cat_page_id + '&th_page=' + thread_page) === false)
					return;
					cat_page = cat_page_id;
					loadCategory(category);
				});
			shortcuts.addChild( $$.create('DIV').setStyle({
				'height': '40px',
				'padding': '10px',
				'display': 'grid',
				// textAlign: 'center'
			}).addChild(
				pages_container.setStyle({'textAlign': 'center'})
			) );
		}
		

		return shortcuts;
	}

	function submitAnswer(area: $_face) {
		let text = area.value.trim();

		if(text.length < 3)
			return $$('#forum_error').setText('Your answer should be at least 3 charactes long');
		//console.log(text);

		$$('#forum_error').setText('Submiting an answer...');
		area.value = '';//clear

		$$.postRequest('/submit_answer_request', {content: text, thread: current_thread}, raw_res => {
			if(raw_res === undefined)
				return;
			//console.log(res);
			var res = JSON.parse(raw_res);

			if(res.result !== 'SUCCESS') {
				switch(res.result) {
					default: 
						$$('#forum_error').setText('Cannot submit answer');
						break;
					case 'NO_SESSION':
						$$('#forum_error').setText('You are not logged in');
						break;
				}

				return;
			}

			$$('#forum_error').setText('');

			loadThreadContent(current_thread, () => {
				$$('#forum_content').scrollTop = 
					$$('#forum_content').scrollHeight + $$('#forum_content').getHeight();
			});
		});

		return;
	}

	function submitThread(subject_input: $_face, input_area: $_face) {
		let subject = subject_input.value.trim();
		let content = input_area.value.trim();

		if(subject.length < 3)
			return $$('#forum_error').setText('Subject should be at least 3 charactes long');
		if(content.length < 3)
			return $$('#forum_error').setText('Content should be at least 3 charactes long');

		$$('#forum_error').setText('Creating thread...');

		subject_input.value = '';
		input_area.value = '';

		$$.postRequest('/create_thread_request', 
			{category: category, subject: subject, content: content}, raw_res => {

			if(raw_res === undefined)
				return;

			var res = JSON.parse(raw_res);
			//console.log(res);

			if(res.result !== 'SUCCESS') {
				switch(res.result) {
					default: 
						$$('#forum_error').setText('Cannot create thread');
						break;
					case 'NO_SESSION':
						$$('#forum_error').setText('You are not logged in');
						break;
				}
				return;
			}

			let new_href = '/forum?c=' + category + '&thread=' + res.ID;
			//changeUrl('', new_href);
			window.location.href = new_href;//reload page
		});

		return;//typescript was complaining about returning paths
	}

	function openThreadCreator() {
		$$('#threads_shortcuts').html('');

		var input_area = $$.create('TEXTAREA');//document.createElement('TEXTAREA');
		input_area.placeholder = 'Type first post content';
		input_area.setAttrib('maxlength', 2048);

		var subject_input = $$.create('INPUT').setAttrib('placeholder', 'Fill the subject')
			.setAttrib('id', 'subject_input').setAttrib('maxlength', 256);

		$$('#forum_content').html('').addChild(
			$$.create('DIV').addChild( subject_input )
		).addChild(
			$$.create('DIV').setStyle({'display': 'grid'}).addChild( input_area )
		).addChild(
			$$.create('DIV').addChild(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
					.addClass('answer_btn').addClass('iconic_blue').setText('CONFIRM THREAD CREATION')
					.on('click', () => submitThread(subject_input, input_area) )
			)
		);
	}

	function loadThreadContent(id: number, onload? : () => any) {
		let content = $$('#forum_content');

		content.html('').addChild( body_loader = COMMON.createLoader('#f4f4f4') );

		$$.postRequest('/thread_content_request', {thread: id, page: thread_page}, raw_res => {
			if(body_loader)
				body_loader.remove();

			if(raw_res === undefined)
				return;

			var res = JSON.parse(raw_res);

			content.addChild( 
				$$.create('H1').setAttrib('id', 'thread_subject').setText(res.SUBJECT).addChild(
		  			$$.create('IMG').setAttrib('src', '/img/icons/arrow.png')
		  				.addClass('icon_btn').setStyle({
			  				'height': '30px',
			  				'width': 'auto',
			  				'float': 'right',
			  				'marginRight': '10px'
			  			}).on('click', () => {
			  				$$('#forum_content').scrollTop = 
								$$('#forum_content').scrollHeight + $$('#forum_content').getHeight();
			  			})
		  		)
			);

			//console.log(res);

			if(res.result !== 'SUCCESS')
				return onError();

			res.POSTS.forEach((post: PostWidget) => {
				content.addChild( createPostWidget(post) );
			});

			var is_last_page = res.page+1 === Math.ceil(res.total_posts / res.rows_per_page);

			//pages widget
			if(res.total_posts > res.rows_per_page) {//at least two pages
				let pages_container = COMMON.createPagesRow(res.total_posts, res.rows_per_page, 
					res.page, (page_id) => {
						if(changeUrl('', '/forum?c=' + category + '&thread=' + current_thread + 
								'&cat_page=' + cat_page + '&th_page=' + page_id) === false)
							return;
						thread_page = page_id;
						loadThreadContent(current_thread);
					});
				content.addChild( $$.create('DIV').setStyle({
					'padding': '20px',
					'display': 'grid'
				}).addChild(
					pages_container.setStyle({'textAlign': 'center'})
				) );
			}

			if(is_last_page === true) {
				var input_area = $$.create('TEXTAREA');//document.createElement('TEXTAREA');
				input_area.placeholder = 'Type your answer here';
				input_area.setAttrib('maxlength', 2048);

				content.addChild(
					$$.create('DIV').setStyle({'display': 'grid'}).addChild( input_area )
				).addChild(
					$$.create('DIV').addChild(
						$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
							.addClass('answer_btn').addClass('iconic_blue').setText('SUBMIT AN ANSWER')
							.on('click', () => submitAnswer( input_area ) )
					)
				);
			}

			if(typeof onload === 'function')
				onload();
		});
	}

	//get topics from given category sorted from newest to oldest
	function loadCategory(category: number) {
		if(current_thread)
			$$('#threads_shortcuts').addChild( body_loader = COMMON.createLoader('#f4f4f4') );
		else
			$$('#forum_content').addChild( body_loader = COMMON.createLoader('#f4f4f4') );

		$$.postRequest('/threads_request', {category: category, page: cat_page}, raw_res => {
			if(body_loader)
				body_loader.remove();

			if(raw_res === undefined)
				return;

			var res = JSON.parse(raw_res);
			//console.log(res);
			
			if(res.result !== 'SUCCESS')
				return onError();

			if(res.THREADS.length === 0) {
				$$('#forum_content').addChild(
					$$.create('DIV').setText('No threads in this category').setStyle({
						'padding': '20px 0px'
					})
				);
				return;
			}

			if(current_thread)
				$$('#threads_shortcuts').html('').addChild( createThreadsShortcuts(res) );
			else
				$$('#forum_content').addChild( createThreadsTable(res) );
		});
	}

	$$.load(() => {
		$$("#topbar").getChildren('a[href="forum"]').addClass('current');//highlight topbar bookmark
		
		//@ts-ignore
		try { category = Number(location.href.match(/[\?&]c=([0-9]+)/i)[1]); } catch(e) {}
		//@ts-ignore
		try { cat_page = Number(location.href.match(/[\?&]cat_page=([0-9]+)/i)[1]); } catch(e) {}
		//@ts-ignore
		try { current_thread = Number(location.href.match(/[\?&]thread=([0-9]+)/i)[1]); } catch(e) {}
		//@ts-ignore
		try { thread_page = Number(location.href.match(/[\?&]th_page=([0-9]+)/i)[1]); } catch(e) {}

		$$('a[href="forum?c=' + category + '"').addClass('current');

		if(current_thread) 
			loadThreadContent(current_thread, () => loadCategory(category));
		else
			loadCategory(category);

		window.addEventListener('popstate', () => location.reload(), false);

		$$('#thread_create_btn').on('click', openThreadCreator);
	});
})();