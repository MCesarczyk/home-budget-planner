export interface PurposeAccount {
	id: number;
	name: string;
	balance: string;
}

export interface PurposeProgress {
	id: number;
	name: string;
	target_amount: string | null;
	current_amount: string;
	progress: number | null;
	accounts: PurposeAccount[];
}

export interface PurposesReport {
	purposes: PurposeProgress[];
}
