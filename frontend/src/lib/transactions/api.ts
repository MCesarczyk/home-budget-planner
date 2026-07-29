import { apiJson } from '../api/client';
import type { Paginated, Transaction } from './types';

export const PAGE_SIZE = 50;

export interface TransactionFilters {
	dateFrom?: string;
	dateTo?: string;
}

function buildQuery(filters: TransactionFilters, page: number): string {
	const q = new URLSearchParams();
	if (filters.dateFrom) q.set('date_from', filters.dateFrom);
	if (filters.dateTo) q.set('date_to', filters.dateTo);
	if (page > 1) q.set('page', String(page));
	return q.toString();
}

export async function fetchTransactions(
	filters: TransactionFilters = {},
	page = 1
): Promise<Paginated<Transaction>> {
	const query = buildQuery(filters, page);
	return apiJson<Paginated<Transaction>>(`/transactions/${query ? `?${query}` : ''}`);
}
