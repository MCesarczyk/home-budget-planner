import { apiJson } from '../api/client';
import type { Subcategory, SubcategoryInput } from './types';

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

export function fetchSubcategoryList(): Promise<Subcategory[]> {
	return fetchAll<Subcategory>('/subcategories/');
}

export function createSubcategory(input: SubcategoryInput): Promise<Subcategory> {
	return apiJson<Subcategory>('/subcategories/', { method: 'POST', body: JSON.stringify(input) });
}

export function updateSubcategory(id: number, input: SubcategoryInput): Promise<Subcategory> {
	return apiJson<Subcategory>(`/subcategories/${id}/`, {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}

export function deleteSubcategory(id: number): Promise<void> {
	return apiJson<void>(`/subcategories/${id}/`, { method: 'DELETE' });
}
