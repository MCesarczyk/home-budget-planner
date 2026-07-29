import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Modal from './Modal.svelte';

const children = createRawSnippet(() => ({
	render: () => `<p>Body content</p>`
}));

describe('Modal', () => {
	it('renders nothing when closed', async () => {
		render(Modal, { open: false, title: 'Test', onclose: vi.fn(), children });
		await expect.element(page.getByText('Body content')).not.toBeInTheDocument();
	});

	it('renders the title and content when open', async () => {
		render(Modal, { open: true, title: 'My dialog', onclose: vi.fn(), children });
		await expect.element(page.getByRole('dialog', { name: 'My dialog' })).toBeInTheDocument();
		await expect.element(page.getByText('Body content')).toBeInTheDocument();
	});

	it('closes from the header button', async () => {
		const onclose = vi.fn();
		render(Modal, { open: true, title: 'X', onclose, children });
		await page.getByRole('button', { name: 'Close dialog' }).click();
		expect(onclose).toHaveBeenCalled();
	});

	it('closes when the backdrop is clicked', async () => {
		const onclose = vi.fn();
		render(Modal, { open: true, title: 'X', onclose, children });
		await page.getByRole('button', { name: 'Close', exact: true }).click();
		expect(onclose).toHaveBeenCalled();
	});

	it('closes on the Escape key', async () => {
		const onclose = vi.fn();
		render(Modal, { open: true, title: 'X', onclose, children });
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(onclose).toHaveBeenCalled();
	});
});
