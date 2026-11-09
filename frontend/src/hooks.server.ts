import type { Handle } from '@sveltejs/kit';

const API_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:8088';

const HOP_BY_HOP = ['host', 'connection', 'content-length'];

export const handle: Handle = async ({ event, resolve }) => {
	const { url, request } = event;

	if (!url.pathname.startsWith('/api')) {
		return resolve(event);
	}

	const headers = new Headers(request.headers);
	for (const h of HOP_BY_HOP) headers.delete(h);

	// Origin/Referer must reach Django: its CSRF check validates Origin against
	// CSRF_TRUSTED_ORIGINS, and over HTTPS it rejects unsafe requests that carry
	// neither ("Referer checking failed - no Referer").

	const method = request.method;
	const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

	const upstream = await fetch(API_TARGET + url.pathname + url.search, {
		method,
		headers,
		body,
		redirect: 'manual'
	});

	const responseHeaders = new Headers();
	for (const [key, value] of upstream.headers) {
		if (key === 'set-cookie' || key === 'content-encoding' || key === 'content-length') continue;
		responseHeaders.set(key, value);
	}
	for (const cookie of upstream.headers.getSetCookie()) {
		responseHeaders.append('set-cookie', cookie);
	}

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders
	});
};
