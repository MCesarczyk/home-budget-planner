import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import BudgetPlanModal from './BudgetPlanModal.svelte';
import * as budgetsApi from './api';
import * as txApi from '$lib/transactions/api';
import type { Category, Subcategory } from '$lib/transactions/types';
import type { BudgetPlanDetail } from './types';

vi.mock('./api', () => ({
	createBudgetPlan: vi.fn(),
	updateBudgetPlan: vi.fn(),
	deleteBudgetPlan: vi.fn()
}));
vi.mock('$lib/transactions/api', () => ({
	fetchCategories: vi.fn(),
	fetchSubcategories: vi.fn()
}));

const createBudgetPlan = vi.mocked(budgetsApi.createBudgetPlan);
const updateBudgetPlan = vi.mocked(budgetsApi.updateBudgetPlan);
const deleteBudgetPlan = vi.mocked(budgetsApi.deleteBudgetPlan);
const fetchCategories = vi.mocked(txApi.fetchCategories);
const fetchSubcategories = vi.mocked(txApi.fetchSubcategories);

const categories: Category[] = [{ id: 3, name: 'Housing', kind: 'expense' }];
const subcategories: Subcategory[] = [{ id: 6, name: 'Rent', category: 3 }];

const plan: BudgetPlanDetail = {
	id: 5,
	month: '2023-12-01',
	planned_income: '0.00',
	planned_expense: '1500.00',
	items: [
		{
			id: 1,
			amount: '1500.00',
			subcategory: { id: 6, name: 'Rent', category: { id: 3, name: 'Housing', kind: 'expense' } }
		}
	]
};

beforeEach(() => {
	vi.clearAllMocks();
	fetchCategories.mockResolvedValue(categories);
	fetchSubcategories.mockResolvedValue(subcategories);
	createBudgetPlan.mockResolvedValue(plan);
	updateBudgetPlan.mockResolvedValue(plan);
	deleteBudgetPlan.mockResolvedValue(undefined);
});

describe('BudgetPlanModal', () => {
	it('creates a plan and reports the saved result', async () => {
		const onsaved = vi.fn();
		render(BudgetPlanModal, {
			open: true,
			plan: null,
			onclose: vi.fn(),
			onsaved,
			ondeleted: vi.fn()
		});

		await page.getByRole('checkbox', { name: 'Include Rent' }).click();
		await page.getByRole('spinbutton', { name: 'Amount for Rent' }).fill('1500');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() => expect(createBudgetPlan).toHaveBeenCalled());
		expect(onsaved).toHaveBeenCalledWith(plan);
	});

	it('updates an existing plan', async () => {
		const onsaved = vi.fn();
		render(BudgetPlanModal, {
			open: true,
			plan,
			onclose: vi.fn(),
			onsaved,
			ondeleted: vi.fn()
		});

		await expect
			.element(page.getByRole('dialog', { name: 'Edit budget plan' }))
			.toBeInTheDocument();
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() => expect(updateBudgetPlan).toHaveBeenCalled());
		expect(updateBudgetPlan.mock.calls[0][0]).toBe(5);
	});

	it('deletes a plan after confirmation', async () => {
		const ondeleted = vi.fn();
		render(BudgetPlanModal, {
			open: true,
			plan,
			onclose: vi.fn(),
			onsaved: vi.fn(),
			ondeleted
		});

		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();

		await vi.waitFor(() => expect(deleteBudgetPlan).toHaveBeenCalledWith(5));
		expect(ondeleted).toHaveBeenCalled();
	});

	it('clears a previous error when reopened', async () => {
		updateBudgetPlan.mockRejectedValue(new ApiError(400, 'Save failed.'));
		const props = { open: true, plan, onclose: vi.fn(), onsaved: vi.fn(), ondeleted: vi.fn() };
		const { rerender } = render(BudgetPlanModal, props);

		// Trigger a save error.
		await page.getByRole('button', { name: 'Save' }).click();
		await expect.element(page.getByText('Save failed.')).toBeInTheDocument();

		// Close, then reopen — the stale error must be gone.
		await rerender({ ...props, open: false });
		await rerender({ ...props, open: true });
		await expect.element(page.getByText('Save failed.')).not.toBeInTheDocument();
	});

	it('inherits the template into a new plan and creates it for the next month', async () => {
		const onsaved = vi.fn();
		render(BudgetPlanModal, {
			open: true,
			plan: null,
			template: plan,
			onclose: vi.fn(),
			onsaved,
			ondeleted: vi.fn()
		});

		await expect.element(page.getByRole('dialog', { name: 'New budget plan' })).toBeInTheDocument();
		await expect.element(page.getByRole('checkbox', { name: 'Include Rent' })).toBeChecked();

		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() => expect(createBudgetPlan).toHaveBeenCalled());
		// Template month is 2023-12 → new plan defaults to 2024-01, lines inherited.
		expect(createBudgetPlan).toHaveBeenCalledWith({
			month: '2024-01-01',
			items: [{ subcategory: 6, amount: '1500' }]
		});
		expect(onsaved).toHaveBeenCalled();
	});
});
