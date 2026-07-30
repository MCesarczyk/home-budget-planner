import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import SubcategoriesManager from './SubcategoriesManager.svelte';
import * as api from './api';
import * as categoriesApi from '$lib/categories/api';
import type { Category } from '$lib/categories/types';
import type { Subcategory } from './types';

vi.mock('./api', () => ({
	fetchSubcategoryList: vi.fn(),
	createSubcategory: vi.fn(),
	updateSubcategory: vi.fn(),
	deleteSubcategory: vi.fn()
}));
vi.mock('$lib/categories/api', () => ({
	fetchCategoryList: vi.fn(),
	createCategory: vi.fn(),
	updateCategory: vi.fn(),
	deleteCategory: vi.fn()
}));

const fetchSubcategoryList = vi.mocked(api.fetchSubcategoryList);
const fetchCategoryList = vi.mocked(categoriesApi.fetchCategoryList);

const categories: Category[] = [{ id: 1, name: 'Food', kind: 'expense' }];
const subcategories: Subcategory[] = [{ id: 10, name: 'Groceries', category: 1 }];

beforeEach(() => {
	vi.clearAllMocks();
	fetchSubcategoryList.mockResolvedValue(subcategories);
	fetchCategoryList.mockResolvedValue(categories);
});

describe('SubcategoriesManager', () => {
	it('lists subcategories with their parent category name', async () => {
		render(SubcategoriesManager);

		await expect.element(page.getByText('Groceries')).toBeInTheDocument();
		await expect.element(page.getByText('Food')).toBeInTheDocument();
	});

	it('opens the create modal from the Add subcategory button', async () => {
		render(SubcategoriesManager);

		await expect.element(page.getByText('Groceries')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Add subcategory' }).click();

		await expect.element(page.getByText('New subcategory')).toBeInTheDocument();
	});

	it('opens the edit modal when a row is clicked', async () => {
		render(SubcategoriesManager);

		await page.getByText('Groceries').click();

		await expect.element(page.getByText('Edit subcategory')).toBeInTheDocument();
	});
});
