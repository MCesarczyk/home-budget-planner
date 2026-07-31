import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { createCategory, deleteCategory, fetchCategoryList, updateCategory } from './api';
import type { Category, CategoryInput } from './types';

vi.mock('../api/client', () => ({ apiJson: vi.fn() }));

const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

const category: Category = { id: 2, name: 'Food', kind: 'expense' };
const input: CategoryInput = { name: 'Food', kind: 'expense' };

describe('categories api', () => {
	it('fetchCategoryList hits the categories endpoint', async () => {
		apiJson.mockResolvedValueOnce({ next: null, results: [category] });
		await expect(fetchCategoryList()).resolves.toEqual([category]);
		expect(apiJson.mock.calls[0][0]).toBe('/categories/');
	});

	it('createCategory POSTs the payload', async () => {
		apiJson.mockResolvedValueOnce(category);
		await createCategory(input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/categories/');
		expect((opts as RequestInit).method).toBe('POST');
		expect(JSON.parse((opts as RequestInit).body as string)).toEqual(input);
	});

	it('updateCategory PATCHes the given category', async () => {
		apiJson.mockResolvedValueOnce(category);
		await updateCategory(2, input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/categories/2/');
		expect((opts as RequestInit).method).toBe('PATCH');
	});

	it('deleteCategory DELETEs the given category', async () => {
		apiJson.mockResolvedValueOnce(undefined);
		await deleteCategory(2);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/categories/2/');
		expect((opts as RequestInit).method).toBe('DELETE');
	});
});
