import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { handle } from './hooks.server';

function proxied(request: Request) {
	const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
	vi.stubGlobal('fetch', fetchMock);
	const resolve = vi.fn();
	const event = { url: new URL(request.url), request } as unknown as RequestEvent;
	return { run: () => handle({ event, resolve }), fetchMock, resolve };
}

describe('API proxy hook', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('forwards Origin and Referer so Django can run its CSRF check', async () => {
		const { run, fetchMock } = proxied(
			new Request('https://budget.example.com/api/v1/transactions/', {
				method: 'POST',
				headers: {
					origin: 'https://budget.example.com',
					referer: 'https://budget.example.com/transactions',
					'x-csrftoken': 'tok'
				},
				body: '{}'
			})
		);
		await run();

		const [, init] = fetchMock.mock.calls[0];
		const headers = init.headers as Headers;
		expect(headers.get('origin')).toBe('https://budget.example.com');
		expect(headers.get('referer')).toBe('https://budget.example.com/transactions');
		expect(headers.get('x-csrftoken')).toBe('tok');
		expect(headers.has('host')).toBe(false);
	});

	it('leaves non-API requests to SvelteKit', async () => {
		const { run, fetchMock, resolve } = proxied(new Request('https://budget.example.com/wishlist'));
		await run();
		expect(resolve).toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
