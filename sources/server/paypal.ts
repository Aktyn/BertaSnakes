import * as paypal from 'paypal-rest-sdk';
import {getArgument} from "./utils";

export {Payment} from 'paypal-rest-sdk';

const PAYPAL_SECRET = getArgument('PAYPAL_SECRET');

// noinspection SpellCheckingInspection
paypal.configure({
	'mode': 'sandbox',//sandbox or live
    'client_id': 'AUTSJDYtxBXnsESkwRqjWKE1weE0mydwySz0U8F7U9n1Y3MWgCyDW4kJ8ojj7ku4C8x3sT9Sp8dtqMZQ',
    'client_secret': PAYPAL_SECRET,
});

export default {
	createPayment(origin: string, name: string, sku: string, price: number, currency: string, description: string):
		Promise<paypal.Payment>
	{
		return new Promise((resolve, reject) => {
			
			const create_payment_json: paypal.Payment = {
				"intent": "sale",
				"payer": {
					"payment_method": "paypal"
				},
				"redirect_urls": {
					"return_url": origin + '/payment_result/success',
					"cancel_url": origin + '/payment_result/cancel'
				},
				"transactions": [{
					"item_list": {
						"items": [{
							"name": name,
							"sku": sku,//merchandise code
							"price": price.toFixed(2).toString(),
							"currency": currency,
							"quantity": 1
						}]
					},
					"amount": {
						"currency": currency,
						"total": price.toFixed(2).toString(),
					},
					"description": description
				}]
			};
			
			paypal.payment.create(create_payment_json, function(error, payment) {
				if (error)
					reject(error);
				else
					resolve(payment);
			});
			
		});
	},
	
	executePayment(paymentId: string, payer_id: string): Promise<paypal.Payment> {
		return new Promise((resolve, reject) => {
			
			const execute_payment_json = {
				payer_id: payer_id
			};
			
			paypal.payment.execute(paymentId, execute_payment_json,function(error, payment) {
				if (error)
					reject(error);
				else
					resolve(payment);
			});
		});
	}
}