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
	it('requests the list endpoint without date params by default', async () => {
		apiJson.mockResolvedValueOnce(pageOf([tx(1)], null));
		const result = await fetchTransactions();
		const path = apiJson.mock.calls[0][0] as string;
		expect(path).toContain('/transactions/');
		expect(path).not.toContain('date_from');
		expect(result).toEqual([tx(1)]);
	});

	it('passes the date range as query params', async () => {
		apiJson.mockResolvedValueOnce(pageOf([], null));
		await fetchTransactions({ dateFrom: '2026-07-01', dateTo: '2026-07-31' });
		const path = apiJson.mock.calls[0][0] as string;
		expect(path).toContain('date_from=2026-07-01');
		expect(path).toContain('date_to=2026-07-31');
	});

	it('follows pagination and concatenates every page', async () => {
		apiJson
			.mockResolvedValueOnce(pageOf([tx(1)], 'http://x/api/v1/transactions/?page=2'))
			.mockResolvedValueOnce(pageOf([tx(2)], null));
		const result = await fetchTransactions();
		expect(result.map((t) => t.id)).toEqual([1, 2]);
		expect(apiJson).toHaveBeenCalledTimes(2);
	});
});
