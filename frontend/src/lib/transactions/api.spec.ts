import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { fetchTransactions } from './api';
import type { Paginated, Transaction } from './types';

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

	it('returns the pagination envelope from the endpoint', async () => {
		const payload = pageOf([tx(1)], 'http://x/api/v1/transactions/?page=2');
		apiJson.mockResolvedValueOnce(payload);
		await expect(fetchTransactions()).resolves.toEqual(payload);
	});
});
