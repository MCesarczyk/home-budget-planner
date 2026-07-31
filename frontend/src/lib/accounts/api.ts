import { apiJson } from '../api/client';
import type { Account, AccountInput, PurposeOption } from './types';

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

export function fetchAccounts(): Promise<Account[]> {
	return fetchAll<Account>('/accounts/');
}

export function fetchPurposeOptions(): Promise<PurposeOption[]> {
	return fetchAll<PurposeOption>('/purposes/');
}

export function createAccount(input: AccountInput): Promise<Account> {
	return apiJson<Account>('/accounts/', { method: 'POST', body: JSON.stringify(input) });
}

export function updateAccount(id: number, input: AccountInput): Promise<Account> {
	return apiJson<Account>(`/accounts/${id}/`, { method: 'PATCH', body: JSON.stringify(input) });
}
