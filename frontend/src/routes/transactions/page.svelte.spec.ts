import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import { auth } from '$lib/auth/auth.store.svelte';
import type { Paginated, Transaction } from '$lib/transactions/types';
import * as api from '$lib/transactions/api';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('$lib/transactions/api', () => ({ fetchTransactions: vi.fn() }));

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

function paginated(results: Transaction[]): Paginated<Transaction> {
	return { count: results.length, next: null, previous: null, results };
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
		fetchTransactions.mockResolvedValue(paginated([expense, income, transfer]));
		render(Page);

		await expect.element(page.getByText('Food · Groceries')).toBeInTheDocument();
		await expect.element(page.getByText('−12.50')).toBeInTheDocument();
		await expect.element(page.getByText('+100.00')).toBeInTheDocument();
		await expect.element(page.getByText('lunch')).toBeInTheDocument();
	});

	it('labels a transfer with both account legs and no category', async () => {
		fetchTransactions.mockResolvedValue(paginated([transfer]));
		render(Page);

		await expect.element(page.getByText('Checking → Savings')).toBeInTheDocument();
		await expect.element(page.getByText('—')).toBeInTheDocument();
	});

	it('shows an empty state when there are no transactions', async () => {
		fetchTransactions.mockResolvedValue(paginated([]));
		render(Page);

		await expect.element(page.getByText('No transactions yet.')).toBeInTheDocument();
	});

	it('shows the error detail when the request fails', async () => {
		fetchTransactions.mockRejectedValue(new ApiError(500, 'Server exploded.'));
		render(Page);

		await expect.element(page.getByText('Server exploded.')).toBeInTheDocument();
	});
});
