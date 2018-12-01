///<reference path="../loader.tsx"/>
///<reference path="../pages_link.tsx"/>

interface HomeState {
	loaded: boolean;
	raw_result?: string;
}

class Home extends React.Component<any, HomeState> {
	state = {
		loaded: false,
		raw_result: undefined
	}

	constructor(props: any) {
		super(props);

		$$.postRequest('/latest_news_request', {}, (res_str) => {
			if(res_str === undefined)
				return;

			this.setState({
				loaded: true,
				raw_result: res_str
			});
		});
	}

	renderResult() {
		interface News {
			TIME: string;
			SUBJECT: string;
			THREAD_ID: number;
			CONTENT: string;
		}

		var res: {NEWS: News[], result: string} = JSON.parse(this.state.raw_result || '{}');

		if(res.result !== 'SUCCESS')
			return 'Error';

		return <div className='homepage'>
			<article id='news_list'>
				<h1>Latest news</h1>
				{res.NEWS.map((_new: News) => {
					return <div className='news_entry'>
						<h2>
							<span>{_new.TIME}</span>
							<label>{_new.SUBJECT}</label>
							<Link type='forum_link' vertical={true} 
								href={'/forum/1/0/' + _new.THREAD_ID}></Link>
						</h2>
						<section>{_new.CONTENT}</section>
					</div>;
				})}
			</article>
		</div>;
	}

	render() {
		return this.state.loaded === false ? <div><Loader /></div> : this.renderResult();
	}
}