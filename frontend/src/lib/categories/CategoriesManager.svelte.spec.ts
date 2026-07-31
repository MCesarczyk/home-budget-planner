import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import CategoriesManager from './CategoriesManager.svelte';
import * as api from './api';
import type { Category } from './types';

vi.mock('./api', () => ({
	fetchCategoryList: vi.fn(),
	createCategory: vi.fn(),
	updateCategory: vi.fn(),
	deleteCategory: vi.fn()
}));

const fetchCategoryList = vi.mocked(api.fetchCategoryList);

const categories: Category[] = [
	{ id: 1, name: 'Food', kind: 'expense' },
	{ id: 2, name: 'Salary', kind: 'income' }
];

beforeEach(() => {
	vi.clearAllMocks();
	fetchCategoryList.mockResolvedValue(categories);
});

describe('CategoriesManager', () => {
	it('lists categories with their kind', async () => {
		render(CategoriesManager);

		await expect.element(page.getByText('Food')).toBeInTheDocument();
		await expect.element(page.getByText('Salary')).toBeInTheDocument();
		await expect.element(page.getByText('income')).toBeInTheDocument();
	});

	it('opens the create modal from the Add category button', async () => {
		render(CategoriesManager);

		await expect.element(page.getByText('Food')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Add category' }).click();

		await expect.element(page.getByText('New category')).toBeInTheDocument();
	});

	it('opens the edit modal when a row is clicked', async () => {
		render(CategoriesManager);

		await page.getByText('Food').click();

		await expect.element(page.getByText('Edit category')).toBeInTheDocument();
	});
});
