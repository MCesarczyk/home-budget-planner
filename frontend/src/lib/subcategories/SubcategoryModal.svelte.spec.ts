import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import SubcategoryModal from './SubcategoryModal.svelte';
import * as api from './api';
import type { Category } from '$lib/categories/types';
import type { Subcategory } from './types';

vi.mock('./api', () => ({
	createSubcategory: vi.fn(),
	updateSubcategory: vi.fn(),
	deleteSubcategory: vi.fn()
}));

const createSubcategory = vi.mocked(api.createSubcategory);
const updateSubcategory = vi.mocked(api.updateSubcategory);
const deleteSubcategory = vi.mocked(api.deleteSubcategory);

const categories: Category[] = [{ id: 1, name: 'Food', kind: 'expense' }];
const existing: Subcategory = { id: 10, name: 'Groceries', category: 1 };

beforeEach(() => {
	vi.clearAllMocks();
	createSubcategory.mockResolvedValue(existing);
	updateSubcategory.mockResolvedValue(existing);
	deleteSubcategory.mockResolvedValue(undefined);
});

describe('SubcategoryModal', () => {
	it('creates a subcategory, then fires onsaved and closes', async () => {
		const onclose = vi.fn();
		const onsaved = vi.fn();
		render(SubcategoryModal, { open: true, categories, onclose, onsaved });

		await page.getByRole('textbox', { name: 'Name' }).fill('Supermarket');
		await page.getByRole('combobox', { name: 'Category' }).selectOptions('1');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(createSubcategory).toHaveBeenCalledWith({ name: 'Supermarket', category: 1 })
		);
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
		expect(onclose).toHaveBeenCalled();
	});

	it('updates an existing subcategory on save', async () => {
		const onsaved = vi.fn();
		render(SubcategoryModal, {
			open: true,
			subcategory: existing,
			categories,
			onclose: vi.fn(),
			onsaved
		});

		await expect.element(page.getByText('Edit subcategory')).toBeInTheDocument();
		await page.getByRole('textbox', { name: 'Name' }).fill('Corner shop');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(updateSubcategory).toHaveBeenCalledWith(
				10,
				expect.objectContaining({ name: 'Corner shop' })
			)
		);
		expect(onsaved).toHaveBeenCalled();
	});

	it('deletes the subcategory after confirming', async () => {
		const onsaved = vi.fn();
		render(SubcategoryModal, {
			open: true,
			subcategory: existing,
			categories,
			onclose: vi.fn(),
			onsaved
		});

		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();

		await vi.waitFor(() => expect(deleteSubcategory).toHaveBeenCalledWith(10));
		expect(onsaved).toHaveBeenCalled();
	});

	it('clears a previous error when reopened', async () => {
		updateSubcategory.mockRejectedValue(new ApiError(400, 'Save failed.'));
		const props = {
			open: true,
			subcategory: existing,
			categories,
			onclose: vi.fn(),
			onsaved: vi.fn()
		};
		const { rerender } = render(SubcategoryModal, props);

		await page.getByRole('button', { name: 'Save' }).click();
		await expect.element(page.getByText('Save failed.')).toBeInTheDocument();

		await rerender({ ...props, open: false });
		await rerender({ ...props, open: true });
		await expect.element(page.getByText('Save failed.')).not.toBeInTheDocument();
	});
});
