import * as React from 'react';
import ContainerPage, {ContainerProps} from "./container_page";

import '../styles/search.scss';

interface SearchState extends ContainerProps {

}

export default class SearchPage extends React.Component<any, SearchState> {
	
	state: SearchState = {
		error: undefined,
		loading: false,
		show_navigator: false,
	};
	
	constructor(props: any) {
		super(props);
	}
	
	/*private setError(msg: string) {
		this.setState({error: msg, loading: false});
	}*/
	
	render() {
		return <ContainerPage className={'search-page'} {...this.state}>
			TODO
		</ContainerPage>;
	}
}