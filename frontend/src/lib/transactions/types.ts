export type TransactionType = 'income' | 'expense' | 'transfer';

export type CategoryKind = 'income' | 'expense';

export interface AccountRef {
	id: number;
	name: string;
}

export interface Category {
	id: number;
	name: string;
	kind: CategoryKind;
}

export interface SubcategoryNested {
	id: number;
	name: string;
	category: Category;
}

export interface Subcategory {
	id: number;
	name: string;
	category: number;
}

export interface Account {
	id: number;
	name: string;
	is_active: boolean;
}

export interface Transaction {
	id: number;
	type: TransactionType;
	tx_date: string;
	amount: string;
	comment: string;
	source_account: AccountRef | null;
	destination_account: AccountRef | null;
	subcategory: SubcategoryNested | null;
}

export interface Paginated<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}

export interface SpendingSubcategory {
	id: number;
	name: string;
	total: string;
}

export interface SpendingCategory {
	id: number;
	name: string;
	kind: string;
	total: string;
	subcategories: SpendingSubcategory[];
}

export interface SpendingReport {
	date_from: string | null;
	date_to: string | null;
	total: string;
	categories: SpendingCategory[];
}
