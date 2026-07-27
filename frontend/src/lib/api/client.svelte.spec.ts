import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';

// Browser project: exercises the CSRF-cookie logic, which needs a real
// `document.cookie`.
beforeEach(() => {
	document.cookie = 'csrftoken=tok-123; path=/';
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
});
afterEach(() => {
	vi.unstubAllGlobals();
	document.cookie = 'csrftoken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});

describe('api() CSRF handling', () => {
	it('attaches X-CSRFToken from the cookie on unsafe methods', async () => {
		await api('/auth/login/', { method: 'POST', body: '{}' });
		const options = vi.mocked(fetch).mock.calls[0][1]!;
		expect((options.headers as Headers).get('X-CSRFToken')).toBe('tok-123');
	});

	it('does not attach X-CSRFToken on safe methods', async () => {
		await api('/auth/me/');
		const options = vi.mocked(fetch).mock.calls[0][1]!;
		expect((options.headers as Headers).has('X-CSRFToken')).toBe(false);
	});
});
