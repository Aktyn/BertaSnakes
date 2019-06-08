import * as React from 'react';

// import './../../../styles/popup.scss';

interface PopupContextSchema {
	onClose: () => void;
}

export const PopupContext = React.createContext<PopupContextSchema>({
	onClose: () => void(0),
});

interface PopupBaseProps {
	title: string;
}

export default class extends React.Component<PopupBaseProps, any> {
	private container: HTMLDivElement | null = null;

	constructor(props: PopupBaseProps) {
		super(props);
	}

	render() {
		return <PopupContext.Consumer>{popup_ctx => (
			<div ref={el => this.container=el} className='popup-container' onClick={e => {
				if(e.target === this.container)
					popup_ctx.onClose();
			}}>
				<main>
					<h1>
						<span>{this.props.title}</span>
						<button className='shaky-icon closer' onClick={popup_ctx.onClose}></button>
					</h1>
					<hr />
					{this.props.children}
				</main>
			</div>
		)}</PopupContext.Consumer>;
	}
}