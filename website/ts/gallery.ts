(function() {
	$$.load(() => {
		$$("#topbar").getChildren('a[href="gallery"]').addClass('current');//highlight topbar bookmark
	});
})();