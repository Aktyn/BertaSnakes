import * as React from 'react';
import ImageGallery from 'react-image-gallery';

import 'react-image-gallery/styles/css/image-gallery.css';
import '../styles/gallery.scss';

const importAll = (r: any): string[] => r.keys().map((item: any) => r(item));

let img_sources = importAll( require.context('../img/gallery', false, /\.(png|jpe?g|svg)$/) );

const images = img_sources.map(src => {
	return {
		original: src,
		thumbnail: src,
		maxHeight: '200px'
	}
});

// noinspection JSUnusedGlobalSymbols
export default class GalleryPage extends React.Component<any, any> {
	
	constructor(props: any) {
		super(props);
	}
	
	render() {
		return <div className={'gallery-main'}>
			<section className={'gallery-container'}>
				<ImageGallery items={images} lazyLoad={true} showPlayButton={false} />
			</section>
		</div>;
	}
}