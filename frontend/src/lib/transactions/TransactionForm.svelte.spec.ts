import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import TransactionForm from './TransactionForm.svelte';
import { today } from './helpers';
import type { Account, Category, Subcategory } from './types';

const accounts: Account[] = [
	{ id: 1, name: 'Checking', is_active: true },
	{ id: 2, name: 'Savings', is_active: true },
	{ id: 3, name: 'Archived', is_active: false }
];
const categories: Category[] = [
	{ id: 1, name: 'Food', kind: 'expense' },
	{ id: 2, name: 'Salary', kind: 'income' }
];
const subcategories: Subcategory[] = [
	{ id: 10, name: 'Groceries', category: 1 },
	{ id: 20, name: 'Paycheck', category: 2 }
];

function setup(props: Record<string, unknown> = {}) {
	const onsubmit = vi.fn();
	const oncancel = vi.fn();
	render(TransactionForm, { accounts, categories, subcategories, onsubmit, oncancel, ...props });
	return { onsubmit, oncancel };
}

describe('TransactionForm', () => {
	it('submits an expense with the source account and subcategory', async () => {
		const { onsubmit } = setup();

		await page.getByRole('spinbutton', { name: 'Amount' }).fill('12.50');
		await page.getByRole('combobox', { name: 'Account', exact: true }).selectOptions('1');
		await page.getByRole('combobox', { name: 'Category', exact: true }).selectOptions('1');
		await page.getByRole('combobox', { name: 'Subcategory' }).selectOptions('10');
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({
			tx_date: today(),
			amount: '12.5',
			comment: '',
			subcategory: 10,
			source_account: 1,
			destination_account: null
		});
	});

	it('submits an income with the destination account', async () => {
		const { onsubmit } = setup();

		await page.getByRole('button', { name: 'Income' }).click();
		await page.getByRole('spinbutton', { name: 'Amount' }).fill('100');
		await page.getByRole('combobox', { name: 'Account', exact: true }).selectOptions('2');
		await page.getByRole('combobox', { name: 'Category', exact: true }).selectOptions('2');
		await page.getByRole('combobox', { name: 'Subcategory' }).selectOptions('20');
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith(
			expect.objectContaining({ amount: '100', destination_account: 2, subcategory: 20 })
		);
	});

	it('rejects a self-transfer', async () => {
		const { onsubmit } = setup();

		await page.getByRole('button', { name: 'Transfer' }).click();
		await page.getByRole('spinbutton', { name: 'Amount' }).fill('50');
		await page.getByRole('combobox', { name: 'From account', exact: true }).selectOptions('1');
		await page.getByRole('combobox', { name: 'To account', exact: true }).selectOptions('1');
		await page.getByRole('button', { name: 'Save' }).click();

		await expect.element(page.getByText('The two accounts must differ.')).toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('requires a positive amount', async () => {
		const { onsubmit } = setup();

		await page.getByRole('button', { name: 'Save' }).click();

		await expect.element(page.getByText('Amount must be greater than 0.')).toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('offers only expense categories and active accounts for an expense', async () => {
		setup();

		await expect.element(page.getByRole('option', { name: 'Food' })).toBeInTheDocument();
		await expect.element(page.getByRole('option', { name: 'Salary' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('option', { name: 'Archived' })).not.toBeInTheDocument();
	});
});
