export type AccountType = 'checking' | 'savings' | 'investment' | 'liability';

export interface Account {
	id: number;
	name: string;
	type: AccountType;
	opening_balance: string;
	purpose: number | null;
	is_active: boolean;
	balance: string;
	is_liability: boolean;
}

export interface AccountInput {
	name: string;
	type: AccountType;
	opening_balance: string;
	purpose: number | null;
	is_active: boolean;
}

export interface PurposeOption {
	id: number;
	name: string;
}
