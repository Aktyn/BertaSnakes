export default {
	/**
     * 'expires' argument must be given as number of milliseconds
     */
	setCookie: function(name: string, value: string | number | boolean, expires: number) {
	    document.cookie = name + '=' + value + ';' + 'expires=' +
	    	(new Date(expires)).toUTCString() + ';path=/';
	},

	removeCookie: function(name: string) {
		this.setCookie(name, '', 0);
	},

	getCookie: function(name: string) {
	    try {
	    	let match = decodeURIComponent(document.cookie)
	    		.match(new RegExp('.*'+name+'=([^;]*)', 'i'));
	    	if(match && match.length > 1)
		   		return match[1];
		   	return null;
		}
		catch(e) {
			return null;//cookie not found
		}
	}
};