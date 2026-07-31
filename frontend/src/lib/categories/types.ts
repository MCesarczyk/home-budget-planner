export type CategoryKind = 'income' | 'expense';

export interface Category {
	id: number;
	name: string;
	kind: CategoryKind;
}

export interface CategoryInput {
	name: string;
	kind: CategoryKind;
}
