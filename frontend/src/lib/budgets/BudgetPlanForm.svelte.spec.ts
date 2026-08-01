import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import BudgetPlanForm from './BudgetPlanForm.svelte';
import type { Category, Subcategory } from '$lib/transactions/types';
import type { BudgetPlanDetail } from './types';

const categories: Category[] = [
	{ id: 3, name: 'Housing', kind: 'expense' },
	{ id: 1, name: 'Salary', kind: 'income' }
];
const subcategories: Subcategory[] = [
	{ id: 6, name: 'Rent', category: 3 },
	{ id: 7, name: 'Electricity', category: 3 },
	{ id: 1, name: 'Primary Job', category: 1 }
];

function setup(props: Record<string, unknown> = {}) {
	const onsubmit = vi.fn();
	const oncancel = vi.fn();
	render(BudgetPlanForm, { categories, subcategories, onsubmit, oncancel, ...props });
	return { onsubmit, oncancel };
}

describe('BudgetPlanForm', () => {
	it('builds a create payload from the filled lines', async () => {
		const { onsubmit } = setup();
		await page.getByRole('combobox', { name: 'Subcategory for line 1' }).selectOptions('6');
		await page.getByRole('spinbutton', { name: 'Amount for line 1' }).fill('1500');
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				month: expect.stringMatching(/^\d{4}-\d{2}-01$/),
				items: [{ subcategory: 6, amount: '1500' }]
			})
		);
	});

	it('adds and removes lines', async () => {
		setup();
		await page.getByRole('button', { name: '+ Add line' }).click();
		await expect
			.element(page.getByRole('spinbutton', { name: 'Amount for line 2' }))
			.toBeInTheDocument();
		await page.getByRole('button', { name: 'Remove line 2' }).click();
		await expect
			.element(page.getByRole('spinbutton', { name: 'Amount for line 2' }))
			.not.toBeInTheDocument();
	});

	it('rejects a duplicate subcategory', async () => {
		const { onsubmit } = setup();
		await page.getByRole('combobox', { name: 'Subcategory for line 1' }).selectOptions('6');
		await page.getByRole('spinbutton', { name: 'Amount for line 1' }).fill('100');
		await page.getByRole('button', { name: '+ Add line' }).click();
		await page.getByRole('combobox', { name: 'Subcategory for line 2' }).selectOptions('6');
		await page.getByRole('spinbutton', { name: 'Amount for line 2' }).fill('200');
		await page.getByRole('button', { name: 'Save' }).click();

		await expect
			.element(page.getByText('Each subcategory can appear only once.'))
			.toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('rejects a non-positive amount', async () => {
		const { onsubmit } = setup();
		await page.getByRole('combobox', { name: 'Subcategory for line 1' }).selectOptions('6');
		await page.getByRole('spinbutton', { name: 'Amount for line 1' }).fill('0');
		await page.getByRole('button', { name: 'Save' }).click();

		await expect
			.element(page.getByText('Every amount must be greater than 0.'))
			.toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('seeds lines and a delete action when editing', async () => {
		const initial: BudgetPlanDetail = {
			id: 5,
			month: '2023-12-01',
			planned_income: '0.00',
			planned_expense: '1500.00',
			items: [
				{
					id: 1,
					amount: '1500.00',
					subcategory: {
						id: 6,
						name: 'Rent',
						category: { id: 3, name: 'Housing', kind: 'expense' }
					}
				}
			]
		};
		const ondelete = vi.fn();
		setup({ initial, ondelete });

		await expect
			.element(page.getByRole('combobox', { name: 'Subcategory for line 1' }))
			.toHaveValue('6');
		await expect.element(page.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
	});

	it('inherits lines from a template and advances the month when creating', async () => {
		const template: BudgetPlanDetail = {
			id: 9,
			month: '2023-11-01',
			planned_income: '0.00',
			planned_expense: '1500.00',
			items: [
				{
					id: 1,
					amount: '1500.00',
					subcategory: {
						id: 6,
						name: 'Rent',
						category: { id: 3, name: 'Housing', kind: 'expense' }
					}
				}
			]
		};
		const { onsubmit } = setup({ template });

		// Seeded from the template: the Rent line + amount, month advanced to next.
		await expect
			.element(page.getByRole('combobox', { name: 'Subcategory for line 1' }))
			.toHaveValue('6');
		await expect
			.element(page.getByRole('spinbutton', { name: 'Amount for line 1' }))
			.toHaveValue(1500);
		await expect.element(page.getByLabelText('Month')).toHaveValue('2023-12');
		// No delete action — it is still a create.
		await expect.element(page.getByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

		await page.getByRole('button', { name: 'Save' }).click();
		expect(onsubmit).toHaveBeenCalledWith({
			month: '2023-12-01',
			items: [{ subcategory: 6, amount: '1500' }]
		});
	});
});
