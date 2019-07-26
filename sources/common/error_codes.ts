const enum ERROR_CODES {
	SUCCESS = 0,
	UNKNOWN,
	SERVER_UNREACHABLE,
	INCORRECT_SERVER_RESPONSE,
	USERNAME_NOT_FOUND,
	INCORRECT_PASSWORD,
	INSUFFICIENT_PERMISSIONS,

	DATABASE_ERROR,
	SERVER_ERROR,
	INCORRECT_DATABASE_RESPONSE,
	SESSION_EXPIRED,
	ACCOUNT_NOT_LOGGED_IN,
	NOT_LOGGED_IN,

	ACCOUNT_DOES_NOT_EXIST,
	EMAIL_IS_NOT_REGISTERED,
	ACCOUNT_NOT_VERIFIED,
	ACCOUNT_ALREADY_VERIFIED,
	ACCOUNT_ALREADY_LOGGED_IN,
	USERNAME_TAKEN,
	EMAIL_ALREADY_IN_USE,
	CANNOT_SEND_EMAIL,
	CANNOT_VERIFY_ACCOUNT,
	INCORRECT_VERIFICATION_CODE,
	INCORRECT_RESET_CODE,
	FRIENDSHIP_ALREADY_EXISTS,

	//files
	CANNOT_OPEN_FILE,
	FILE_TOO_LARGE,

	//network
	CANNOT_SEND_JSON_MESSAGE,
	CANNOT_JOIN_CURRENT_ROOM,
	USER_IS_NOT_IN_ROOM,
	
	INCORRECT_DATA_SENT,
	
	//game
	GAME_DOES_NOT_EXIST,
	INSUFFICIENT_LEVEL,
	NOT_ENOUGH_COINS,
	SHIP_ALREADY_BOUGHT,
	SKILL_ALREADY_BOUGHT,
	INCORRECT_RANKING_TYPE,
	
	//service worker and push notifications
	SERVICE_WORKER_IS_NOT_INITIALIZED,
	CANNOT_SUBSCRIBE_PUSH_NOTIFICATIONS,
	CANNOT_UNSUBSCRIBE_PUSH_NOTIFICATIONS,
	CANNOT_FIND_CURRENT_SUBSCRIPTION
}

export default ERROR_CODES;

export function errorMsg(code: ERROR_CODES) {
	switch(code) {
		default: return 'THERE IS NO MESSAGE FOR THIS ERROR';
		case ERROR_CODES.UNKNOWN:                   return 'Unknown error';
		case ERROR_CODES.SERVER_UNREACHABLE: 	    return 'Server unreachable';
		case ERROR_CODES.INCORRECT_SERVER_RESPONSE: return 'Incorrect server response';
		case ERROR_CODES.USERNAME_NOT_FOUND: 	    return 'Username not found';
		case ERROR_CODES.INCORRECT_PASSWORD: 	    return 'Incorrect password';
		case ERROR_CODES.INSUFFICIENT_PERMISSIONS:  return 'Insufficient permissions';
		
		case ERROR_CODES.DATABASE_ERROR: 		    return 'Database error';
		case ERROR_CODES.SERVER_ERROR:			    return 'Server error';
		case ERROR_CODES.INCORRECT_DATABASE_RESPONSE: return 'Incorrect database response';
		case ERROR_CODES.SESSION_EXPIRED: 		    return 'Session expired';
		case ERROR_CODES.ACCOUNT_NOT_LOGGED_IN:
		case ERROR_CODES.NOT_LOGGED_IN:			    return 'You are not logged in';
		case ERROR_CODES.ACCOUNT_DOES_NOT_EXIST:    return 'Account does not exist';
		case ERROR_CODES.EMAIL_IS_NOT_REGISTERED:   return 'There is no account registered with this email';
		case ERROR_CODES.ACCOUNT_NOT_VERIFIED:	    return 'Account is not verified';
		case ERROR_CODES.ACCOUNT_ALREADY_VERIFIED:  return 'Account is already verified';
		case ERROR_CODES.ACCOUNT_ALREADY_LOGGED_IN: return 'Account already logged in';
		case ERROR_CODES.USERNAME_TAKEN: 		    return 'Username taken';
		case ERROR_CODES.EMAIL_ALREADY_IN_USE:	    return 'Email already registered';
		case ERROR_CODES.CANNOT_SEND_EMAIL:		    return 'Cannot send email';
		case ERROR_CODES.CANNOT_VERIFY_ACCOUNT:	    return 'Cannot verify account';
		case ERROR_CODES.INCORRECT_VERIFICATION_CODE: return 'Incorrect verification code';
		case ERROR_CODES.INCORRECT_RESET_CODE:      return 'Incorrect password reset code';
		case ERROR_CODES.FRIENDSHIP_ALREADY_EXISTS: return 'Friendship already exists';

		//files
		case ERROR_CODES.CANNOT_OPEN_FILE: 		return 'Cannot open file';
		case ERROR_CODES.FILE_TOO_LARGE:		return 'File too large';

		//network
		case ERROR_CODES.CANNOT_SEND_JSON_MESSAGE:  return 'Cannot send json message';
		case ERROR_CODES.CANNOT_JOIN_CURRENT_ROOM:  return 'Cannot join current room';
		case ERROR_CODES.USER_IS_NOT_IN_ROOM:	    return 'User is not in room';
		
		case ERROR_CODES.INCORRECT_DATA_SENT:       return 'Incorrect data sent';
		
		//game
		case ERROR_CODES.GAME_DOES_NOT_EXIST:   return 'Game does not exist';
		case ERROR_CODES.INSUFFICIENT_LEVEL:    return 'Insufficient level';
		case ERROR_CODES.NOT_ENOUGH_COINS:      return 'Not enough coins';
		case ERROR_CODES.SHIP_ALREADY_BOUGHT:   return 'Ship has been bought already';
		case ERROR_CODES.SKILL_ALREADY_BOUGHT:  return 'Skill has been bought already';
		case ERROR_CODES.INCORRECT_RANKING_TYPE:return 'Incorrect ranking type';
		
		//service worker and push notifications
		case ERROR_CODES.SERVICE_WORKER_IS_NOT_INITIALIZED:     return 'Service worker is not initialized';
		case ERROR_CODES.CANNOT_SUBSCRIBE_PUSH_NOTIFICATIONS:   return 'Cannot subscribe push notifications';
		case ERROR_CODES.CANNOT_UNSUBSCRIBE_PUSH_NOTIFICATIONS: return 'Cannot unsubscribe push notifications';
		case ERROR_CODES.CANNOT_FIND_CURRENT_SUBSCRIPTION:      return 'Cannot find current notifications subscription';
	}
}