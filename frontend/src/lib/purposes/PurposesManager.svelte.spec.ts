import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PurposesManager from './PurposesManager.svelte';
import * as api from './api';
import type { Purpose } from './types';

vi.mock('./api', () => ({
	fetchPurposeList: vi.fn(),
	createPurpose: vi.fn(),
	updatePurpose: vi.fn(),
	deletePurpose: vi.fn()
}));

const fetchPurposeList = vi.mocked(api.fetchPurposeList);

const purposes: Purpose[] = [
	{ id: 1, name: 'Emergency', description: '', target_amount: '10000.00' },
	{ id: 2, name: 'Vacation', description: '', target_amount: null }
];

beforeEach(() => {
	vi.clearAllMocks();
	fetchPurposeList.mockResolvedValue(purposes);
});

describe('PurposesManager', () => {
	it('lists purposes with their targets', async () => {
		render(PurposesManager);

		await expect.element(page.getByText('Emergency')).toBeInTheDocument();
		await expect.element(page.getByText('10000.00')).toBeInTheDocument();
		await expect.element(page.getByText('Vacation')).toBeInTheDocument();
	});

	it('opens the create modal from the Add purpose button', async () => {
		render(PurposesManager);

		await expect.element(page.getByText('Emergency')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Add purpose' }).click();

		await expect.element(page.getByText('New purpose')).toBeInTheDocument();
	});

	it('opens the edit modal when a row is clicked', async () => {
		render(PurposesManager);

		await page.getByText('Emergency').click();

		await expect.element(page.getByText('Edit purpose')).toBeInTheDocument();
	});
});
