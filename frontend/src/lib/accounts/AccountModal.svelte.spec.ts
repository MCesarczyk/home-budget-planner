import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import AccountModal from './AccountModal.svelte';
import * as api from './api';
import type { Account } from './types';

vi.mock('./api', () => ({
	fetchPurposeOptions: vi.fn(),
	createAccount: vi.fn(),
	updateAccount: vi.fn()
}));

const createAccount = vi.mocked(api.createAccount);
const updateAccount = vi.mocked(api.updateAccount);

const existing: Account = {
	id: 5,
	name: 'Brokerage',
	type: 'investment',
	opening_balance: '1234.56',
	purpose: null,
	is_active: true,
	balance: '2000.00',
	is_liability: false
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(api.fetchPurposeOptions).mockResolvedValue([{ id: 3, name: 'Emergency' }]);
	createAccount.mockResolvedValue(existing);
	updateAccount.mockResolvedValue(existing);
});

describe('AccountModal', () => {
	it('closes when the close button is clicked', async () => {
		const onclose = vi.fn();
		render(AccountModal, { open: true, onclose, onsaved: vi.fn() });

		await page.getByRole('button', { name: 'Close dialog' }).click();
		expect(onclose).toHaveBeenCalled();
	});

	it('creates an account, then fires onsaved and closes', async () => {
		const onclose = vi.fn();
		const onsaved = vi.fn();
		render(AccountModal, { open: true, onclose, onsaved });

		await page.getByRole('textbox', { name: 'Name' }).fill('Savings');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(createAccount).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'Savings', type: 'checking' })
			)
		);
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
		expect(onclose).toHaveBeenCalled();
	});

	it('updates an existing account on save', async () => {
		const onsaved = vi.fn();
		render(AccountModal, { open: true, account: existing, onclose: vi.fn(), onsaved });

		await expect.element(page.getByText('Edit account')).toBeInTheDocument();
		await page.getByRole('textbox', { name: 'Name' }).fill('Brokerage 2');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(updateAccount).toHaveBeenCalledWith(
				5,
				expect.objectContaining({ name: 'Brokerage 2' })
			)
		);
		expect(onsaved).toHaveBeenCalled();
	});

	it('never offers a delete action (accounts are archived, not deleted)', async () => {
		render(AccountModal, { open: true, account: existing, onclose: vi.fn(), onsaved: vi.fn() });

		await expect.element(page.getByText('Edit account')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
	});

	it('archives in place without closing the modal', async () => {
		const onclose = vi.fn();
		const onsaved = vi.fn();
		updateAccount.mockResolvedValue({ ...existing, is_active: false });
		render(AccountModal, { open: true, account: existing, onclose, onsaved });

		await page.getByRole('button', { name: 'Archive' }).click();

		await vi.waitFor(() =>
			expect(updateAccount).toHaveBeenCalledWith(5, expect.objectContaining({ is_active: false }))
		);
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
		// Stays open and the button flips to Restore.
		await expect.element(page.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
		expect(onclose).not.toHaveBeenCalled();
	});

	it('clears a previous error when reopened', async () => {
		updateAccount.mockRejectedValue(new ApiError(400, 'Save failed.'));
		const props = { open: true, account: existing, onclose: vi.fn(), onsaved: vi.fn() };
		const { rerender } = render(AccountModal, props);

		await page.getByRole('button', { name: 'Save' }).click();
		await expect.element(page.getByText('Save failed.')).toBeInTheDocument();

		await rerender({ ...props, open: false });
		await rerender({ ...props, open: true });
		await expect.element(page.getByText('Save failed.')).not.toBeInTheDocument();
	});
});
