import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import CategoryModal from './CategoryModal.svelte';
import * as api from './api';
import type { Category } from './types';

vi.mock('./api', () => ({
	createCategory: vi.fn(),
	updateCategory: vi.fn(),
	deleteCategory: vi.fn()
}));

const createCategory = vi.mocked(api.createCategory);
const updateCategory = vi.mocked(api.updateCategory);
const deleteCategory = vi.mocked(api.deleteCategory);

const existing: Category = { id: 2, name: 'Food', kind: 'expense' };

beforeEach(() => {
	vi.clearAllMocks();
	createCategory.mockResolvedValue(existing);
	updateCategory.mockResolvedValue(existing);
	deleteCategory.mockResolvedValue(undefined);
});

describe('CategoryModal', () => {
	it('creates a category, then fires onsaved and closes', async () => {
		const onclose = vi.fn();
		const onsaved = vi.fn();
		render(CategoryModal, { open: true, onclose, onsaved });

		await page.getByRole('textbox', { name: 'Name' }).fill('Travel');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(createCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Travel' }))
		);
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
		expect(onclose).toHaveBeenCalled();
	});

	it('updates an existing category on save', async () => {
		const onsaved = vi.fn();
		render(CategoryModal, { open: true, category: existing, onclose: vi.fn(), onsaved });

		await expect.element(page.getByText('Edit category')).toBeInTheDocument();
		await page.getByRole('textbox', { name: 'Name' }).fill('Groceries');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(updateCategory).toHaveBeenCalledWith(2, expect.objectContaining({ name: 'Groceries' }))
		);
		expect(onsaved).toHaveBeenCalled();
	});

	it('deletes the category after confirming', async () => {
		const onsaved = vi.fn();
		render(CategoryModal, { open: true, category: existing, onclose: vi.fn(), onsaved });

		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();

		await vi.waitFor(() => expect(deleteCategory).toHaveBeenCalledWith(2));
		expect(onsaved).toHaveBeenCalled();
	});
});
