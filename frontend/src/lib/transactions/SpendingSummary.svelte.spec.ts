import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import SpendingSummary from './SpendingSummary.svelte';
import type { SpendingReport } from './types';

const report: SpendingReport = {
	date_from: '2026-07-01',
	date_to: '2026-07-31',
	total: '300.00',
	categories: [
		{
			id: 1,
			name: 'Food',
			kind: 'expense',
			total: '200.00',
			subcategories: [{ id: 10, name: 'Groceries', total: '200.00' }]
		},
		{
			id: 2,
			name: 'Transport',
			kind: 'expense',
			total: '100.00',
			subcategories: [{ id: 20, name: 'Fuel', total: '100.00' }]
		}
	]
};

describe('SpendingSummary', () => {
	it('shows the total and category rows', async () => {
		render(SpendingSummary, { report, loading: false, error: '', label: 'This month' });

		await expect.element(page.getByText('This month')).toBeInTheDocument();
		await expect.element(page.getByText('300.00')).toBeInTheDocument();
		await expect.element(page.getByText('Food')).toBeInTheDocument();
		await expect.element(page.getByText('Transport')).toBeInTheDocument();
	});

	it('hides subcategories until a category is expanded', async () => {
		render(SpendingSummary, { report, loading: false, error: '', label: 'This month' });

		await expect.element(page.getByText('Groceries')).not.toBeInTheDocument();
		await page.getByRole('button', { name: /Food/ }).click();
		await expect.element(page.getByText('Groceries')).toBeInTheDocument();
	});

	it('renders the empty state when there is no spending', async () => {
		render(SpendingSummary, {
			report: { date_from: null, date_to: null, total: '0.00', categories: [] },
			loading: false,
			error: '',
			label: 'All time'
		});

		await expect.element(page.getByText('No spending in this period.')).toBeInTheDocument();
	});

	it('shows the error message', async () => {
		render(SpendingSummary, {
			report: null,
			loading: false,
			error: 'Failed to load spending.',
			label: 'This month'
		});

		await expect.element(page.getByText('Failed to load spending.')).toBeInTheDocument();
	});
});
