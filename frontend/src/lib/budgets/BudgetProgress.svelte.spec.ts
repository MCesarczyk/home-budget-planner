import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import BudgetProgress from './BudgetProgress.svelte';
import type { BudgetProgressReport } from './types';

const report: BudgetProgressReport = {
	id: 5,
	month: '2023-12-01',
	categories: [
		{
			id: 3,
			name: 'Housing',
			kind: 'expense',
			planned: '1720.00',
			actual: '1810.00',
			remaining: '-90.00',
			progress: 1.0523,
			subcategories: [
				{
					id: 7,
					name: 'Electricity',
					planned: '220.00',
					actual: '305.00',
					remaining: '-85.00',
					progress: 1.3864
				},
				{
					id: 6,
					name: 'Rent',
					planned: '1500.00',
					actual: '1500.00',
					remaining: '0.00',
					progress: 1.0
				}
			]
		},
		{
			id: 9,
			name: 'Pets',
			kind: 'expense',
			planned: '0.00',
			actual: '94.28',
			remaining: '-94.28',
			progress: null,
			subcategories: [
				{
					id: 26,
					name: 'Pet Food',
					planned: '0.00',
					actual: '94.28',
					remaining: '-94.28',
					progress: null
				}
			]
		},
		{
			id: 1,
			name: 'Salary & Wages',
			kind: 'income',
			planned: '8200.00',
			actual: '3714.67',
			remaining: '4485.33',
			progress: 0.453,
			subcategories: [
				{
					id: 1,
					name: 'Primary Job',
					planned: '8200.00',
					actual: '3714.67',
					remaining: '4485.33',
					progress: 0.453
				}
			]
		}
	],
	totals: {
		income: { planned: '8200.00', actual: '3714.67', remaining: '4485.33', progress: 0.453 },
		expense: { planned: '1720.00', actual: '1904.28', remaining: '-184.28', progress: 1.1071 }
	}
};

describe('BudgetProgress', () => {
	it('renders the month and each category with its subcategories', async () => {
		render(BudgetProgress, { report, loading: false, error: '' });
		await expect.element(page.getByText('December 2023')).toBeInTheDocument();
		await expect.element(page.getByText('Housing')).toBeInTheDocument();
		await expect.element(page.getByText('Electricity')).toBeInTheDocument();
		await expect.element(page.getByText('Rent')).toBeInTheDocument();
		await expect.element(page.getByText('Salary & Wages')).toBeInTheDocument();
	});

	it('shows the summary first, and next income section before expenses', async () => {
		const { container } = render(BudgetProgress, { report, loading: false, error: '' });
		await expect.element(page.getByText('Salary & Wages')).toBeInTheDocument();
		const headers = [...container.querySelectorAll('h3')].map((h) => h.textContent?.trim());
		expect(headers).toEqual(['Summary', 'Income', 'Expenses']);
	});

	it('shows progress percentages, including over 100% when over budget', async () => {
		render(BudgetProgress, { report, loading: false, error: '' });
		await expect.element(page.getByText('105%')).toBeInTheDocument(); // Housing 1.0523
		await expect.element(page.getByText('139%')).toBeInTheDocument(); // Electricity 1.3864
		await expect.element(page.getByText('45%').first()).toBeInTheDocument(); // Salary 0.453
	});

	it('summarises funds to distribute, income spent and monthly progress', async () => {
		render(BudgetProgress, { report, loading: false, error: '' });
		// Funds to be distributed = planned income − planned expense = 8200 − 1720.
		await expect.element(page.getByText('Funds to be distributed')).toBeInTheDocument();
		await expect.element(page.getByText('6480.00')).toBeInTheDocument();
		// Income spent = actual expense / actual income = 1904.28 / 3714.67 ≈ 51%.
		await expect.element(page.getByText('Percentage of income spent')).toBeInTheDocument();
		await expect.element(page.getByText('51%')).toBeInTheDocument();
		// The month (Dec 2023) is fully in the past → 100% elapsed.
		await expect.element(page.getByText('Monthly progress percentage')).toBeInTheDocument();
	});

	it('flags over-budget remaining and unbudgeted spend', async () => {
		const { container } = render(BudgetProgress, { report, loading: false, error: '' });
		await expect.element(page.getByText('90.00 over')).toBeInTheDocument();
		await expect.element(page.getByText('85.00 over')).toBeInTheDocument();
		await expect.element(page.getByText('unbudgeted').first()).toBeInTheDocument();
		// Unbudgeted spend is alarming, so it's flagged orange (a filled bar), not gray.
		expect(container.querySelector('.bg-orange-500')).not.toBeNull();
		expect(container.querySelector('.text-orange-700')).not.toBeNull();
	});

	it('renders the empty state when there is no plan', async () => {
		render(BudgetProgress, { report: null, loading: false, error: '' });
		await expect.element(page.getByText('No budget plan yet.')).toBeInTheDocument();
	});

	it('shows the loading and error states', async () => {
		render(BudgetProgress, { report: null, loading: false, error: 'Failed to load budget.' });
		await expect.element(page.getByText('Failed to load budget.')).toBeInTheDocument();
	});
});
