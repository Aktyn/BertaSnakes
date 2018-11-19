interface PagesLinkProps {
	page: number;
	items_per_page: number;
	total_items: number;
	href_base: string | ((arg: number) => any);
}

class PagesLink extends React.Component<PagesLinkProps, any> {

	constructor(props: PagesLinkProps) {
		super(props);

		// console.log(this.props);
	}

	private makeBlock(i: number, is_current = false) {
		if(typeof this.props.href_base === 'string') {
			return <Link className={is_current ? 'current' : ''} 
				href={this.props.href_base as string + (i-1)}>{i}</Link>
			//return <a className={is_current ? 'current' : ''} 
			//	href={this.props.href_base as string + (i-1)}>{i}</a>;
		}
		else if(typeof this.props.href_base === 'function') {
			return <a className={is_current ? 'current' : ''}
				onClick={() => (this.props.href_base as ((arg: number) => void))(i-1)}>{i}</a>;
		}
		else
			throw new Error('last argument must be either type of string or function');
	}

	render() {
		let total_pages = Math.ceil(this.props.total_items / this.props.items_per_page);

		const visible_page_buttons = 5;//should be odd integer
		const page_shift = Math.floor(visible_page_buttons/2);
		const min_page = Math.max(0, this.props.page-page_shift);
		const max_page = Math.min(total_pages-1, this.props.page+page_shift);

		return <td colSpan={42} className='pages_control' onSelect={() => false}>
			{min_page > 0 && this.makeBlock(1)}
			{min_page > 0 && <span>...</span>}
			{(() => {
				var out = [];
				for(let i=min_page; i<=max_page; i++)
					out.push( this.makeBlock(i+1, i === this.props.page) );
				return out;
			})()}
			{max_page < total_pages-1 && <span>...</span>}
			{max_page < total_pages-1 && this.makeBlock(total_pages)}
		</td>;
	}
}