import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { goto } from '$app/navigation';
import { ApiError } from '$lib/api/client';
import { auth } from '$lib/auth/auth.store.svelte';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));

const goto_ = vi.mocked(goto);

beforeEach(() => {
	vi.clearAllMocks();
	auth.user = null;
	auth.loading = false;
});
afterEach(() => vi.restoreAllMocks());

describe('login page', () => {
	it('renders the sign-in form', async () => {
		render(Page);
		await expect.element(page.getByRole('textbox', { name: 'Username' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
	});

	it('logs in and redirects to the entry page', async () => {
		const login = vi.spyOn(auth, 'login').mockResolvedValue();
		render(Page);

		await page.getByLabelText('Username').fill('ada');
		await page.getByLabelText('Password').fill('secret');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await vi.waitFor(() => expect(login).toHaveBeenCalledWith('ada', 'secret'));
		await vi.waitFor(() => expect(goto_).toHaveBeenCalledWith('/transactions'));
	});

	it('shows a friendly message on invalid credentials', async () => {
		vi.spyOn(auth, 'login').mockRejectedValue(new ApiError(401, 'unauthorized'));
		render(Page);

		await page.getByLabelText('Username').fill('ada');
		await page.getByLabelText('Password').fill('wrong');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect.element(page.getByText('Invalid username or password.')).toBeInTheDocument();
	});

	it('redirects away when already authenticated', async () => {
		auth.user = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };
		render(Page);

		await vi.waitFor(() => expect(goto_).toHaveBeenCalledWith('/transactions'));
	});
});
