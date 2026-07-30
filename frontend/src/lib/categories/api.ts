import { apiJson } from '../api/client';
import type { Category, CategoryInput } from './types';

interface Page<T> {
	next: string | null;
	results: T[];
}

async function fetchAll<T>(path: string): Promise<T[]> {
	const results: T[] = [];
	let page = 1;
	for (;;) {
		const data = await apiJson<Page<T>>(`${path}${page > 1 ? `?page=${page}` : ''}`);
		results.push(...data.results);
		if (!data.next) break;
		page += 1;
	}
	return results;
}

export function fetchCategoryList(): Promise<Category[]> {
	return fetchAll<Category>('/categories/');
}

export function createCategory(input: CategoryInput): Promise<Category> {
	return apiJson<Category>('/categories/', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCategory(id: number, input: CategoryInput): Promise<Category> {
	return apiJson<Category>(`/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteCategory(id: number): Promise<void> {
	return apiJson<void>(`/categories/${id}/`, { method: 'DELETE' });
}
