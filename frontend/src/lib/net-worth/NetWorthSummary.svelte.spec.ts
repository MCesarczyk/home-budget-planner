import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import NetWorthSummary from './NetWorthSummary.svelte';
import type { NetWorthReport } from './types';

const report: NetWorthReport = {
	assets: [
		{ id: 1, name: 'Checking', type: 'checking', balance: '1234.56' },
		{ id: 2, name: 'Brokerage', type: 'investment', balance: '5000.00' }
	],
	total_assets: '6234.56',
	liabilities: [{ id: 3, name: 'Mortgage', type: 'liability', balance: '-98000.00' }],
	total_liabilities: '-98000.00',
	net_worth: '-91765.44'
};

describe('NetWorthSummary', () => {
	it('shows net worth, both groups, and totals', async () => {
		render(NetWorthSummary, { report, loading: false, error: '' });

		await expect.element(page.getByText('-91765.44')).toBeInTheDocument();
		await expect.element(page.getByText('Checking')).toBeInTheDocument();
		await expect.element(page.getByText('Brokerage')).toBeInTheDocument();
		await expect.element(page.getByText('Mortgage')).toBeInTheDocument();
		await expect.element(page.getByText('6234.56')).toBeInTheDocument();
		await expect.element(page.getByText('-98000.00').first()).toBeInTheDocument();
	});

	it('renders the empty state when there are no accounts', async () => {
		render(NetWorthSummary, {
			report: {
				assets: [],
				total_assets: '0.00',
				liabilities: [],
				total_liabilities: '0.00',
				net_worth: '0.00'
			},
			loading: false,
			error: ''
		});

		await expect.element(page.getByText('No accounts yet.')).toBeInTheDocument();
	});

	it('shows the error message', async () => {
		render(NetWorthSummary, { report: null, loading: false, error: 'Failed to load net worth.' });
		await expect.element(page.getByText('Failed to load net worth.')).toBeInTheDocument();
	});

	it('groups earmarked assets under a purpose subheading', async () => {
		render(NetWorthSummary, {
			report,
			loading: false,
			error: '',
			purposeByAccount: { 2: 'Retirement' }
		});

		// The purpose name appears as a subgroup heading, with its account beneath it.
		await expect.element(page.getByText('Retirement')).toBeInTheDocument();
		await expect.element(page.getByText('Brokerage')).toBeInTheDocument();
	});
});
