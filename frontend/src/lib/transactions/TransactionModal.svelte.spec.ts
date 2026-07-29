import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import TransactionModal from './TransactionModal.svelte';
import * as api from './api';
import { today } from './helpers';
import type { Transaction } from './types';

vi.mock('./api', () => ({
	fetchAccounts: vi.fn(),
	fetchCategories: vi.fn(),
	fetchSubcategories: vi.fn(),
	createTransaction: vi.fn(),
	updateTransaction: vi.fn(),
	deleteTransaction: vi.fn()
}));

const createTransaction = vi.mocked(api.createTransaction);
const updateTransaction = vi.mocked(api.updateTransaction);
const deleteTransaction = vi.mocked(api.deleteTransaction);

const existing: Transaction = {
	id: 7,
	type: 'expense',
	tx_date: '2026-07-01',
	amount: '12.50',
	comment: 'lunch',
	source_account: { id: 1, name: 'Checking' },
	destination_account: null,
	subcategory: { id: 10, name: 'Groceries', category: { id: 1, name: 'Food', kind: 'expense' } }
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(api.fetchAccounts).mockResolvedValue([{ id: 1, name: 'Checking', is_active: true }]);
	vi.mocked(api.fetchCategories).mockResolvedValue([{ id: 1, name: 'Food', kind: 'expense' }]);
	vi.mocked(api.fetchSubcategories).mockResolvedValue([{ id: 10, name: 'Groceries', category: 1 }]);
	createTransaction.mockResolvedValue({} as Transaction);
	updateTransaction.mockResolvedValue({} as Transaction);
	deleteTransaction.mockResolvedValue(undefined);
});

describe('TransactionModal', () => {
	it('closes when the close button is clicked', async () => {
		const onclose = vi.fn();
		render(TransactionModal, { open: true, onclose, onsaved: vi.fn() });

		await page.getByRole('button', { name: 'Close dialog' }).click();
		expect(onclose).toHaveBeenCalled();
	});

	it('creates a transaction, then fires onsaved and closes', async () => {
		const onclose = vi.fn();
		const onsaved = vi.fn();
		render(TransactionModal, { open: true, onclose, onsaved });

		await expect.element(page.getByRole('option', { name: 'Checking' })).toBeInTheDocument();
		await page.getByRole('spinbutton', { name: 'Amount' }).fill('12.50');
		await page.getByRole('combobox', { name: 'Account', exact: true }).selectOptions('1');
		await page.getByRole('combobox', { name: 'Category', exact: true }).selectOptions('1');
		await page.getByRole('combobox', { name: 'Subcategory' }).selectOptions('10');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(createTransaction).toHaveBeenCalledWith({
				tx_date: today(),
				amount: '12.5',
				comment: '',
				subcategory: 10,
				source_account: 1,
				destination_account: null
			})
		);
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
		expect(onclose).toHaveBeenCalled();
	});

	it('prefills from the record and PATCHes it on save', async () => {
		const onsaved = vi.fn();
		render(TransactionModal, { open: true, transaction: existing, onclose: vi.fn(), onsaved });

		await expect.element(page.getByText('Edit transaction')).toBeInTheDocument();
		await page.getByRole('spinbutton', { name: 'Amount' }).fill('20');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(updateTransaction).toHaveBeenCalledWith(
				7,
				expect.objectContaining({ amount: '20', source_account: 1, subcategory: 10 })
			)
		);
		expect(onsaved).toHaveBeenCalled();
	});

	it('deletes the record after confirming', async () => {
		const onsaved = vi.fn();
		render(TransactionModal, { open: true, transaction: existing, onclose: vi.fn(), onsaved });

		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();

		await vi.waitFor(() => expect(deleteTransaction).toHaveBeenCalledWith(7));
		expect(onsaved).toHaveBeenCalled();
	});

	it('does not offer delete when creating', async () => {
		render(TransactionModal, { open: true, onclose: vi.fn(), onsaved: vi.fn() });

		await expect.element(page.getByRole('option', { name: 'Checking' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
	});
});
