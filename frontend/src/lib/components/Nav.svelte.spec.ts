import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Nav from './Nav.svelte';

const route = vi.hoisted(() => ({ path: '/' }));

vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('$app/state', () => ({
	page: {
		get url() {
			return new URL('http://localhost' + route.path);
		}
	}
}));

describe('Nav', () => {
	it('renders a link for each destination', async () => {
		route.path = '/';
		render(Nav);
		await expect.element(page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
		await expect
			.element(page.getByRole('link', { name: 'Transactions' }))
			.toHaveAttribute('href', '/transactions');
		await expect
			.element(page.getByRole('link', { name: 'Finances' }))
			.toHaveAttribute('href', '/finances');
	});

	it('marks the link for the current route as current', async () => {
		route.path = '/transactions';
		render(Nav);
		await expect
			.element(page.getByRole('link', { name: 'Transactions' }))
			.toHaveAttribute('aria-current', 'page');
		await expect
			.element(page.getByRole('link', { name: 'Home' }))
			.not.toHaveAttribute('aria-current');
	});
});
