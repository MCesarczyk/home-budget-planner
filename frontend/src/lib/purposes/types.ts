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

export interface Purpose {
	id: number;
	name: string;
	description: string;
	target_amount: string | null;
}

export interface PurposeInput {
	name: string;
	description: string;
	target_amount: string | null;
}
