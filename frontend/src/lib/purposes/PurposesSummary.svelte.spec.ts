import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PurposesSummary from './PurposesSummary.svelte';
import type { PurposesReport } from './types';

const report: PurposesReport = {
	purposes: [
		{
			id: 1,
			name: 'Emergency Fund',
			target_amount: '10000.00',
			current_amount: '6500.00',
			progress: 0.65,
			accounts: [{ id: 1, name: 'Savings', balance: '6500.00' }]
		},
		{
			id: 2,
			name: 'Rainy Day',
			target_amount: null,
			current_amount: '300.00',
			progress: null,
			accounts: []
		}
	]
};

describe('PurposesSummary', () => {
	it('shows each purpose with its progress and amounts', async () => {
		render(PurposesSummary, { report, loading: false, error: '' });

		await expect.element(page.getByText('Emergency Fund')).toBeInTheDocument();
		await expect.element(page.getByText('65%')).toBeInTheDocument();
		await expect.element(page.getByText('/ 10000.00')).toBeInTheDocument();
		await expect.element(page.getByText('Savings')).toBeInTheDocument();
	});

	it('shows "No target set" when a purpose has no target', async () => {
		render(PurposesSummary, { report, loading: false, error: '' });
		await expect.element(page.getByText('No target set')).toBeInTheDocument();
	});

	it('renders the empty state when there are no purposes', async () => {
		render(PurposesSummary, {
			report: { purposes: [] },
			loading: false,
			error: ''
		});
		await expect.element(page.getByText('No purposes defined.')).toBeInTheDocument();
	});

	it('shows the error message', async () => {
		render(PurposesSummary, { report: null, loading: false, error: 'Failed to load purposes.' });
		await expect.element(page.getByText('Failed to load purposes.')).toBeInTheDocument();
	});
});
