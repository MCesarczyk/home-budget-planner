import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { fetchTransactions } from './api';
import type { Paginated, Transaction } from './types';

vi.mock('../api/client', () => ({
	apiJson: vi.fn().mockResolvedValue(undefined)
}));

const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

describe('fetchTransactions', () => {
	it('GETs the transactions list endpoint', async () => {
		apiJson.mockResolvedValueOnce({ count: 0, next: null, previous: null, results: [] });
		await fetchTransactions();
		expect(apiJson).toHaveBeenCalledWith('/transactions/');
	});

	it('returns the paginated payload from the endpoint', async () => {
		const payload: Paginated<Transaction> = {
			count: 1,
			next: null,
			previous: null,
			results: [
				{
					id: 1,
					type: 'expense',
					tx_date: '2026-07-01',
					amount: '12.50',
					comment: '',
					source_account: { id: 1, name: 'Checking' },
					destination_account: null,
					subcategory: {
						id: 1,
						name: 'Groceries',
						category: { id: 1, name: 'Food', kind: 'expense' }
					}
				}
			]
		};
		apiJson.mockResolvedValueOnce(payload);
		await expect(fetchTransactions()).resolves.toEqual(payload);
	});
});
