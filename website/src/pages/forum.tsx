///<reference path="../loader.tsx"/>
///<reference path="../games_history.tsx"/>
///<reference path="../pages_link.tsx"/>
///<reference path="../page_navigator.ts"/>

interface JSON_COMMON {
	AUTHOR_ID: number;
	AUTHOR_NICK: string;
	TIME: string;
}

interface ThreadJSON extends JSON_COMMON {
	ID: number;
	SUBJECT: string;
	LAST_POST: string;
	TOTAL_POSTS: number;
}

interface PostJSON extends JSON_COMMON {
	ID: number;
	CONTENT: string;
}

interface ForumState {
	category: number;
	category_page: number;
	thread: number;
	thread_page: number;

	thread_creator: number;

	error?: string;

	threads_data?: {
		threads: ThreadJSON[];
		page: number;
		rows_per_page: number;
		total_threads: number;
	};

	current_thread_data?: {
		posts: PostJSON[];
		subject: string;
		page: number;
		rows_per_page: number;
		total_posts: number;
	};
}

class Forum extends React.Component<any, ForumState> {
	private static extractCategory = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/forum\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 1;
		}
	}

	private static extractCategoryPage = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/forum\/[0-9]+\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 0;
		}
	}

	private static extractThread = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/forum\/[0-9]+\/[0-9]+\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 0;
		}
	}

	private static extractThreadPage = function() {
		try {
			//@ts-ignore
			return parseInt( location.href.match(/forum\/[0-9]+\/[0-9]\/[0-9]+\/([0-9]+)/i)[1] );
		}
		catch(e) {
			return 0;
		}
	}

	private static CATEGORIES = [ 'NEWS', 'GENERAL', 'HELP', 'BUGS / SUGGESTIONS' ];

	private postArea: HTMLTextAreaElement | null = null;
	private subject_input: HTMLInputElement | null = null;
	private thread_content: HTMLTextAreaElement | null = null;

	state: ForumState = {
		category: Forum.extractCategory(),
		category_page: Forum.extractCategoryPage(),
		thread: Forum.extractThread(),
		thread_page: Forum.extractThreadPage(),

		thread_creator: 0,

		error: undefined,

		threads_data: undefined,
		current_thread_data: undefined
	};

	constructor(props: any) {
		super(props);

		PageNavigator.onUrlChange( () => this.loadContent(), 'forum_changer' );

		this.loadContent(true);
	}

	componentWillUnmount() {
		PageNavigator.removeUrlChangeListener('forum_changer');
	}

	submitAnswer(answer: string) {
		let text = answer.trim();

		if(text.length < 3)
			return this.onError('Your answer should be at least 3 charactes long');
		//console.log(text);

		this.onError('Submiting an answer...');

		$$.postRequest('/submit_answer_request', {content: text, thread: this.state.thread}, 
			raw_res => 
		{
			if(raw_res === undefined)
				return;
			
			var res = JSON.parse(raw_res);
			
			if(res.result !== 'SUCCESS') {
				switch(res.result) {
					default: 
						this.onError('Cannot submit answer');
						break;
					case 'INSUFFICIENT_PERMISSIONS':
						this.onError('You are not permitted to answer in this category');
						break;
					case 'NO_SESSION':
						this.onError('You are not logged in');
						break;
				}

				return;
			}

			this.loadContent(true);
		});

		return;
	}

	submitThread(_subject: string, _content: string, _category: number) {
		let subject = _subject.trim();
		let content = _content.trim();

		if(subject.length < 3)
			return this.onError('Subject should be at least 3 charactes long');
		if(content.length < 3)
			return this.onError('Content should be at least 3 charactes long');

		this.onError('Creating thread...');

		$$.postRequest('/create_thread_request', 
			{category: _category, subject: subject, content: content}, raw_res => {

			if(raw_res === undefined)
				return this.onError();

			var res = JSON.parse(raw_res);
			//console.log(res);

			if(res.result !== 'SUCCESS') {
				switch(res.result) {
					default: 
						this.onError('Cannot create thread');
						break;
					case 'INSUFFICIENT_PERMISSIONS':
						this.onError(
							'You are not permitted to create thread in this category');
						break;
					case 'NO_SESSION':
						this.onError('You are not logged in');
						break;
				}
				return;
			}

			PageNavigator.redirect('/forum/' + _category + '/0/' + res.ID);
			this.loadContent(true);
		});
	}

	onError(error_details?: string) {
		this.setState({error: error_details || 'FORUM ERROR'});
	}

	renderError() {
		return <div style={{
			padding: '5px 20px'
		}}>{this.state.error}</div>
	}

	loadContent(first = false) {
		var new_cat = Forum.extractCategory();
		var new_cat_page = Forum.extractCategoryPage();
		var new_thread = Forum.extractThread();
		var new_thread_page = Forum.extractThreadPage();

		if(new_thread && (new_thread !== this.state.thread || 
			new_thread_page !== this.state.thread_page || first) ) 
		{//show thread
			$$.postRequest('/thread_content_request', {thread: new_thread, page: new_thread_page}, 
				raw_res => 
			{
				if(raw_res === undefined)
					return this.onError();

				var res = JSON.parse(raw_res);
				//console.log(res);
				
				if(res.result !== 'SUCCESS')
					return this.onError();

				this.setState({
					category: new_cat,
					category_page: new_cat_page,
					thread: new_thread,
					thread_page: new_thread_page,
					thread_creator: 0,
					error: undefined,

					current_thread_data: {
						posts: res.POSTS,
						subject: res.SUBJECT,
						page: res.page,
						rows_per_page: res.rows_per_page,
						total_posts: res.total_posts,
					}
				});
			});
		}
		if(new_cat !== this.state.category || new_cat_page !== this.state.category_page || first) {
			//loading category
			$$.postRequest('/threads_request', {category: new_cat, page: new_cat_page}, raw_res => {
				if(raw_res === undefined)
					return this.onError();

				var res = JSON.parse(raw_res);
				//console.log(res);
				
				if(res.result !== 'SUCCESS')
					return this.onError();

				this.setState({
					category: new_cat,
					category_page: new_cat_page,
					thread: new_thread,
					thread_page: new_thread_page,
					thread_creator: 0,
					error: undefined,

					threads_data: {
						threads: res.THREADS,
						page: res.page,
						rows_per_page: res.rows_per_page,
						total_threads: res.total_threads
					}
				});
			});
		}
		else {
			this.setState({thread: new_thread});
		}
	}

	renderThreadCreator(_category: number) {
		return <React.Fragment>
			<div>
				<input ref={(subject_input) => { this.subject_input = subject_input; }}
					placeholder='Fill the subject' id='subject_input' maxLength={256} />
			</div>
			<div style={{display: 'grid'}}>
				<textarea ref={(thread_content) => { this.thread_content = thread_content; }}
					placeholder='Type first post content' maxLength={2048}></textarea>
			</div>
			<div>
				<button className='iconic_button iconic_empty answer_btn iconic_blue' onClick={() => {
					if(this.subject_input && this.thread_content) {
						this.submitThread(this.subject_input.value, this.thread_content.value, 
							_category);
						this.subject_input.value = '';
						this.thread_content.value = '';
					}
				}}>
					CONFIRM THREAD CREATION
				</button>
			</div>
		</React.Fragment>;
	}

	renderThreadsShortcuts() {
		var data = this.state.threads_data;

		if(this.state.thread_creator === 0 && this.state.thread && data !== undefined) {
			//console.log(this.state);
			
			return <ul style={{
				maxHeight: 'calc(100vh - 55px - 50px - 1px)',
				overflowY: 'auto'
			}}>
				<div style={{
					padding: '15px 5px',
					backgroundColor: '#26323820'
				}}>ANOTHER THREADS</div>
				{data.threads.map(thread => {
					return <li id={'thread_shortcut_' + thread.ID} onClick={() => {
						PageNavigator.redirect('/forum/' + this.state.category + '/' + 
							this.state.category_page + '/' + thread.ID);
					}} className={thread.ID === this.state.thread ? 'current' : ''}>
						{thread.SUBJECT}
					</li>;
				})}
				{data.total_threads > data.rows_per_page && <div style={{
					height: '40px',
					padding: '10px',
					display: 'grid'
				}}><PagesLink 
						page={data.page}
						items_per_page={data.rows_per_page}
						total_items={data.total_threads}
						href_base={(arg: number) => {
							PageNavigator.redirect('/forum/' + this.state.category + '/' + arg + '/'
								+ this.state.thread + '/' + this.state.thread_page);
						}} />
				</div>}
			</ul>;
		}
		return undefined;
	}

	renderForumContent() {
		if(this.state.thread_creator !== 0)
			return this.renderThreadCreator(this.state.thread_creator);

		var data = this.state.threads_data;

		if(data === undefined || data.threads.length === 0)
			return <div style={{padding: '20px 0px'}}>No threads in this category</div>;

		if(!this.state.thread) {//render thread content
			return <table className='threads_list'>
				<tr>
					<th>Subject</th><th>Author</th><th>Created</th><th>Posts</th><th>Last answer</th>
				</tr>
				{data.threads.map(thread => {
					return <tr onClick={() => {
						PageNavigator.redirect('/forum/' + this.state.category + '/' + 
							this.state.category_page + '/' + thread.ID);
					}}>
						<td>{thread.SUBJECT}</td>
						<td><Link href={'/user/' + thread.AUTHOR_ID} preventPropagation={true}>
							{thread.AUTHOR_NICK}
						</Link></td>
						<td>{thread.TIME}</td>
						<td>{thread.TOTAL_POSTS}</td>
						<td>{thread.LAST_POST}</td>
					</tr>;
				})}
				{data.total_threads > data.rows_per_page && <tr className='pager'>
					<PagesLink 
						href_base={'/forum/' + this.state.category + '/'}
						page={data.page}
						items_per_page={data.rows_per_page}
						total_items={data.total_threads} />
				</tr>}
			</table>;
		}
		else if(this.state.current_thread_data) {
			var thread_data = this.state.current_thread_data;

			var is_last_page = thread_data.page+1 === 
				Math.ceil(thread_data.total_posts / thread_data.rows_per_page);

			return <React.Fragment>
				<h1 id='thread_subject'>
					{thread_data.subject}
					<img src='/img/icons/arrow.png' className='icon_btn' style={{
						height: '30px',
		  				width: 'auto',
		  				float: 'right',
		  				marginRight: '10px'
					}} onClick={() => {
						//$$('#forum_content').scrollTop = 
						//	$$('#forum_content').scrollHeight + $$('#forum_content').getHeight();
						var content_element = document.getElementById('forum_content');
						if(content_element === null)
							return;
						var rect = content_element.getBoundingClientRect();
						
						content_element.scrollTop = 
							content_element.scrollHeight + (rect.bottom - rect.top);
						//console.log('TODO - scroll down');
					}} />
				</h1>
				{thread_data.posts.map(post => {
					return <section>
						<div className='post_header'>
							<Link href={'/user/' + post.AUTHOR_ID}>{post.AUTHOR_NICK}</Link>
							<span style={{
								float: 'right',
								fontSize: '15px'
							}}>{post.TIME}</span>
						</div>
						<div className='content'>{post.CONTENT}</div>
					</section>;
				})}
				{thread_data.total_posts > thread_data.rows_per_page && <div style={{
					padding: '20px',
					display: 'grid'
				}}><PagesLink
					href_base={'/forum/' + this.state.category + '/' + this.state.category_page + '/'
						+ this.state.thread + '/'}
					page={thread_data.page}
					items_per_page={thread_data.rows_per_page}
					total_items={thread_data.total_posts} />
				</div>}
				{is_last_page && <React.Fragment>
					<div style={{display: 'grid'}}>
						<textarea placeholder='Type your answer here' maxLength={2048}
							ref={(input) => { this.postArea = input; }}></textarea>
					</div>
					<div>
						<button className='iconic_button iconic_empty answer_btn iconic_blue'
						 onClick={() => {
						 	if(this.postArea) {
						 		this.submitAnswer(this.postArea.value);
						 		this.postArea.value = '';
						 	}
						 }}>
							SUBMIT AN ANSWER
						</button>
					</div>
				</React.Fragment>}
			</React.Fragment>;
		}
		else
			return undefined;
	}

	render() {
		return <main className='forum_main'>
			<nav>
				<h1>CATEGORIES</h1>
				<hr />
				{Forum.CATEGORIES.map((cat, index) => {
					return <Link href={'/forum/' + (index+1)} 
						current={this.state.category === index+1}>{cat}</Link>;
				})}
			</nav>
			<div id='forum_top_panel'>
				<button className='iconic_button iconic_add' id='thread_create_btn'
					onClick={() => {
						this.setState({thread_creator: this.state.category});
					}}>CREATE THREAD</button>
				<span className='error_msg' id='forum_error'>
					{this.state.error === undefined || this.renderError()}
				</span>
			</div>

			<aside id='threads_shortcuts'>{this.renderThreadsShortcuts()}</aside>
			<article id='forum_content'>{this.renderForumContent()}</article>

		</main>;
	}
}