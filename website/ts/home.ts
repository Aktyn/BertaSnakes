///<reference path="utils.ts"/>
///<reference path="main.ts"/>

interface News {
	TIME: string;
	SUBJECT: string;
	THREAD_ID: number;
	CONTENT: string;
}

(function() {
	var body_loader: $_face | null = null;

	function create_NewEntry(_new: News) {
		return $$.create('DIV').setClass('news_entry').addChild(
			$$.create('H2').addChild(//_new entry header
				$$.create('SPAN').setText( _new.TIME )
			).addChild(
				$$.create('LABEL').setText( _new.SUBJECT )
			).addChild(
				$$.create('A').setStyle({
					backgroundImage: 'url(/img/icons/more_vert.png)',
					backgroundSize: 'cover',
					display: 'inline-block',
					height: '30px',
					width: '30px'
				}).addClass('icon_btn').setAttrib('href', '/forum/?c=1&thread=' + _new.THREAD_ID)
			)
		).addChild(
			$$.create('SECTION').setText( _new.CONTENT )
		);
	}

	$$.load(() => {
		$$('#news_list').addChild( body_loader = COMMON.createLoader('#f4f4f4') );

		$$.postRequest('/latest_news_request', {}, (res_str) => {
			if(res_str === undefined)
				return;

			var res: {NEWS: News[], result: string} = JSON.parse(res_str);

			// console.log(res);
			if(body_loader !== null)
				body_loader.remove();

			if(res.result !== 'SUCCESS')
				return;

			res.NEWS.forEach((_new: News) => {
				$$('#news_list').addChild(
					create_NewEntry(_new)
				);
			});
		});
	});
})();