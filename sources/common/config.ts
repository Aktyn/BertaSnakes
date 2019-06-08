const SERVER_PORT = 5348;

export default {
	api_server_url: process.env.NODE_ENV === 'development' ? 
		`http://localhost:${SERVER_PORT}` : 
		//@ts-ignore
		typeof location !== 'undefined' ? location.origin : undefined,

	SERVER_PORT,
	WEBSOCKET_PORT: 2674,

	TOKEN_LIFETIME: 1000 * 60 * 60 * 24 * 7,//one week

	START_GAME_COUNTDOWN: 1,//seconds
	MINIMUM_GAME_DURATION: 1,
	MAXIMUM_GAME_DURATION: 30,

	MAXIMUM_SITS: 8
}