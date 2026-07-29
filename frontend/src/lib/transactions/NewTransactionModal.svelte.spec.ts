import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import NewTransactionModal from './NewTransactionModal.svelte';
import * as api from './api';
import { today } from './helpers';

vi.mock('./api', () => ({
	fetchAccounts: vi.fn(),
	fetchCategories: vi.fn(),
	fetchSubcategories: vi.fn(),
	createTransaction: vi.fn()
}));

const createTransaction = vi.mocked(api.createTransaction);

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(api.fetchAccounts).mockResolvedValue([{ id: 1, name: 'Checking', is_active: true }]);
	vi.mocked(api.fetchCategories).mockResolvedValue([{ id: 1, name: 'Food', kind: 'expense' }]);
	vi.mocked(api.fetchSubcategories).mockResolvedValue([{ id: 10, name: 'Groceries', category: 1 }]);
	createTransaction.mockResolvedValue({} as never);
});

describe('NewTransactionModal', () => {
	it('closes when the close button is clicked', async () => {
		const onclose = vi.fn();
		render(NewTransactionModal, { open: true, onclose, oncreated: vi.fn() });

		await page.getByRole('button', { name: 'Close dialog' }).click();
		expect(onclose).toHaveBeenCalled();
	});

	it('creates a transaction, then fires oncreated and closes', async () => {
		const onclose = vi.fn();
		const oncreated = vi.fn();
		render(NewTransactionModal, { open: true, onclose, oncreated });

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
				source_account: 1
			})
		);
		await vi.waitFor(() => expect(oncreated).toHaveBeenCalled());
		expect(onclose).toHaveBeenCalled();
	});
});
