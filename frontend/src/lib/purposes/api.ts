import { apiJson } from '../api/client';
import type { Purpose, PurposeInput, PurposesReport } from './types';

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

// The aggregated progress report (earmarked totals vs targets).
export function fetchPurposes(): Promise<PurposesReport> {
	return apiJson<PurposesReport>('/reports/purposes/');
}

// CRUD against the purposes resource.
export function fetchPurposeList(): Promise<Purpose[]> {
	return fetchAll<Purpose>('/purposes/');
}

export function createPurpose(input: PurposeInput): Promise<Purpose> {
	return apiJson<Purpose>('/purposes/', { method: 'POST', body: JSON.stringify(input) });
}

export function updatePurpose(id: number, input: PurposeInput): Promise<Purpose> {
	return apiJson<Purpose>(`/purposes/${id}/`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deletePurpose(id: number): Promise<void> {
	return apiJson<void>(`/purposes/${id}/`, { method: 'DELETE' });
}
