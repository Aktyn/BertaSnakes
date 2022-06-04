import {getArgument} from "./utils";
import ERROR_CODES from "../common/error_codes";
import Cache from './cache';
const fetch = require('node-fetch');

const OPENEXCHANGE_APP_ID = getArgument('OPENEXCHANGE_APP_ID');

interface OpenexchangeApiRes {
	disclaimer: string;
	license: string;
	timestamp: number;
	base: string;
	rates: {[index: string]: number};
}

const paypal_supported_currencies = new Set(['AUD', 'BRL', 'CAD', 'CHF', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
	'ILS', 'INR', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'USD']);

const dev_api_res: OpenexchangeApiRes = {
	disclaimer:
		'Usage subject to terms: https://openexchangerates.org/terms',
	license: 'https://openexchangerates.org/license',
	timestamp: 1564675200,
	base: 'USD',
	rates: {
		AUD: 1.458274,
		BRL: 3.837818,
		CAD: 1.320534,
		CHF: 0.993884,
		CZK: 23.291495,
		DKK: 6.750861,
		EUR: 0.90411,
		GBP: 0.823412,
		HKD: 7.826776,
		ILS: 3.5098,
		INR: 68.976878,
		MXN: 19.17477,
		MYR: 4.143447,
		NOK: 8.872287,
		NZD: 1.523617,
		PHP: 51.102,
		PLN: 3.892457,
		RUB: 63.904933,
		SEK: 9.65101,
		SGD: 1.372119,
		THB: 30.85,
		USD: 1
	}
};

interface CurrenciesDataErrorResponse {
	error: Exclude<ERROR_CODES, ERROR_CODES.SUCCESS>;
}

interface CurrenciesDataSuccessResponse {
	error: ERROR_CODES.SUCCESS;
	base: string;
	rates: {
		[index: string]: number
	};
}

type CurrenciesDataResponse = CurrenciesDataErrorResponse | CurrenciesDataSuccessResponse;

export default async function getCurrenciesData(): Promise<CurrenciesDataResponse> {
	let cached_currencies = Cache.getCache( 'currencies_cache' );
	if(cached_currencies)
		return cached_currencies.data;
		
	//load from openexchangerates.org api; https://openexchangerates.org/account/usage
	let api_res: OpenexchangeApiRes = (process.env.NODE_ENV || '').match(/developement|dev/i) ? dev_api_res :
		await fetch(`https://openexchangerates.org/api/latest.json?app_id=${OPENEXCHANGE_APP_ID}`).then(
			(res: any) => res.json());
	
	if( typeof api_res.base !== 'string' || typeof api_res.rates !== 'object' )
		return {error: ERROR_CODES.INCORRECT_API_RESPONSE};
	
	let supported_rates: {[index: string]: number} = {};
	for(let currency in api_res.rates) {
		if( paypal_supported_currencies.has(currency) )
			supported_rates[currency] = api_res.rates[currency];
	}
	api_res.rates = supported_rates;
	
	let cached_response = <CurrenciesDataSuccessResponse>{
		error: ERROR_CODES.SUCCESS,
		base: api_res.base,
		rates: api_res.rates
	};
	
	Cache.createCache('currencies_cache', 1000*60*60*24, cached_response);
	
	return cached_response;
}