import { apiJson } from '../api/client';
import type { Paginated, Transaction } from './types';

export interface TransactionFilters {
	dateFrom?: string;
	dateTo?: string;
}

function buildQuery(filters: TransactionFilters, page: number): string {
	const q = new URLSearchParams();
	if (filters.dateFrom) q.set('date_from', filters.dateFrom);
	if (filters.dateTo) q.set('date_to', filters.dateTo);
	q.set('page', String(page));
	return q.toString();
}

export async function fetchTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
	const results: Transaction[] = [];
	let page = 1;
	for (;;) {
		const data = await apiJson<Paginated<Transaction>>(
			`/transactions/?${buildQuery(filters, page)}`
		);
		results.push(...data.results);
		if (!data.next) break;
		page += 1;
	}
	return results;
}
