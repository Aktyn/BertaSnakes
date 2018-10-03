///<reference path="utils.ts"/>
(function() {
	$$.load(() => {
		$$("#topbar").getChildren('a[href="info"]').addClass('current');//highlight topbar bookmark
	});
})();