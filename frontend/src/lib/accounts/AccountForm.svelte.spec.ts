import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import AccountForm from './AccountForm.svelte';
import type { Account, PurposeOption } from './types';

const purposes: PurposeOption[] = [{ id: 3, name: 'Emergency' }];

function setup(props: Record<string, unknown> = {}) {
	const onsubmit = vi.fn();
	const onsetactive = vi.fn();
	const oncancel = vi.fn();
	render(AccountForm, { purposes, onsubmit, onsetactive, oncancel, ...props });
	return { onsubmit, onsetactive, oncancel };
}

const existing: Account = {
	id: 5,
	name: 'Brokerage',
	type: 'investment',
	opening_balance: '1234.56',
	purpose: 3,
	is_active: true,
	balance: '2000.00',
	is_liability: false
};

describe('AccountForm', () => {
	it('submits a new account payload', async () => {
		const { onsubmit } = setup();

		await page.getByRole('textbox', { name: 'Name' }).fill('Savings');
		await page.getByRole('combobox', { name: 'Type' }).selectOptions('savings');
		await page.getByRole('spinbutton', { name: 'Opening balance' }).fill('100');
		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({
			name: 'Savings',
			type: 'savings',
			opening_balance: '100',
			purpose: null,
			is_active: true
		});
	});

	it('requires a name', async () => {
		const { onsubmit } = setup();

		await page.getByRole('button', { name: 'Save' }).click();

		await expect.element(page.getByText('Name is required.')).toBeInTheDocument();
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('prefills from an existing account and submits its values', async () => {
		const { onsubmit } = setup({ initial: existing });

		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledWith({
			name: 'Brokerage',
			type: 'investment',
			opening_balance: '1234.56',
			purpose: 3,
			is_active: true
		});
	});

	it('archives an active account via the Archive button', async () => {
		const { onsetactive, onsubmit } = setup({ initial: existing, active: true });

		await page.getByRole('button', { name: 'Archive' }).click();

		expect(onsetactive).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('restores an archived account via the Restore button', async () => {
		const { onsetactive } = setup({ initial: existing, active: false });

		await page.getByRole('button', { name: 'Restore' }).click();

		expect(onsetactive).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }));
	});

	it('does not show archive controls when creating', async () => {
		setup();
		await expect.element(page.getByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
	});
});
