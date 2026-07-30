import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { goto } from '$app/navigation';
import { auth } from '$lib/auth/auth.store.svelte';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('$lib/accounts/api', () => ({
	fetchAccounts: vi.fn(),
	fetchPurposeOptions: vi.fn(),
	createAccount: vi.fn(),
	updateAccount: vi.fn()
}));
vi.mock('$lib/purposes/api', () => ({
	fetchPurposeList: vi.fn(),
	createPurpose: vi.fn(),
	updatePurpose: vi.fn(),
	deletePurpose: vi.fn()
}));
vi.mock('$lib/categories/api', () => ({
	fetchCategoryList: vi.fn(),
	createCategory: vi.fn(),
	updateCategory: vi.fn(),
	deleteCategory: vi.fn()
}));
vi.mock('$lib/subcategories/api', () => ({
	fetchSubcategoryList: vi.fn(),
	createSubcategory: vi.fn(),
	updateSubcategory: vi.fn(),
	deleteSubcategory: vi.fn()
}));

const goto_ = vi.mocked(goto);

beforeEach(async () => {
	vi.clearAllMocks();
	const accountsApi = await import('$lib/accounts/api');
	vi.mocked(accountsApi.fetchAccounts).mockResolvedValue([]);
	const purposesApi = await import('$lib/purposes/api');
	vi.mocked(purposesApi.fetchPurposeList).mockResolvedValue([]);
	const categoriesApi = await import('$lib/categories/api');
	vi.mocked(categoriesApi.fetchCategoryList).mockResolvedValue([]);
	const subcategoriesApi = await import('$lib/subcategories/api');
	vi.mocked(subcategoriesApi.fetchSubcategoryList).mockResolvedValue([]);
	auth.user = null;
	auth.loading = false;
});
afterEach(() => vi.restoreAllMocks());

describe('home page', () => {
	it('shows a loading state while the session resolves', async () => {
		auth.loading = true;
		render(Page);
		await expect.element(page.getByText('Loading…')).toBeInTheDocument();
	});

	it('shows the signed-in user and a sign-out button', async () => {
		auth.user = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };
		render(Page);

		await expect.element(page.getByText('Signed in as ada')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
	});

	it('signs out and redirects to login', async () => {
		auth.user = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };
		const logout = vi.spyOn(auth, 'logout').mockResolvedValue();
		render(Page);

		await page.getByRole('button', { name: 'Sign out' }).click();

		await vi.waitFor(() => expect(logout).toHaveBeenCalled());
		await vi.waitFor(() => expect(goto_).toHaveBeenCalledWith('/login'));
	});

	it('redirects to login when unauthenticated', async () => {
		render(Page);
		await vi.waitFor(() => expect(goto_).toHaveBeenCalledWith('/login'));
	});
});
