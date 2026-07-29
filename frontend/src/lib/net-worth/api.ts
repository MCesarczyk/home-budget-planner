import { apiJson } from '../api/client';
import type { NetWorthReport } from './types';

export function fetchNetWorth(): Promise<NetWorthReport> {
	return apiJson<NetWorthReport>('/reports/net-worth/');
}
