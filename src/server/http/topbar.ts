/*jshint multistr: true */
const topbar_html = "<div id='topbar'>\
	<div class='topbar_side' style='text-align: left;'>\
		<a href='/' target='_self'><img src='/img/icons/logo.png' style='vertical-align: bottom;' /></a>\
	</div>\
	\
	<div class='links'>\
		<a href='play' target='_self'>PLAY</a>\
		<a href='forum' target='_self'>FORUM</a>\
		<a href='ranking' target='_self'>RANKING</a>\
		<!-- <a href='gallery' target='_self'>GALLERY</a> -->\
		<a href='info' target='_self'>INFO</a>\
	</div>\
	\
	<div class='topbar_side'>\
		<a href='/' target='_self' id='account_href'>\
			<img class='icon_btn' id='account_icon' style='max-height: 40px;' />\
		</a>\
	</div>\
</div>";

export default {
	getHTML: function() {
		return topbar_html;
	}
};