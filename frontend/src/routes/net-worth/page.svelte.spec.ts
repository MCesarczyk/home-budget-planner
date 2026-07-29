import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import { auth } from '$lib/auth/auth.store.svelte';
import * as api from '$lib/net-worth/api';
import type { NetWorthReport } from '$lib/net-worth/types';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('$lib/net-worth/api', () => ({ fetchNetWorth: vi.fn() }));

const fetchNetWorth = vi.mocked(api.fetchNetWorth);

const report: NetWorthReport = {
	assets: [{ id: 1, name: 'Checking', type: 'checking', balance: '100.00' }],
	total_assets: '100.00',
	liabilities: [],
	total_liabilities: '0.00',
	net_worth: '100.00'
};

beforeEach(() => {
	vi.clearAllMocks();
	auth.user = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };
	auth.loading = false;
});
afterEach(() => {
	auth.user = null;
	auth.loading = true;
});

describe('net-worth page', () => {
	it('loads and renders the net-worth summary', async () => {
		fetchNetWorth.mockResolvedValue(report);
		render(Page);

		await expect.element(page.getByText('Checking')).toBeInTheDocument();
		await expect.element(page.getByText('100.00').first()).toBeInTheDocument();
		expect(fetchNetWorth).toHaveBeenCalled();
	});

	it('shows the error detail when the request fails', async () => {
		fetchNetWorth.mockRejectedValue(new ApiError(500, 'Server exploded.'));
		render(Page);

		await expect.element(page.getByText('Server exploded.')).toBeInTheDocument();
	});
});
