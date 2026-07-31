import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, apiJson } from './client';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'content-type': 'application/json' },
		...init
	});
}

describe('api()', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
	});
	afterEach(() => vi.unstubAllGlobals());

	it('prefixes the API base and sends credentials', async () => {
		await api('/auth/me/');
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/v1/auth/me/');
		expect(options.credentials).toBe('include');
	});

	it('sets a JSON Content-Type when a body is present', async () => {
		await api('/auth/login/', { method: 'POST', body: '{}' });
		const options = fetchMock.mock.calls[0][1];
		expect((options.headers as Headers).get('Content-Type')).toBe('application/json');
	});

	it('does not attach a CSRF header on safe methods', async () => {
		await api('/auth/me/');
		const options = fetchMock.mock.calls[0][1];
		expect((options.headers as Headers).has('X-CSRFToken')).toBe(false);
	});
});

describe('api() token refresh on 401', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('refreshes and retries once when the access token has expired', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response('', { status: 401 })) // original request
			.mockResolvedValueOnce(new Response('', { status: 200 })) // /auth/refresh/
			.mockResolvedValueOnce(new Response('{}', { status: 200 })); // retried request
		vi.stubGlobal('fetch', fetchMock);

		const res = await api('/transactions/');

		expect(res.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/refresh/');
		expect(fetchMock.mock.calls[1][1].method).toBe('POST');
	});

	it('surfaces the 401 without retrying when the refresh fails', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response('', { status: 401 })) // original request
			.mockResolvedValueOnce(new Response('', { status: 401 })); // refresh rejected
		vi.stubGlobal('fetch', fetchMock);

		const res = await api('/transactions/');

		expect(res.status).toBe(401);
		expect(fetchMock).toHaveBeenCalledTimes(2); // original + refresh, no retry
	});

	it('does not attempt a refresh for a 401 from an auth endpoint', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
		vi.stubGlobal('fetch', fetchMock);

		const res = await api('/auth/login/', { method: 'POST', body: '{}' });

		expect(res.status).toBe(401);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

describe('apiJson()', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('parses and returns a JSON body on success', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 1, username: 'ada' })));
		const user = await apiJson<{ id: number; username: string }>('/auth/me/');
		expect(user).toEqual({ id: 1, username: 'ada' });
	});

	it('returns undefined for an empty body', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));
		const result = await apiJson('/auth/logout/', { method: 'POST' });
		expect(result).toBeUndefined();
	});

	it('throws ApiError carrying the backend detail on a non-2xx response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({ detail: 'Invalid credentials.' }, { status: 401 }))
		);
		await expect(apiJson('/auth/login/', { method: 'POST' })).rejects.toMatchObject({
			status: 401,
			message: 'Invalid credentials.'
		});
	});

	it('flattens DRF field errors into a readable message', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(
					jsonResponse(
						{ is_active: ['Account still holds 7837.17; transfer or withdraw the balance first.'] },
						{ status: 400 }
					)
				)
		);
		const err = await apiJson('/accounts/1/', { method: 'PATCH' }).catch((e: unknown) => e);
		expect((err as ApiError).message).toBe(
			'Account still holds 7837.17; transfer or withdraw the balance first.'
		);
	});

	it('falls back to the status text when the error body is not JSON', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('<html>', { status: 500, statusText: 'Server Error' }))
		);
		const err = await apiJson('/x').catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect((err as ApiError).status).toBe(500);
	});
});
