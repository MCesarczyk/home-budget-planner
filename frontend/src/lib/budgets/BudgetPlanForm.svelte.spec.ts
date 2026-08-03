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
	const { container } = render(BudgetPlanForm, {
		categories,
		subcategories,
		onsubmit,
		oncancel,
		...props
	});
	return { onsubmit, oncancel, container };
}

describe('BudgetPlanForm', () => {
	it('lists every subcategory with a checkbox and amount', async () => {
		setup();
		await expect.element(page.getByRole('checkbox', { name: 'Include Rent' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('checkbox', { name: 'Include Electricity' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('checkbox', { name: 'Include Primary Job' }))
			.toBeInTheDocument();
	});

	it('groups the income section before expenses', async () => {
		const { container } = setup();
		await expect
			.element(page.getByRole('checkbox', { name: 'Include Primary Job' }))
			.toBeInTheDocument();
		const headers = [...container.querySelectorAll('h3')].map((h) => h.textContent?.trim());
		expect(headers).toEqual(['Income', 'Expenses']);
	});

	it('includes only checked lines in the payload', async () => {
		const { onsubmit } = setup();
		await page.getByRole('checkbox', { name: 'Include Rent' }).click();
		await page.getByRole('spinbutton', { name: 'Amount for Rent' }).fill('1500');
		// Electricity is left unchecked and must not appear in the payload.
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				month: expect.stringMatching(/^\d{4}-\d{2}-01$/),
				items: [{ subcategory: 6, amount: '1500' }]
			})
		);
	});

	it("disables an unchecked line's amount until it is included", async () => {
		setup();
		await expect.element(page.getByRole('spinbutton', { name: 'Amount for Rent' })).toBeDisabled();
		await page.getByRole('checkbox', { name: 'Include Rent' }).click();
		await expect.element(page.getByRole('spinbutton', { name: 'Amount for Rent' })).toBeEnabled();
	});

	it('rejects an included line with no positive amount', async () => {
		const { onsubmit } = setup();
		await page.getByRole('checkbox', { name: 'Include Rent' }).click();
		// Leave the amount blank.
		await page.getByRole('button', { name: 'Save' }).click();

		await expect
			.element(page.getByText('Every included line needs an amount greater than 0.'))
			.toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('pre-checks the plan lines and offers delete when editing', async () => {
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

		await expect.element(page.getByRole('checkbox', { name: 'Include Rent' })).toBeChecked();
		await expect
			.element(page.getByRole('checkbox', { name: 'Include Electricity' }))
			.not.toBeChecked();
		await expect
			.element(page.getByRole('spinbutton', { name: 'Amount for Rent' }))
			.toHaveValue(1500);
		await expect.element(page.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
	});

	it('inherits the template lines and advances the month when creating', async () => {
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

		await expect.element(page.getByRole('checkbox', { name: 'Include Rent' })).toBeChecked();
		await expect.element(page.getByLabelText('Month')).toHaveValue('2023-12');
		await expect.element(page.getByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

		await page.getByRole('button', { name: 'Save' }).click();
		expect(onsubmit).toHaveBeenCalledWith({
			month: '2023-12-01',
			items: [{ subcategory: 6, amount: '1500' }]
		});
	});
});
