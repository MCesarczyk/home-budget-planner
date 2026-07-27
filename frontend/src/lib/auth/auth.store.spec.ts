import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as utils from './utils';
import { auth } from './auth.store.svelte';

vi.mock('./utils', () => ({
	fetchMe: vi.fn(),
	login: vi.fn(),
	logout: vi.fn()
}));

const fetchMe = vi.mocked(utils.fetchMe);
const login = vi.mocked(utils.login);
const logout = vi.mocked(utils.logout);

const USER = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };

beforeEach(() => {
	vi.clearAllMocks();
	auth.user = null;
	auth.loading = true;
});

describe('auth store', () => {
	it('is unauthenticated when there is no user', () => {
		expect(auth.isAuthenticated).toBe(false);
	});

	it('refresh() loads the user and clears loading on success', async () => {
		fetchMe.mockResolvedValueOnce(USER);
		await auth.refresh();
		expect(auth.user).toEqual(USER);
		expect(auth.isAuthenticated).toBe(true);
		expect(auth.loading).toBe(false);
	});

	it('refresh() leaves the user null when there is no session', async () => {
		fetchMe.mockRejectedValueOnce(new Error('401'));
		await auth.refresh();
		expect(auth.user).toBeNull();
		expect(auth.loading).toBe(false);
	});

	it('login() authenticates then loads the user', async () => {
		login.mockResolvedValueOnce(undefined);
		fetchMe.mockResolvedValueOnce(USER);
		await auth.login('ada', 'secret');
		expect(login).toHaveBeenCalledWith('ada', 'secret');
		expect(auth.user).toEqual(USER);
	});

	it('login() propagates errors and does not load the user', async () => {
		login.mockRejectedValueOnce(new Error('bad creds'));
		await expect(auth.login('ada', 'nope')).rejects.toThrow('bad creds');
		expect(auth.user).toBeNull();
		expect(fetchMe).not.toHaveBeenCalled();
	});

	it('logout() clears the user even if the request fails', async () => {
		auth.user = USER;
		logout.mockRejectedValueOnce(new Error('network'));
		await auth.logout();
		expect(auth.user).toBeNull();
	});
});
