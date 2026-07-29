export interface AccountBalance {
	id: number;
	name: string;
	type: string;
	balance: string;
}

export interface NetWorthReport {
	assets: AccountBalance[];
	total_assets: string;
	liabilities: AccountBalance[];
	total_liabilities: string;
	net_worth: string;
}
