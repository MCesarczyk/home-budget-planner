// Money fields arrive as strings (DRF DecimalField); `progress` is actual/planned
// or null when there is no plan line to measure against (unbudgeted spend).
export interface ProgressLine {
	id: number;
	name: string;
	planned: string;
	actual: string;
	remaining: string;
	progress: number | null;
}

export interface ProgressCategory extends ProgressLine {
	kind: 'income' | 'expense';
	subcategories: ProgressLine[];
}

export interface ProgressTotal {
	planned: string;
	actual: string;
	remaining: string;
	progress: number | null;
}

export interface BudgetProgressReport {
	id: number;
	month: string; // YYYY-MM-DD (first of the month)
	categories: ProgressCategory[];
	totals: {
		income: ProgressTotal;
		expense: ProgressTotal;
	};
}

import type { SubcategoryNested } from '$lib/transactions/types';

// The list/read shape of a plan: its items with each subcategory expanded. Used
// both for the month selector and to seed the edit form (no extra fetch needed).
export interface BudgetItemDetail {
	id: number;
	amount: string;
	subcategory: SubcategoryNested;
}

export interface BudgetPlanDetail {
	id: number;
	month: string;
	planned_income: string;
	planned_expense: string;
	items: BudgetItemDetail[];
}

// Write payload for create/replace.
export interface BudgetPlanInput {
	month: string; // YYYY-MM-DD
	items: { subcategory: number; amount: string }[];
}
