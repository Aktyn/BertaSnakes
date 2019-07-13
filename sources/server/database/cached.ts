
let total_accounts = 0;//cached counter

export function getTotalAccounts() {
	return total_accounts;
}

export function setTotalAccounts(n: number) {
	total_accounts = n;
}

export function onAccountInserted() {
	total_accounts++;
}