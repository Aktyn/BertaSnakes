const SessionWidget = (function() {
	const session_random_string = COMMON.generateRandomString(10);
	var id = 0;

	return class {
		constructor() {
			this.id = id++;//count every created instance
		}

		get session_string() {
			return session_random_string;
		}

		set session_string(val) {
			throw new Error('Cannot change session string after page load');
		}
	};
})();