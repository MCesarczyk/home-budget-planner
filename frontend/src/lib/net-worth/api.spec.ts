import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { fetchNetWorth } from './api';
import type { NetWorthReport } from './types';

vi.mock('../api/client', () => ({ apiJson: vi.fn() }));

const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

describe('fetchNetWorth', () => {
	it('GETs the net-worth report endpoint', async () => {
		const report: NetWorthReport = {
			assets: [{ id: 1, name: 'Checking', type: 'checking', balance: '100.00' }],
			total_assets: '100.00',
			liabilities: [],
			total_liabilities: '0.00',
			net_worth: '100.00'
		};
		apiJson.mockResolvedValueOnce(report);
		await expect(fetchNetWorth()).resolves.toEqual(report);
		expect(apiJson.mock.calls[0][0]).toBe('/reports/net-worth/');
	});
});
