///<reference path="common/common.ts"/>

//const SessionWidget = (function() {//TODO - make rid of this class
	//const session_random_string = COMMON.generateRandomString(10);
	//var id = 0;

class SessionWidget {
	private static session_random_string = COMMON.generateRandomString(10);
	private static instances_count = 0;

	public id: number;

	constructor() {
		this.id = SessionWidget.instances_count++;//count every created instance
	}

	get session_string() {
		return SessionWidget.session_random_string;
	}

	set session_string(val) {
		throw new Error('Cannot change session string after page load');
	}
}
//})();