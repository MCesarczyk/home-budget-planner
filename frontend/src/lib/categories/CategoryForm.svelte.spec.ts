import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import CategoryForm from './CategoryForm.svelte';
import type { Category } from './types';

function setup(props: Record<string, unknown> = {}) {
	const onsubmit = vi.fn();
	const oncancel = vi.fn();
	render(CategoryForm, { onsubmit, oncancel, ...props });
	return { onsubmit, oncancel };
}

const existing: Category = { id: 2, name: 'Salary', kind: 'income' };

describe('CategoryForm', () => {
	it('submits a new category payload', async () => {
		const { onsubmit } = setup();

		await page.getByRole('textbox', { name: 'Name' }).fill('Food');
		await page.getByRole('combobox', { name: 'Kind' }).selectOptions('expense');
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({ name: 'Food', kind: 'expense' });
	});

	it('requires a name', async () => {
		const { onsubmit } = setup();

		await page.getByRole('button', { name: 'Save' }).click();

		await expect.element(page.getByText('Name is required.')).toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('prefills from an existing category and submits its values', async () => {
		const { onsubmit } = setup({ initial: existing });

		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({ name: 'Salary', kind: 'income' });
	});

	it('offers delete only when editing', async () => {
		const ondelete = vi.fn();
		render(CategoryForm, { initial: existing, onsubmit: vi.fn(), oncancel: vi.fn(), ondelete });

		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		expect(ondelete).toHaveBeenCalled();
	});
});
