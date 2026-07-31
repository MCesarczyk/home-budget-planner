import { apiJson } from '../api/client';
import type { BudgetPlanRef, BudgetProgressReport } from './types';

interface Page<T> {
	next: string | null;
	results: T[];
}

async function fetchAll<T>(path: string): Promise<T[]> {
	const results: T[] = [];
	let page = 1;
	for (;;) {
		const data = await apiJson<Page<T>>(`${path}${page > 1 ? `?page=${page}` : ''}`);
		results.push(...data.results);
		if (!data.next) break;
		page += 1;
	}
	return results;
}

// Month list for the plan selector (only id + month are used here).
export function fetchBudgetPlans(): Promise<BudgetPlanRef[]> {
	return fetchAll<BudgetPlanRef>('/budget-plans/');
}

// Plan-vs-actual for one plan.
export function fetchBudgetProgress(id: number): Promise<BudgetProgressReport> {
	return apiJson<BudgetProgressReport>(`/budget-plans/${id}/progress/`);
}

// Progress for the plan currently in effect (current month, or the most recent
// prior month). 404s when no plan exists yet.
export function fetchCurrentBudgetProgress(): Promise<BudgetProgressReport> {
	return apiJson<BudgetProgressReport>('/budget-plans/current/progress/');
}
