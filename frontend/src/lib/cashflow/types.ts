export interface CashflowMonth {
	month: string;
	income: string;
	expense: string;
	net: string;
}

export interface CashflowTotals {
	income: string;
	expense: string;
	net: string;
}

export interface CashflowReport {
	date_from: string | null;
	date_to: string | null;
	months: CashflowMonth[];
	totals: CashflowTotals;
}
