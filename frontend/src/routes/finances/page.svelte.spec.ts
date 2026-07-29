import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import { auth } from '$lib/auth/auth.store.svelte';
import * as netWorthApi from '$lib/net-worth/api';
import * as purposesApi from '$lib/purposes/api';
import type { NetWorthReport } from '$lib/net-worth/types';
import type { PurposesReport } from '$lib/purposes/types';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('$lib/net-worth/api', () => ({ fetchNetWorth: vi.fn() }));
vi.mock('$lib/purposes/api', () => ({ fetchPurposes: vi.fn() }));

const fetchNetWorth = vi.mocked(netWorthApi.fetchNetWorth);
const fetchPurposes = vi.mocked(purposesApi.fetchPurposes);

const netWorth: NetWorthReport = {
	assets: [{ id: 1, name: 'Checking', type: 'checking', balance: '100.00' }],
	total_assets: '100.00',
	liabilities: [],
	total_liabilities: '0.00',
	net_worth: '100.00'
};

const purposes: PurposesReport = {
	purposes: [
		{
			id: 3,
			name: 'Emergency Fund',
			target_amount: '10000.00',
			current_amount: '6500.00',
			progress: 0.65,
			accounts: [{ id: 1, name: 'Savings', balance: '6500.00' }]
		}
	]
};

beforeEach(() => {
	vi.clearAllMocks();
	fetchNetWorth.mockResolvedValue(netWorth);
	fetchPurposes.mockResolvedValue(purposes);
	auth.user = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };
	auth.loading = false;
});
afterEach(() => {
	auth.user = null;
	auth.loading = true;
});

describe('finances page', () => {
	it('loads and renders both the net-worth and purposes summaries', async () => {
		render(Page);

		await expect.element(page.getByText('Checking')).toBeInTheDocument();
		await expect.element(page.getByText('Emergency Fund')).toBeInTheDocument();
		await expect.element(page.getByText('65%')).toBeInTheDocument();
		expect(fetchNetWorth).toHaveBeenCalled();
		expect(fetchPurposes).toHaveBeenCalled();
	});

	it('surfaces each summary error independently', async () => {
		fetchNetWorth.mockRejectedValue(new ApiError(500, 'Net worth failed.'));
		fetchPurposes.mockRejectedValue(new ApiError(500, 'Purposes failed.'));
		render(Page);

		await expect.element(page.getByText('Net worth failed.')).toBeInTheDocument();
		await expect.element(page.getByText('Purposes failed.')).toBeInTheDocument();
	});
});
