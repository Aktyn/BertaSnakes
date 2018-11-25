(function() {
	//REQUEST ANIMATION FRAME CROSS BROWSER SUPPORT
	//@ts-ignore
    window.requestAnimFrame = (function() {
		return  window.requestAnimationFrame       || 
		      	window.webkitRequestAnimationFrame || 
		      	//@ts-ignore
		      	window.mozRequestAnimationFrame    || 
		      	//@ts-ignore
		      	window.oRequestAnimationFrame      || 
		      	//@ts-ignore
		      	window.msRequestAnimationFrame     || 
		      	function(callback) {
		        	window.setTimeout(callback, 1000 / 60);
		      	};
    })();
})();