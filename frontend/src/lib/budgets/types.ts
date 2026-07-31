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

// Minimal plan reference for the month selector (the list endpoint returns more).
export interface BudgetPlanRef {
	id: number;
	month: string;
}
