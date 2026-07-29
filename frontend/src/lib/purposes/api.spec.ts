import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { fetchPurposes } from './api';
import type { PurposesReport } from './types';

vi.mock('../api/client', () => ({ apiJson: vi.fn() }));

const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

describe('fetchPurposes', () => {
	it('GETs the purposes report endpoint', async () => {
		const report: PurposesReport = {
			purposes: [
				{
					id: 3,
					name: 'Emergency Fund',
					target_amount: '10000.00',
					current_amount: '6500.00',
					progress: 0.65,
					accounts: [{ id: 1, name: 'Savings', balance: '6500.00' }]
				}
			]
		};
		apiJson.mockResolvedValueOnce(report);
		await expect(fetchPurposes()).resolves.toEqual(report);
		expect(apiJson.mock.calls[0][0]).toBe('/reports/purposes/');
	});
});
