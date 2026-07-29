import { apiJson } from '../api/client';
import type { Paginated, Transaction } from './types';

export async function fetchTransactions(): Promise<Paginated<Transaction>> {
	return apiJson<Paginated<Transaction>>('/transactions/');
}
