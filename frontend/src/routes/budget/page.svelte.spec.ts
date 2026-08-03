import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import { auth } from '$lib/auth/auth.store.svelte';
import * as budgetsApi from '$lib/budgets/api';
import type { BudgetPlanDetail, BudgetProgressReport } from '$lib/budgets/types';
import { resetNav, setUrl } from './nav.mock.svelte';
import Page from './+page.svelte';

vi.mock('$app/state', async () => ({ page: (await import('./nav.mock.svelte')).page }));
vi.mock('$app/navigation', async () => ({ goto: (await import('./nav.mock.svelte')).goto }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('$lib/budgets/api', () => ({
	fetchBudgetPlans: vi.fn(),
	fetchBudgetProgress: vi.fn(),
	fetchCurrentBudgetProgress: vi.fn(),
	createBudgetPlan: vi.fn(),
	updateBudgetPlan: vi.fn(),
	deleteBudgetPlan: vi.fn()
}));
// The plan modal loads the subcategory picker when opened.
vi.mock('$lib/transactions/api', () => ({
	fetchCategories: vi.fn().mockResolvedValue([]),
	fetchSubcategories: vi.fn().mockResolvedValue([])
}));

const fetchBudgetPlans = vi.mocked(budgetsApi.fetchBudgetPlans);
const fetchBudgetProgress = vi.mocked(budgetsApi.fetchBudgetProgress);
const fetchCurrentBudgetProgress = vi.mocked(budgetsApi.fetchCurrentBudgetProgress);

function makePlan(id: number, month: string): BudgetPlanDetail {
	return { id, month, planned_income: '0.00', planned_expense: '0.00', items: [] };
}

const plans: BudgetPlanDetail[] = [makePlan(5, '2023-12-01'), makePlan(4, '2023-11-01')];

function makeReport(id: number, month: string, catName: string): BudgetProgressReport {
	return {
		id,
		month,
		categories: [
			{
				id: 3,
				name: catName,
				kind: 'expense',
				planned: '1500.00',
				actual: '1500.00',
				remaining: '0.00',
				progress: 1.0,
				subcategories: []
			}
		],
		totals: {
			income: { planned: '0.00', actual: '0.00', remaining: '0.00', progress: null },
			expense: { planned: '1500.00', actual: '1500.00', remaining: '0.00', progress: 1.0 }
		}
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	resetNav();
	fetchBudgetPlans.mockResolvedValue(plans);
	fetchCurrentBudgetProgress.mockResolvedValue(makeReport(5, '2023-12-01', 'December Housing'));
	fetchBudgetProgress.mockResolvedValue(makeReport(4, '2023-11-01', 'November Housing'));
	auth.user = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };
	auth.loading = false;
});
afterEach(() => {
	auth.user = null;
	auth.loading = true;
});

describe('budget page', () => {
	it('loads the current plan and its month options', async () => {
		render(Page);
		await expect.element(page.getByText('December Housing')).toBeInTheDocument();
		// The selector is populated with a month option per plan.
		await expect.element(page.getByRole('option', { name: 'November 2023' })).toBeInTheDocument();
		expect(fetchCurrentBudgetProgress).toHaveBeenCalled();
		expect(fetchBudgetPlans).toHaveBeenCalled();
	});

	it('loads a different plan when a month is selected', async () => {
		render(Page);
		await expect.element(page.getByText('December Housing')).toBeInTheDocument();

		await page.getByRole('combobox', { name: 'Budget month' }).selectOptions('4');

		await expect.element(page.getByText('November Housing')).toBeInTheDocument();
		expect(fetchBudgetProgress).toHaveBeenCalledWith(4);

		const { page: navPage } = await import('./nav.mock.svelte');
		await vi.waitFor(() => expect(navPage.url.searchParams.get('month')).toBe('2023-11'));
	});

	it('loads the month from the URL on deep link', async () => {
		setUrl('/budget?month=2023-11');
		render(Page);

		await expect.element(page.getByText('November Housing')).toBeInTheDocument();
		expect(fetchBudgetProgress).toHaveBeenCalledWith(4);
		await expect
			.element(page.getByRole('combobox', { name: 'Budget month' }))
			.toHaveValue('4');
	});

	it('shows an empty state when no plan is in effect', async () => {
		fetchCurrentBudgetProgress.mockRejectedValue(new ApiError(404, 'No budget plan is in effect.'));
		fetchBudgetPlans.mockResolvedValue([]);
		render(Page);
		await expect.element(page.getByText('No budget plan yet.')).toBeInTheDocument();
	});

	it('surfaces a non-404 load error', async () => {
		fetchCurrentBudgetProgress.mockRejectedValue(new ApiError(500, 'Budget boom.'));
		render(Page);
		await expect.element(page.getByText('Budget boom.')).toBeInTheDocument();
	});

	it('opens the create modal from "New plan"', async () => {
		render(Page);
		await expect.element(page.getByText('December Housing')).toBeInTheDocument();
		await page.getByRole('button', { name: 'New plan' }).click();
		await expect.element(page.getByRole('dialog', { name: 'New budget plan' })).toBeInTheDocument();
	});

	it('opens the edit modal for the selected month', async () => {
		render(Page);
		await expect.element(page.getByText('December Housing')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Edit' }).click();
		await expect
			.element(page.getByRole('dialog', { name: 'Edit budget plan' }))
			.toBeInTheDocument();
	});
});
