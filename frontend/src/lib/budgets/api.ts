import { apiJson } from '../api/client';
import type { BudgetPlanDetail, BudgetPlanInput, BudgetProgressReport } from './types';

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

// Full plan list — carries each plan's items, so it feeds both the month
// selector and the edit form without a per-plan fetch.
export function fetchBudgetPlans(): Promise<BudgetPlanDetail[]> {
	return fetchAll<BudgetPlanDetail>('/budget-plans/');
}

export function createBudgetPlan(input: BudgetPlanInput): Promise<BudgetPlanDetail> {
	return apiJson<BudgetPlanDetail>('/budget-plans/', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

// PUT replaces the plan's item set wholesale — the whole-month edit semantics.
export function updateBudgetPlan(id: number, input: BudgetPlanInput): Promise<BudgetPlanDetail> {
	return apiJson<BudgetPlanDetail>(`/budget-plans/${id}/`, {
		method: 'PUT',
		body: JSON.stringify(input)
	});
}

export function deleteBudgetPlan(id: number): Promise<void> {
	return apiJson<void>(`/budget-plans/${id}/`, { method: 'DELETE' });
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
