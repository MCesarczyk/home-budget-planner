import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import SubcategoryForm from './SubcategoryForm.svelte';
import type { Category } from '$lib/categories/types';
import type { Subcategory } from './types';

const categories: Category[] = [
	{ id: 1, name: 'Food', kind: 'expense' },
	{ id: 2, name: 'Work', kind: 'income' }
];

function setup(props: Record<string, unknown> = {}) {
	const onsubmit = vi.fn();
	const oncancel = vi.fn();
	render(SubcategoryForm, { categories, onsubmit, oncancel, ...props });
	return { onsubmit, oncancel };
}

const existing: Subcategory = { id: 10, name: 'Groceries', category: 1 };

describe('SubcategoryForm', () => {
	it('submits a new subcategory payload', async () => {
		const { onsubmit } = setup();

		await page.getByRole('textbox', { name: 'Name' }).fill('Supermarket');
		await page.getByRole('combobox', { name: 'Category' }).selectOptions('1');
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({ name: 'Supermarket', category: 1 });
	});

	it('requires a name', async () => {
		const { onsubmit } = setup();

		await page.getByRole('button', { name: 'Save' }).click();

		await expect.element(page.getByText('Name is required.')).toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('requires a category', async () => {
		const { onsubmit } = setup();

		await page.getByRole('textbox', { name: 'Name' }).fill('Supermarket');
		await page.getByRole('button', { name: 'Save' }).click();

		await expect.element(page.getByText('Select a category.')).toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('prefills from an existing subcategory and submits its values', async () => {
		const { onsubmit } = setup({ initial: existing });

		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({ name: 'Groceries', category: 1 });
	});

	it('offers delete only when editing', async () => {
		const ondelete = vi.fn();
		render(SubcategoryForm, {
			categories,
			initial: existing,
			onsubmit: vi.fn(),
			oncancel: vi.fn(),
			ondelete
		});

		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		expect(ondelete).toHaveBeenCalled();
	});
});
