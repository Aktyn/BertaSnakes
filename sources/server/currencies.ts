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

const dev_api_res: OpenexchangeApiRes = {
	disclaimer:
		'Usage subject to terms: https://openexchangerates.org/terms',
	license: 'https://openexchangerates.org/license',
	timestamp: 1564585200,
	base: 'USD',
	rates: {
		AED: 3.672973,
		AFN: 80.049156,
		ALL: 109.28,
		AMD: 476.2543,
		ANG: 1.78017,
		AOA: 349.5735,
		ARS: 43.8216,
		AUD: 1.450356,
		AWG: 1.799996,
		AZN: 1.7025,
		BAM: 1.754793,
		BBD: 2,
		BDT: 84.456,
		BGN: 1.756597,
		BHD: 0.376944,
		BIF: 1846,
		BMD: 1,
		BND: 1.350659,
		BOB: 6.911913,
		BRL: 3.762582,
		BSD: 1,
		BTC: 0.00010029289,
		BTN: 68.804043,
		BWP: 10.697989,
		BYN: 2.033546,
		BZD: 2.015869,
		CAD: 1.313152,
		CDF: 1666,
		CHF: 0.989852,
		CLF: 0.024692,
		CLP: 700.975,
		CNH: 6.890995,
		CNY: 6.8845,
		COP: 3305.848863,
		CRC: 572.113584,
		CUC: 1,
		CUP: 25.75,
		CVE: 99.1095,
		CZK: 23.059883,
		DJF: 178.05,
		DKK: 6.706782,
		DOP: 51.21,
		DZD: 119.76858,
		EGP: 16.529,
		ERN: 14.999642,
		ETB: 29.05,
		EUR: 0.898158,
		FJD: 2.16001,
		FKP: 0.816635,
		GBP: 0.816635,
		GEL: 2.98,
		GGP: 0.816635,
		GHS: 5.39,
		GIP: 0.816635,
		GMD: 49.965,
		GNF: 9225,
		GTQ: 7.695873,
		GYD: 208.540795,
		HKD: 7.827941,
		HNL: 24.700138,
		HRK: 6.6328,
		HTG: 94.540197,
		HUF: 292.657139,
		IDR: 14024.65562,
		ILS: 3.496335,
		IMP: 0.816635,
		INR: 68.846877,
		IQD: 1189.75,
		IRR: 42105,
		ISK: 121.358956,
		JEP: 0.816635,
		JMD: 136.02,
		JOD: 0.709001,
		JPY: 108.57414286,
		KES: 104.1,
		KGS: 69.620201,
		KHR: 4083,
		KMF: 442.29616,
		KPW: 900,
		KRW: 1182.46,
		KWD: 0.304385,
		KYD: 0.833419,
		KZT: 384.470777,
		LAK: 8695,
		LBP: 1507.5,
		LKR: 176.390082,
		LRD: 202.400424,
		LSL: 14.21,
		LYD: 1.4,
		MAD: 9.612025,
		MDL: 17.696077,
		MGA: 3665,
		MKD: 55.179184,
		MMK: 1508.402981,
		MNT: 2663.740364,
		MOP: 8.061697,
		MRO: 357,
		MRU: 36.825,
		MUR: 36.190033,
		MVR: 15.439964,
		MWK: 741.637644,
		MXN: 18.981893,
		MYR: 4.125584,
		MZN: 61.43841,
		NAD: 14.21,
		NGN: 360,
		NIO: 33.55,
		NOK: 8.781507,
		NPR: 110.086109,
		NZD: 1.515008,
		OMR: 0.384993,
		PAB: 1,
		PEN: 3.296746,
		PGK: 3.37625,
		PHP: 50.8,
		PKR: 160.8,
		PLN: 3.849137,
		PYG: 6007.055229,
		QAR: 3.640775,
		RON: 4.249797,
		RSD: 105.737465,
		RUB: 63.4233,
		RWF: 915,
		SAR: 3.751323,
		SBD: 8.175834,
		SCR: 13.684141,
		SDG: 45.125,
		SEK: 9.592138,
		SGD: 1.368499,
		SHP: 0.816635,
		SLL: 7156.043409,
		SOS: 578.528019,
		SRD: 7.458,
		SSP: 130.26,
		STD: 21560.79,
		STN: 22.075,
		SVC: 8.751517,
		SYP: 515.369935,
		SZL: 14.21,
		THB: 30.69,
		TJS: 9.436118,
		TMT: 3.507479,
		TND: 2.877345,
		TOP: 2.287117,
		TRY: 5.563143,
		TTD: 6.77505,
		TWD: 31.091262,
		TZS: 2299.113497,
		UAH: 25.099,
		UGX: 3700.422281,
		USD: 1,
		UYU: 34.294956,
		UZS: 8660,
		VEF: 248487.642241,
		VES: 9824.340992,
		VND: 23260.27826,
		VUV: 115.626532,
		WST: 2.624095,
		XAF: 589.153329,
		XAG: 0.06083844,
		XAU: 0.00070036,
		XCD: 2.70255,
		XDR: 0.727201,
		XOF: 589.153329,
		XPD: 0.00065042,
		XPF: 107.178814,
		XPT: 0.00114287,
		YER: 250.350747,
		ZAR: 14.173263,
		ZMW: 12.876026,
		ZWL: 322.000001
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
	
	let cached_response = <CurrenciesDataSuccessResponse>{
		error: ERROR_CODES.SUCCESS,
		base: api_res.base,
		rates: api_res.rates
	};
	
	Cache.createCache('currencies_cache', 1000*60*60*24, cached_response);
	
	return cached_response;
}