class Info extends React.Component<any, any> {
	constructor(props: any) {
		super(props);
	}
	render() {
		return <div className='container'>
			<h1 style={{margin: '0px'}}>General info</h1>

			<article style={{display: 'grid', gridTemplateColumns: '50% 50%'}}>
				<section style={{maxWidth: '48vw'}}>
					<h1>Game</h1>
					<div style={{padding: '10px'}}>
						Multiplayer 2D game with dynamic enviroment.
					</div>
				</section>
				<section style={{maxWidth: '48vw'}}>
					<h1 style={{padding: '0px'}}>
						Author <img src="img/icons/aktyn_logo_dissolv.png" className='icon_btn' 
							style={{
								height: '50px',
								width: '50px',
								float: 'right',
								marginLeft: '-50px',
								opacity: 1,
								cursor: 'auto'}} />
					</h1>
					<div style={{padding: '10px'}}>
						Aktyn
					</div>
				</section>
			</article>
		</div>;
	}
}