const enum ERROR_CODES {
	SUCCESS = 0,
	UNKNOWN,
	SERVER_UNREACHABLE,
	INCORRECT_SERVER_RESPONSE,
	USERNAME_NOT_FOUND,
	INCORRECT_PASSWORD,

	DATABASE_ERROR,
	SERVER_ERROR,
	INCORRECT_DATABASE_RESPONSE,
	SESSION_EXPIRED,
	ACCOUNT_NOT_LOGGED_IN,
	NOT_LOGGED_IN,

	ACCOUNT_DOES_NOT_EXISTS,
	ACCOUNT_NOT_VERIFIED,
	ACCOUNT_ALREADY_VERIFIED,
	ACCOUNT_ALREADY_LOGGED_IN,
	USERNAME_TAKEN,
	EMAIL_ALREADY_IN_USE,
	CANNOT_SEND_EMAIL,
	CANNOT_VERIFY_ACCOUNT,
	INCORRECT_VERIFICATION_CODE,

	//files
	CANNOT_OPEN_FILE,
	FILE_TOO_LARGE,

	//network
	CANNOT_SEND_JSON_MESSAGE,
	CANNOT_JOIN_CURRENT_ROOM,
	USER_IS_NOT_IN_ROOM
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
		case ERROR_CODES.SERVER_ERROR:			return 'Server error';
		case ERROR_CODES.INCORRECT_DATABASE_RESPONSE: return 'Incorrect database response';
		case ERROR_CODES.SESSION_EXPIRED: 		return 'Session expired';
		case ERROR_CODES.ACCOUNT_NOT_LOGGED_IN:
		case ERROR_CODES.NOT_LOGGED_IN:			return 'You are not logged in';
		case ERROR_CODES.ACCOUNT_DOES_NOT_EXISTS: return 'Account does not exists';
		case ERROR_CODES.ACCOUNT_NOT_VERIFIED:	return 'Account is not verified';
		case ERROR_CODES.ACCOUNT_ALREADY_VERIFIED: return 'Account is already verified';
		case ERROR_CODES.ACCOUNT_ALREADY_LOGGED_IN:return 'Account already logged in';
		case ERROR_CODES.USERNAME_TAKEN: 		return 'Username taken';
		case ERROR_CODES.EMAIL_ALREADY_IN_USE:	return 'Email already registered';
		case ERROR_CODES.CANNOT_SEND_EMAIL:		return 'Cannot send email';
		case ERROR_CODES.CANNOT_VERIFY_ACCOUNT:	return 'Cannot verify account';
		case ERROR_CODES.INCORRECT_VERIFICATION_CODE: return 'Incorrect verification code';

		//files
		case ERROR_CODES.CANNOT_OPEN_FILE: 		return 'Cannot open file';
		case ERROR_CODES.FILE_TOO_LARGE:		return 'File too large';

		//network
		case ERROR_CODES.CANNOT_SEND_JSON_MESSAGE:return 'Cannot send json message';
		case ERROR_CODES.CANNOT_JOIN_CURRENT_ROOM:return 'Cannot join current room';
		case ERROR_CODES.USER_IS_NOT_IN_ROOM:	return 'User is not in room';
	}
}