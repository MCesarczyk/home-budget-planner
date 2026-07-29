import { apiJson } from '../api/client';
import type { CashflowReport } from './types';

export interface CashflowRange {
	dateFrom?: string;
	dateTo?: string;
}

export function fetchCashflow(range: CashflowRange = {}): Promise<CashflowReport> {
	const q = new URLSearchParams();
	if (range.dateFrom) q.set('date_from', range.dateFrom);
	if (range.dateTo) q.set('date_to', range.dateTo);
	const query = q.toString();
	return apiJson<CashflowReport>(`/reports/cashflow/${query ? `?${query}` : ''}`);
}
