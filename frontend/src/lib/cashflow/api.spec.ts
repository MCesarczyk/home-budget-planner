import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { fetchCashflow } from './api';
import type { CashflowReport } from './types';

vi.mock('../api/client', () => ({ apiJson: vi.fn() }));

const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

const report: CashflowReport = {
	date_from: null,
	date_to: null,
	months: [{ month: '2026-01', income: '5000.00', expense: '3200.00', net: '1800.00' }],
	totals: { income: '5000.00', expense: '3200.00', net: '1800.00' }
};

describe('fetchCashflow', () => {
	it('GETs the cashflow endpoint with no params by default', async () => {
		apiJson.mockResolvedValueOnce(report);
		await expect(fetchCashflow()).resolves.toEqual(report);
		expect(apiJson.mock.calls[0][0]).toBe('/reports/cashflow/');
	});

	it('passes the date range as query params', async () => {
		apiJson.mockResolvedValueOnce(report);
		await fetchCashflow({ dateFrom: '2026-01-01', dateTo: '2026-06-30' });
		const path = apiJson.mock.calls[0][0] as string;
		expect(path).toContain('date_from=2026-01-01');
		expect(path).toContain('date_to=2026-06-30');
	});
});
