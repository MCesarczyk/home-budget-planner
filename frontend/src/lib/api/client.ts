const BASE = '/api/v1';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export class ApiError extends Error {
	readonly status: number;

	constructor(status: number, detail: string) {
		super(detail);
		this.name = 'ApiError';
		this.status = status;
	}
}

function readCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
	return match ? decodeURIComponent(match[1]) : null;
}

export async function api(path: string, options: RequestInit = {}): Promise<Response> {
	const method = (options.method ?? 'GET').toUpperCase();
	const headers = new Headers(options.headers);

	if (!SAFE_METHODS.has(method)) {
		const csrf = readCookie('csrftoken');
		if (csrf) headers.set('X-CSRFToken', csrf);
	}
	if (options.body != null && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	return fetch(BASE + path, { ...options, headers, credentials: 'include' });
}

// Turn a DRF error body into a human-readable message. DRF returns either
// `{detail: "..."}` or per-field errors like `{field: ["msg", ...]}`; flatten
// the latter into a sentence instead of dumping raw JSON at the user.
function errorDetail(data: unknown): string {
	if (data && typeof data === 'object') {
		const obj = data as Record<string, unknown>;
		if (typeof obj.detail === 'string') return obj.detail;
		const messages: string[] = [];
		for (const value of Object.values(obj)) {
			if (Array.isArray(value)) messages.push(...value.map((v) => String(v)));
			else if (typeof value === 'string') messages.push(value);
		}
		if (messages.length) return messages.join(' ');
	}
	return JSON.stringify(data);
}

export async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await api(path, options);

	if (!res.ok) {
		let detail = res.statusText;
		try {
			detail = errorDetail(await res.json());
		} catch {
			// non-JSON body — keep the status text
		}
		throw new ApiError(res.status, detail);
	}

	const text = await res.text();
	return (text ? JSON.parse(text) : undefined) as T;
}
