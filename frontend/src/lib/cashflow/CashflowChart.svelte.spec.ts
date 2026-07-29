import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import CashflowChart from './CashflowChart.svelte';
import type { CashflowReport } from './types';

const report: CashflowReport = {
	date_from: null,
	date_to: null,
	months: [
		{ month: '2026-01', income: '5000.00', expense: '3200.00', net: '1800.00' },
		{ month: '2026-02', income: '4800.00', expense: '5100.00', net: '-300.00' }
	],
	totals: { income: '9800.00', expense: '8300.00', net: '1500.00' }
};

describe('CashflowChart', () => {
	it('renders totals, legend and month labels', async () => {
		render(CashflowChart, { report, loading: false, error: '' });

		await expect.element(page.getByText('Income', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Expense', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('9800.00')).toBeInTheDocument();
		await expect.element(page.getByText('Jan 26', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Feb 26', { exact: true })).toBeInTheDocument();
	});

	it('draws a bar per income and expense value', async () => {
		const { container } = render(CashflowChart, { report, loading: false, error: '' });
		// 2 months × 2 bars (income + expense) = 4 rects, plus none for gridlines (those are lines)
		expect(container.querySelectorAll('rect').length).toBe(4);
	});

	it('renders the empty state when there are no months', async () => {
		render(CashflowChart, {
			report: { date_from: null, date_to: null, months: [], totals: report.totals },
			loading: false,
			error: ''
		});
		await expect.element(page.getByText('No cash flow yet.')).toBeInTheDocument();
	});

	it('shows the error message', async () => {
		render(CashflowChart, { report: null, loading: false, error: 'Failed to load cash flow.' });
		await expect.element(page.getByText('Failed to load cash flow.')).toBeInTheDocument();
	});
});
