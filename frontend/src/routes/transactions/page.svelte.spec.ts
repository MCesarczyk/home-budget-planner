import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import { auth } from '$lib/auth/auth.store.svelte';
import type { Paginated, Transaction } from '$lib/transactions/types';
import { currentMonth, monthRange, shiftMonth } from '$lib/transactions/month';
import * as api from '$lib/transactions/api';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('$lib/transactions/api', () => ({ fetchTransactions: vi.fn(), PAGE_SIZE: 50 }));

const fetchTransactions = vi.mocked(api.fetchTransactions);

const expense: Transaction = {
	id: 1,
	type: 'expense',
	tx_date: '2026-07-01',
	amount: '12.50',
	comment: 'lunch',
	source_account: { id: 1, name: 'Checking' },
	destination_account: null,
	subcategory: { id: 1, name: 'Groceries', category: { id: 1, name: 'Food', kind: 'expense' } }
};
const income: Transaction = {
	id: 2,
	type: 'income',
	tx_date: '2026-07-02',
	amount: '100.00',
	comment: '',
	source_account: null,
	destination_account: { id: 2, name: 'Savings' },
	subcategory: { id: 2, name: 'Salary', category: { id: 2, name: 'Work', kind: 'income' } }
};
const transfer: Transaction = {
	id: 3,
	type: 'transfer',
	tx_date: '2026-07-03',
	amount: '50.00',
	comment: '',
	source_account: { id: 1, name: 'Checking' },
	destination_account: { id: 2, name: 'Savings' },
	subcategory: null
};

function envelope(results: Transaction[], count = results.length): Paginated<Transaction> {
	return { count, next: null, previous: null, results };
}

beforeEach(() => {
	vi.clearAllMocks();
	auth.user = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };
	auth.loading = false;
});
afterEach(() => {
	auth.user = null;
	auth.loading = true;
});

describe('transactions page', () => {
	it('renders a row per transaction with derived type, signed amount and category', async () => {
		fetchTransactions.mockResolvedValue(envelope([expense, income, transfer]));
		render(Page);

		await expect.element(page.getByText('Food · Groceries')).toBeInTheDocument();
		await expect.element(page.getByText('−12.50')).toBeInTheDocument();
		await expect.element(page.getByText('+100.00')).toBeInTheDocument();
		await expect.element(page.getByText('lunch')).toBeInTheDocument();
	});

	it('labels a transfer with both account legs and no category', async () => {
		fetchTransactions.mockResolvedValue(envelope([transfer]));
		render(Page);

		await expect.element(page.getByText('Checking → Savings')).toBeInTheDocument();
		await expect.element(page.getByText('—')).toBeInTheDocument();
	});

	it('shows the error detail when the request fails', async () => {
		fetchTransactions.mockRejectedValue(new ApiError(500, 'Server exploded.'));
		render(Page);

		await expect.element(page.getByText('Server exploded.')).toBeInTheDocument();
	});

	it('defaults to the current month and switches to no filter when All is chosen', async () => {
		fetchTransactions.mockResolvedValue(envelope([]));
		render(Page);

		await expect.element(page.getByText('No transactions this month.')).toBeInTheDocument();
		expect(fetchTransactions).toHaveBeenCalledWith(monthRange(currentMonth()), 1);

		await page.getByRole('button', { name: 'All' }).click();

		await expect.element(page.getByText('No transactions yet.')).toBeInTheDocument();
		await vi.waitFor(() => expect(fetchTransactions).toHaveBeenLastCalledWith({}, 1));
	});

	it('reloads with the previous month when stepping back', async () => {
		fetchTransactions.mockResolvedValue(envelope([]));
		render(Page);

		await expect.element(page.getByText('No transactions this month.')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Previous month' }).click();

		const expected = monthRange(shiftMonth(currentMonth(), -1));
		await vi.waitFor(() => expect(fetchTransactions).toHaveBeenLastCalledWith(expected, 1));
	});

	it('steps forward a page and requests the next page from the server', async () => {
		fetchTransactions.mockResolvedValue(envelope([expense], 120));
		render(Page);

		await expect.element(page.getByText('Page 1 of 3')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Next page' }).click();

		await expect.element(page.getByText('Page 2 of 3')).toBeInTheDocument();
		await vi.waitFor(() =>
			expect(fetchTransactions).toHaveBeenLastCalledWith(monthRange(currentMonth()), 2)
		);
	});

	it('resets to the first page when the filter changes', async () => {
		fetchTransactions.mockResolvedValue(envelope([expense], 120));
		render(Page);

		await expect.element(page.getByText('Page 1 of 3')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Next page' }).click();
		await expect.element(page.getByText('Page 2 of 3')).toBeInTheDocument();

		await page.getByRole('button', { name: 'All' }).click();

		await expect.element(page.getByText('Page 1 of 3')).toBeInTheDocument();
		await vi.waitFor(() => expect(fetchTransactions).toHaveBeenLastCalledWith({}, 1));
	});
});
