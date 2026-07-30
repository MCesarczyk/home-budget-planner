import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PurposeForm from './PurposeForm.svelte';
import type { Purpose } from './types';

function setup(props: Record<string, unknown> = {}) {
	const onsubmit = vi.fn();
	const oncancel = vi.fn();
	render(PurposeForm, { onsubmit, oncancel, ...props });
	return { onsubmit, oncancel };
}

const existing: Purpose = {
	id: 3,
	name: 'Emergency',
	description: 'Rainy day',
	target_amount: '10000.00'
};

describe('PurposeForm', () => {
	it('submits a new purpose payload', async () => {
		const { onsubmit } = setup();

		await page.getByRole('textbox', { name: 'Name' }).fill('Vacation');
		await page.getByRole('spinbutton', { name: 'Target amount' }).fill('3000');
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({
			name: 'Vacation',
			description: '',
			target_amount: '3000'
		});
	});

	it('sends a null target when left blank', async () => {
		const { onsubmit } = setup();

		await page.getByRole('textbox', { name: 'Name' }).fill('Buffer');
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({
			name: 'Buffer',
			description: '',
			target_amount: null
		});
	});

	it('requires a name', async () => {
		const { onsubmit } = setup();

		await page.getByRole('button', { name: 'Save' }).click();

		await expect.element(page.getByText('Name is required.')).toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('prefills from an existing purpose and submits its values', async () => {
		const { onsubmit } = setup({ initial: existing });

		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({
			name: 'Emergency',
			description: 'Rainy day',
			target_amount: '10000'
		});
	});

	it('offers delete only when editing', async () => {
		const ondelete = vi.fn();
		render(PurposeForm, {
			initial: existing,
			onsubmit: vi.fn(),
			oncancel: vi.fn(),
			ondelete
		});

		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		expect(ondelete).toHaveBeenCalled();
	});
});
