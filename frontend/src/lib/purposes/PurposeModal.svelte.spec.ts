import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { ApiError } from '$lib/api/client';
import PurposeModal from './PurposeModal.svelte';
import * as api from './api';
import type { Purpose } from './types';

vi.mock('./api', () => ({
	createPurpose: vi.fn(),
	updatePurpose: vi.fn(),
	deletePurpose: vi.fn()
}));

const createPurpose = vi.mocked(api.createPurpose);
const updatePurpose = vi.mocked(api.updatePurpose);
const deletePurpose = vi.mocked(api.deletePurpose);

const existing: Purpose = {
	id: 3,
	name: 'Emergency',
	description: '',
	target_amount: '10000.00',
	is_off_budget: false
};

beforeEach(() => {
	vi.clearAllMocks();
	createPurpose.mockResolvedValue(existing);
	updatePurpose.mockResolvedValue(existing);
	deletePurpose.mockResolvedValue(undefined);
});

describe('PurposeModal', () => {
	it('creates a purpose, then fires onsaved and closes', async () => {
		const onclose = vi.fn();
		const onsaved = vi.fn();
		render(PurposeModal, { open: true, onclose, onsaved });

		await page.getByRole('textbox', { name: 'Name' }).fill('Vacation');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(createPurpose).toHaveBeenCalledWith(expect.objectContaining({ name: 'Vacation' }))
		);
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
		expect(onclose).toHaveBeenCalled();
	});

	it('updates an existing purpose on save', async () => {
		const onsaved = vi.fn();
		render(PurposeModal, { open: true, purpose: existing, onclose: vi.fn(), onsaved });

		await expect.element(page.getByText('Edit purpose')).toBeInTheDocument();
		await page.getByRole('textbox', { name: 'Name' }).fill('Emergency Fund');
		await page.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(updatePurpose).toHaveBeenCalledWith(
				3,
				expect.objectContaining({ name: 'Emergency Fund' })
			)
		);
		expect(onsaved).toHaveBeenCalled();
	});

	it('deletes the purpose after confirming', async () => {
		const onsaved = vi.fn();
		render(PurposeModal, { open: true, purpose: existing, onclose: vi.fn(), onsaved });

		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();

		await vi.waitFor(() => expect(deletePurpose).toHaveBeenCalledWith(3));
		expect(onsaved).toHaveBeenCalled();
	});

	it('clears a previous error when reopened', async () => {
		updatePurpose.mockRejectedValue(new ApiError(400, 'Save failed.'));
		const props = { open: true, purpose: existing, onclose: vi.fn(), onsaved: vi.fn() };
		const { rerender } = render(PurposeModal, props);

		await page.getByRole('button', { name: 'Save' }).click();
		await expect.element(page.getByText('Save failed.')).toBeInTheDocument();

		await rerender({ ...props, open: false });
		await rerender({ ...props, open: true });
		await expect.element(page.getByText('Save failed.')).not.toBeInTheDocument();
	});
});
