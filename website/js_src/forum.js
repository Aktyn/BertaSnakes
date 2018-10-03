(function() {
	'use strict';

	var body_loader = null;

	var category = 1, cat_page = 0, current_thread = 0, thread_page = 0;

	function onError(error_details) {
		$$('#forum_error').append(
			$$.create('DIV').setStyle({
				color: '#fff',
				background: '#f44336',
    			padding: '5px 20px'
			}).setText(error_details || 'FORUM ERROR')
		);
	}

	function createPostWidget(post) {
		return $$.create('SECTION').append(
			$$.create('DIV').addClass('post_header').append(//author
				$$.create('A').setText(post.AUTHOR_NICK).setStyle({//TODO - link to user's page
					// float: 'left',
					marginRight: '20px'
				}).attribute('href', '/user/' + post.AUTHOR_ID)
			)
			.append(//date
				$$.create('SPAN').setText(post.TIME).setStyle({
					float: 'right',
					fontSize: '15px'
				})
			)
		).append(
			$$.create('DIV').addClass('content').setText(post.CONTENT)
		);

		//.setText(post.CONTENT);
	}

	function changeUrl(page, url) {
        if (typeof (history.pushState) != "undefined") {
            var obj = {Page: page, Url: url};
            history.pushState(obj, page, url);
            return true;
        } else {
            window.location.href = url;//support fallback
            return false;
        }
    }

	function showThread(id, data) {
		let new_href = '/forum?c=' + category + '&thread=' + id + '&cat_page=' + cat_page;

		if(window.location.toString().indexOf(new_href) !== -1) {
			window.location.reload();
			return;
		}
	  	if( changeUrl('', new_href) === false)
	  		return;

	  	current_thread = id;

	  	$$('#forum_content').html('');
	  	$$('#threads_shortcuts').html('').append( createThreadsShortcuts( data ) );
	  	
	  	try {
		  	loadThreadContent(id);
		}
		catch(e) {
			console.error(e);
		}
	}

	function createThreadsTable(data) {
		let table = $$.create('TABLE').setClass('threads_list').append(
			$$.create('TR')
				.append( $$.create('TH').setText('Subject') )
				.append( $$.create('TH').setText('Author') )
				.append( $$.create('TH').setText('Created') )
				.append( $$.create('TH').setText('Posts') )
				.append( $$.create('TH').setText('Last answer') )
		);

		data.THREADS.forEach(thread => {
			//console.log( thread );

			let thread_row = $$.create('TR').on('click', e => {
				//checking if current row was clicked directly
				if( e.target.parentNode === thread_row )
					showThread(thread.ID, data);
			})	.append( $$.create('TD').setText(thread.SUBJECT) )
				.append( $$.create('TD').setText(thread.AUTHOR_NICK).append(
					COMMON.makeUserLink(thread.AUTHOR_ID, true)
				) )
				.append( $$.create('TD').setText(thread.TIME) )
				.append( $$.create('TD').setText(thread.TOTAL_POSTS) )
				.append( $$.create('TD').setText(thread.LAST_POST) );

			table.append( thread_row );
		});

		if(data.total_threads > data.rows_per_page) {//at least two pages
			let pages_container = COMMON.createPagesRow(data.total_threads, data.rows_per_page, 
				data.page, '/forum?c=' + category + '&cat_page=');
			table.append( $$.create('TR').append(
				pages_container.setStyle({textAlign: 'center'})
			) );
		}

		return table;
	}

	function createThreadsShortcuts(data) {
		let shortcuts = $$.create('UL').setStyle({
			maxHeight: 'calc(100vh - 55px - 50px - 1px)',
			overflowY: 'auto'
		}).append(
			$$.create('DIV').setText('ANOTHER THREADS').setStyle({
				padding: '15px 5px',
				backgroundColor: '#26323820'
			})
		);

		data.THREADS.forEach(thread => {
			/*if(thread.ID === (current_thread|0)) {
				refreshThreadSubject( thread.SUBJECT );
				return;
			}*/

			let li = $$.create('LI').setText( thread.SUBJECT )
				.attribute('id', 'thread_shortcut_' + thread.ID).on('click', 
				() => {
					if(thread.ID !== (current_thread|0)) {
						thread_page = 0;
						showThread(thread.ID, data);
					}
				});
			
			if(thread.ID === (current_thread|0))
				li.addClass('current');

			shortcuts.append( li );
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
			shortcuts.append( $$.create('DIV').setStyle({
				height: '40px',
				padding: '10px',
				display: 'grid',
				// textAlign: 'center'
			}).append(
				pages_container.setStyle({textAlign: 'center'})
			) );
		}
		

		return shortcuts;
	}

	function submitAnswer(area) {
		let text = area.value.trim();

		if(text.length < 3)
			return $$('#forum_error').setText('Your answer should be at least 3 charactes long');
		//console.log(text);

		$$('#forum_error').setText('Submiting an answer...');
		area.value = '';//clear

		$$.postRequest('/submit_answer_request', {content: text, thread: current_thread}, res => {
			//console.log(res);
			res = JSON.parse(res);

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
					$$('#forum_content').scrollHeight + $$('#forum_content').height();
			});
		});
	}

	function submitThread(subject_input, input_area) {
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
			{category: category, subject: subject, content: content}, res => {

			res = JSON.parse(res);
			console.log(res);

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
	}

	function openThreadCreator() {
		$$('#threads_shortcuts').html('');

		var input_area = document.createElement('TEXTAREA');
		input_area.placeholder = 'Type first post content';
		input_area.setAttribute('maxlength', 2048);

		var subject_input = $$.create('INPUT').attribute('placeholder', 'Fill the subject')
			.attribute('id', 'subject_input').attribute('maxlength', 256);

		$$('#forum_content').html('').append(
			$$.create('DIV').append( subject_input )
		).append(
			$$.create('DIV').setStyle({display: 'grid'}).append( input_area )
		).append(
			$$.create('DIV').append(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
					.addClass('answer_btn').addClass('iconic_blue').setText('CONFIRM THREAD CREATION')
					.on('click', () => submitThread(subject_input, input_area) )
			)
		);
	}

	function loadThreadContent(id, onload) {
		let content = $$('#forum_content');

		content.html('').append( body_loader = COMMON.createLoader('#f4f4f4') );

		$$.postRequest('/thread_content_request', {thread: id, page: thread_page}, res => {
			if(body_loader)
				body_loader.remove();

			res = JSON.parse(res);

			content.append( 
				$$.create('H1').attribute('id', 'thread_subject').setText(res.SUBJECT).append(
		  			$$.create('IMG').attribute('src', '/img/icons/arrow.png')
		  				.addClass('icon_btn').setStyle({
			  				height: '30px',
			  				width: 'auto',
			  				float: 'right',
			  				marginRight: '10px'
			  			}).on('click', () => {
			  				$$('#forum_content').scrollTop = 
								$$('#forum_content').scrollHeight + $$('#forum_content').height();
			  			})
		  		)
			);

			//console.log(res);

			if(res.result !== 'SUCCESS')
				return onError();

			res.POSTS.forEach(post => {
				content.append( createPostWidget(post) );
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
				content.append( $$.create('DIV').setStyle({
					padding: '20px',
					display: 'grid'
				}).append(
					pages_container.setStyle({textAlign: 'center'})
				) );
			}

			if(is_last_page === true) {
				var input_area = document.createElement('TEXTAREA');
				input_area.placeholder = 'Type your answer here';
				input_area.setAttribute('maxlength', 2048);

				content.append(
					$$.create('DIV').setStyle({display: 'grid'}).append( input_area )
				).append(
					$$.create('DIV').append(
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

	function loadCategory(category) {//get topics from given category sorted from newest to oldest
		if(current_thread)
			$$('#threads_shortcuts').append( body_loader = COMMON.createLoader('#f4f4f4') );
		else
			$$('#forum_content').append( body_loader = COMMON.createLoader('#f4f4f4') );

		$$.postRequest('/threads_request', {category: category, page: cat_page}, res => {
			if(body_loader)
				body_loader.remove();

			res = JSON.parse(res);
			//console.log(res);
			
			if(res.result !== 'SUCCESS')
				return onError();

			if(res.THREADS.length === 0) {
				$$('#forum_content').append(
					$$.create('DIV').setText('No threads in this category').setStyle({
						padding: '20px 0px'
					})
				);
				return;
			}

			if(current_thread)
				$$('#threads_shortcuts').html('').append( createThreadsShortcuts(res) );
			else
				$$('#forum_content').append( createThreadsTable(res) );
		});
	}

	$$.load(() => {
		$$("#topbar").getChildren('a[href="forum"]').addClass('current');//highlight topbar bookmark
		
		try { category = location.href.match(/[\?&]c=([0-9]+)/i)[1]; } catch(e) {}
		try { cat_page = location.href.match(/[\?&]cat_page=([0-9]+)/i)[1]; } catch(e) {}
		try { current_thread = location.href.match(/[\?&]thread=([0-9]+)/i)[1]; } catch(e) {}
		try { thread_page = location.href.match(/[\?&]th_page=([0-9]+)/i)[1]; } catch(e) {}

		$$('a[href="forum?c=' + category + '"').addClass('current');

		if(current_thread) 
			loadThreadContent(current_thread, () => loadCategory(category));
		else
			loadCategory(category);

		$$(window).on('popstate', () => location.reload());

		$$('#thread_create_btn').on('click', openThreadCreator);
	});
})();