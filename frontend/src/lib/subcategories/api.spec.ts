import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import {
	createSubcategory,
	deleteSubcategory,
	fetchSubcategoryList,
	updateSubcategory
} from './api';
import type { Subcategory, SubcategoryInput } from './types';

vi.mock('../api/client', () => ({ apiJson: vi.fn() }));

const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

const subcategory: Subcategory = { id: 10, name: 'Groceries', category: 1 };
const input: SubcategoryInput = { name: 'Groceries', category: 1 };

describe('subcategories api', () => {
	it('fetchSubcategoryList hits the subcategories endpoint', async () => {
		apiJson.mockResolvedValueOnce({ next: null, results: [subcategory] });
		await expect(fetchSubcategoryList()).resolves.toEqual([subcategory]);
		expect(apiJson.mock.calls[0][0]).toBe('/subcategories/');
	});

	it('createSubcategory POSTs the payload', async () => {
		apiJson.mockResolvedValueOnce(subcategory);
		await createSubcategory(input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/subcategories/');
		expect((opts as RequestInit).method).toBe('POST');
		expect(JSON.parse((opts as RequestInit).body as string)).toEqual(input);
	});

	it('updateSubcategory PATCHes the given subcategory', async () => {
		apiJson.mockResolvedValueOnce(subcategory);
		await updateSubcategory(10, input);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/subcategories/10/');
		expect((opts as RequestInit).method).toBe('PATCH');
	});

	it('deleteSubcategory DELETEs the given subcategory', async () => {
		apiJson.mockResolvedValueOnce(undefined);
		await deleteSubcategory(10);
		const [path, opts] = apiJson.mock.calls[0];
		expect(path).toBe('/subcategories/10/');
		expect((opts as RequestInit).method).toBe('DELETE');
	});
});
