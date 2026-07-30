import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { createAccount, fetchAccounts, fetchPurposeOptions, updateAccount } from './api';
import type { Account, AccountInput } from './types';

vi.mock('../api/client', () => ({ apiJson: vi.fn() }));

const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

const account: Account = {
	id: 1,
	name: 'Checking',
	type: 'checking',
	opening_balance: '0.00',
	purpose: null,
	is_active: true,
	balance: '100.00',
	is_liability: false
};

const input: AccountInput = {
	name: 'Checking',
	type: 'checking',
	opening_balance: '0',
	purpose: null,
	is_active: true
};

describe('accounts api', () => {
	it('fetchAccounts hits the accounts endpoint', async () => {
		apiJson.mockResolvedValueOnce({ next: null, results: [account] });
		await expect(fetchAccounts()).resolves.toEqual([account]);
		expect(apiJson.mock.calls[0][0]).toBe('/accounts/');
	});

	it('fetchPurposeOptions hits the purposes endpoint', async () => {
		apiJson.mockResolvedValueOnce({ next: null, results: [{ id: 1, name: 'Emergency' }] });
		await expect(fetchPurposeOptions()).resolves.toEqual([{ id: 1, name: 'Emergency' }]);
		expect(apiJson.mock.calls[0][0]).toBe('/purposes/');
	});

	it('createAccount POSTs the payload', async () => {
		apiJson.mockResolvedValueOnce(account);
		await createAccount(input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/accounts/');
		expect((opts as RequestInit).method).toBe('POST');
		expect(JSON.parse((opts as RequestInit).body as string)).toEqual(input);
	});

	it('updateAccount PATCHes the given account', async () => {
		apiJson.mockResolvedValueOnce(account);
		await updateAccount(7, input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/accounts/7/');
		expect((opts as RequestInit).method).toBe('PATCH');
	});
});
