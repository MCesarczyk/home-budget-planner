import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { ensureCsrf, fetchMe, login, logout } from './utils';

vi.mock('../api/client', () => ({
	api: vi.fn().mockResolvedValue(undefined),
	apiJson: vi.fn().mockResolvedValue(undefined)
}));

const api = vi.mocked(client.api);
const apiJson = vi.mocked(client.apiJson);

beforeEach(() => vi.clearAllMocks());

describe('auth utils', () => {
	it('ensureCsrf hits the CSRF bootstrap endpoint', async () => {
		await ensureCsrf();
		expect(api).toHaveBeenCalledWith('/auth/csrf/');
	});

	it('login bootstraps CSRF, then POSTs the credentials as JSON', async () => {
		await login('ada', 'secret');
		expect(api).toHaveBeenCalledWith('/auth/csrf/');
		expect(apiJson).toHaveBeenCalledWith('/auth/login/', {
			method: 'POST',
			body: JSON.stringify({ username: 'ada', password: 'secret' })
		});
	});

	it('logout POSTs to the logout endpoint', async () => {
		await logout();
		expect(apiJson).toHaveBeenCalledWith('/auth/logout/', { method: 'POST' });
	});

	it('fetchMe returns the user from the me endpoint', async () => {
		const user = { id: 1, username: 'ada', email: 'a@b.c', is_staff: false };
		apiJson.mockResolvedValueOnce(user);
		await expect(fetchMe()).resolves.toEqual(user);
		expect(apiJson).toHaveBeenCalledWith('/auth/me/');
	});
});
