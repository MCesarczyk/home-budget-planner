import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import AccountsManager from './AccountsManager.svelte';
import * as api from './api';
import type { Account } from './types';

vi.mock('./api', () => ({
	fetchAccounts: vi.fn(),
	fetchPurposeOptions: vi.fn(),
	createAccount: vi.fn(),
	updateAccount: vi.fn(),
	deleteAccount: vi.fn()
}));

const fetchAccounts = vi.mocked(api.fetchAccounts);

const accounts: Account[] = [
	{
		id: 1,
		name: 'Checking',
		type: 'checking',
		opening_balance: '0.00',
		purpose: null,
		is_active: true,
		balance: '1500.00',
		is_liability: false
	},
	{
		id: 2,
		name: 'Old Card',
		type: 'liability',
		opening_balance: '0.00',
		purpose: null,
		is_active: false,
		balance: '0.00',
		is_liability: true
	}
];

beforeEach(() => {
	vi.clearAllMocks();
	fetchAccounts.mockResolvedValue(accounts);
	vi.mocked(api.fetchPurposeOptions).mockResolvedValue([]);
});

describe('AccountsManager', () => {
	it('lists accounts with type and archived status', async () => {
		render(AccountsManager);

		await expect.element(page.getByText('Checking')).toBeInTheDocument();
		await expect.element(page.getByText('1500.00')).toBeInTheDocument();
		await expect.element(page.getByText('Archived')).toBeInTheDocument();
	});

	it('opens the create modal from the Add account button', async () => {
		render(AccountsManager);

		await expect.element(page.getByText('Checking')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Add account' }).click();

		await expect.element(page.getByText('New account')).toBeInTheDocument();
	});

	it('opens the edit modal when a row is clicked', async () => {
		render(AccountsManager);

		await page.getByText('Checking').click();

		await expect.element(page.getByText('Edit account')).toBeInTheDocument();
	});
});
