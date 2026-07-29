import { apiJson } from '../api/client';
import type { Category, Paginated, SpendingReport, Subcategory, Transaction } from './types';

export const PAGE_SIZE = 50;

export interface DateRange {
	dateFrom?: string;
	dateTo?: string;
}

export interface TransactionFilters extends DateRange {
	category?: number;
	subcategory?: number;
}

function buildQuery(filters: TransactionFilters, page: number): string {
	const q = new URLSearchParams();
	if (filters.dateFrom) q.set('date_from', filters.dateFrom);
	if (filters.dateTo) q.set('date_to', filters.dateTo);
	if (filters.category) q.set('category', String(filters.category));
	if (filters.subcategory) q.set('subcategory', String(filters.subcategory));
	if (page > 1) q.set('page', String(page));
	return q.toString();
}

async function fetchAll<T>(path: string): Promise<T[]> {
	const results: T[] = [];
	let page = 1;
	for (;;) {
		const data = await apiJson<Paginated<T>>(`${path}${page > 1 ? `?page=${page}` : ''}`);
		results.push(...data.results);
		if (!data.next) break;
		page += 1;
	}
	return results;
}

export async function fetchTransactions(
	filters: TransactionFilters = {},
	page = 1
): Promise<Paginated<Transaction>> {
	const query = buildQuery(filters, page);
	return apiJson<Paginated<Transaction>>(`/transactions/${query ? `?${query}` : ''}`);
}

export function fetchCategories(): Promise<Category[]> {
	return fetchAll<Category>('/categories/');
}

export function fetchSubcategories(): Promise<Subcategory[]> {
	return fetchAll<Subcategory>('/subcategories/');
}

export function fetchSpending(range: DateRange = {}): Promise<SpendingReport> {
	const q = new URLSearchParams();
	if (range.dateFrom) q.set('date_from', range.dateFrom);
	if (range.dateTo) q.set('date_to', range.dateTo);
	const query = q.toString();
	return apiJson<SpendingReport>(`/reports/spending/${query ? `?${query}` : ''}`);
}
