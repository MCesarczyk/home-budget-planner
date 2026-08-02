import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import {
	createPurpose,
	deletePurpose,
	fetchPurposeList,
	fetchPurposes,
	updatePurpose
} from './api';
import type { Purpose, PurposeInput, PurposesReport } from './types';

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

const purpose: Purpose = {
	id: 3,
	name: 'Emergency',
	description: '',
	target_amount: '10000.00',
	is_off_budget: false
};

const input: PurposeInput = {
	name: 'Emergency',
	description: '',
	target_amount: '10000.00',
	is_off_budget: false
};

describe('purposes CRUD', () => {
	it('fetchPurposeList hits the purposes endpoint', async () => {
		apiJson.mockResolvedValueOnce({ next: null, results: [purpose] });
		await expect(fetchPurposeList()).resolves.toEqual([purpose]);
		expect(apiJson.mock.calls[0][0]).toBe('/purposes/');
	});

	it('createPurpose POSTs the payload', async () => {
		apiJson.mockResolvedValueOnce(purpose);
		await createPurpose(input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/purposes/');
		expect((opts as RequestInit).method).toBe('POST');
		expect(JSON.parse((opts as RequestInit).body as string)).toEqual(input);
	});

	it('updatePurpose PATCHes the given purpose', async () => {
		apiJson.mockResolvedValueOnce(purpose);
		await updatePurpose(3, input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/purposes/3/');
		expect((opts as RequestInit).method).toBe('PATCH');
	});

	it('deletePurpose DELETEs the given purpose', async () => {
		apiJson.mockResolvedValueOnce(undefined);
		await deletePurpose(3);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/purposes/3/');
		expect((opts as RequestInit).method).toBe('DELETE');
	});
});
