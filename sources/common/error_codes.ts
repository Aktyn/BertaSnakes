const enum ERROR_CODES {
	SUCCESS = 0,
	UNKNOWN,
	SERVER_UNREACHABLE,
	INCORRECT_SERVER_RESPONSE,
	USERNAME_NOT_FOUND,
	INCORRECT_PASSWORD,

	DATABASE_ERROR,
	INCORRECT_DATABASE_RESPONSE,
	SESSION_EXPIRED,

	ACCOUNT_DOES_NOT_EXISTS
}

export default ERROR_CODES;

export function errorMsg(code: ERROR_CODES) {
	switch(code) {
		default: return 'THERE IS NO MESSAGE FOR THIS ERROR';
		case ERROR_CODES.UNKNOWN: return 'Unknown error';
		case ERROR_CODES.SERVER_UNREACHABLE: 	return 'Server unreachable';
		case ERROR_CODES.INCORRECT_SERVER_RESPONSE: return 'Incorrect server response';
		case ERROR_CODES.USERNAME_NOT_FOUND: 	return 'Username not found';
		case ERROR_CODES.INCORRECT_PASSWORD: 	return 'Incorrect password';
		case ERROR_CODES.DATABASE_ERROR: 		return 'Database error';
		case ERROR_CODES.INCORRECT_DATABASE_RESPONSE: return 'Incorrect database response';
		case ERROR_CODES.SESSION_EXPIRED: 		return 'Session expired';
		case ERROR_CODES.ACCOUNT_DOES_NOT_EXISTS: return 'Account does not exists';
	}
}