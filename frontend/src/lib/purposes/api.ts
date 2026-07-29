import { apiJson } from '../api/client';
import type { PurposesReport } from './types';

export function fetchPurposes(): Promise<PurposesReport> {
	return apiJson<PurposesReport>('/reports/purposes/');
}
