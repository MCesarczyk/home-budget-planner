import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import {
	createTransaction,
	fetchAccounts,
	fetchCategories,
	fetchSpending,
	fetchSubcategories,
	fetchTransactions
} from './api';
import type {
	Account,
	Category,
	Paginated,
	SpendingReport,
	Subcategory,
	Transaction
} from './types';

vi.mock('../api/client', () => ({ apiJson: vi.fn() }));

const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

function tx(id: number): Transaction {
	return {
		id,
		type: 'expense',
		tx_date: '2026-07-01',
		amount: '1.00',
		comment: '',
		source_account: { id: 1, name: 'Checking' },
		destination_account: null,
		subcategory: { id: 1, name: 'Groceries', category: { id: 1, name: 'Food', kind: 'expense' } }
	};
}

function pageOf(results: Transaction[], next: string | null): Paginated<Transaction> {
	return { count: 0, next, previous: null, results };
}

describe('fetchTransactions', () => {
	it('requests the list endpoint without date or page params by default', async () => {
		apiJson.mockResolvedValueOnce(pageOf([tx(1)], null));
		const result = await fetchTransactions();
		expect(apiJson.mock.calls[0][0]).toBe('/transactions/');
		expect(result.results).toEqual([tx(1)]);
	});

	it('passes the date range as query params', async () => {
		apiJson.mockResolvedValueOnce(pageOf([], null));
		await fetchTransactions({ dateFrom: '2026-07-01', dateTo: '2026-07-31' });
		const path = apiJson.mock.calls[0][0] as string;
		expect(path).toContain('date_from=2026-07-01');
		expect(path).toContain('date_to=2026-07-31');
	});

	it('requests the given page (and omits page=1)', async () => {
		apiJson.mockResolvedValueOnce(pageOf([], null));
		await fetchTransactions({}, 3);
		expect(apiJson.mock.calls[0][0]).toContain('page=3');
	});

	it('passes category and subcategory as query params', async () => {
		apiJson.mockResolvedValueOnce(pageOf([], null));
		await fetchTransactions({ category: 2, subcategory: 7 });
		const path = apiJson.mock.calls[0][0] as string;
		expect(path).toContain('category=2');
		expect(path).toContain('subcategory=7');
	});

	it('returns the pagination envelope from the endpoint', async () => {
		const payload = pageOf([tx(1)], 'http://x/api/v1/transactions/?page=2');
		apiJson.mockResolvedValueOnce(payload);
		await expect(fetchTransactions()).resolves.toEqual(payload);
	});
});

describe('fetchCategories / fetchSubcategories', () => {
	it('fetches all categories, following pagination', async () => {
		const a: Category = { id: 1, name: 'Food', kind: 'expense' };
		const b: Category = { id: 2, name: 'Work', kind: 'income' };
		apiJson
			.mockResolvedValueOnce({
				count: 2,
				next: 'http://x/api/v1/categories/?page=2',
				previous: null,
				results: [a]
			} as Paginated<Category>)
			.mockResolvedValueOnce({ count: 2, next: null, previous: null, results: [b] });
		await expect(fetchCategories()).resolves.toEqual([a, b]);
		expect(apiJson).toHaveBeenCalledTimes(2);
	});

	it('fetches subcategories from the subcategories endpoint', async () => {
		const s: Subcategory = { id: 10, name: 'Groceries', category: 1 };
		apiJson.mockResolvedValueOnce({ count: 1, next: null, previous: null, results: [s] });
		await expect(fetchSubcategories()).resolves.toEqual([s]);
		expect(apiJson.mock.calls[0][0]).toBe('/subcategories/');
	});
});

describe('fetchSpending', () => {
	const report: SpendingReport = {
		date_from: '2026-07-01',
		date_to: '2026-07-31',
		total: '100.00',
		categories: []
	};

	it('hits the spending report endpoint with the date range', async () => {
		apiJson.mockResolvedValueOnce(report);
		await fetchSpending({ dateFrom: '2026-07-01', dateTo: '2026-07-31' });
		const path = apiJson.mock.calls[0][0] as string;
		expect(path).toContain('/reports/spending/');
		expect(path).toContain('date_from=2026-07-01');
		expect(path).toContain('date_to=2026-07-31');
	});

	it('omits the query string when no range is given', async () => {
		apiJson.mockResolvedValueOnce(report);
		await fetchSpending();
		expect(apiJson.mock.calls[0][0]).toBe('/reports/spending/');
	});
});

describe('fetchAccounts', () => {
	it('fetches accounts from the accounts endpoint', async () => {
		const a: Account = { id: 1, name: 'Checking', is_active: true };
		apiJson.mockResolvedValueOnce({ count: 1, next: null, previous: null, results: [a] });
		await expect(fetchAccounts()).resolves.toEqual([a]);
		expect(apiJson.mock.calls[0][0]).toBe('/accounts/');
	});
});

describe('createTransaction', () => {
	it('POSTs the payload to the transactions endpoint', async () => {
		apiJson.mockResolvedValueOnce({} as Transaction);
		const input = {
			tx_date: '2026-07-01',
			amount: '10.00',
			comment: 'x',
			source_account: 1,
			subcategory: 2
		};
		await createTransaction(input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/transactions/');
		expect((opts as RequestInit).method).toBe('POST');
		expect(JSON.parse((opts as RequestInit).body as string)).toEqual(input);
	});
});
