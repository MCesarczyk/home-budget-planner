import { api, apiJson } from '../api/client';
import type { User } from './types';

export async function ensureCsrf(): Promise<void> {
	await api('/auth/csrf/');
}

export async function login(username: string, password: string): Promise<void> {
	await ensureCsrf();
	await apiJson('/auth/login/', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});
}

export async function logout(): Promise<void> {
	await apiJson('/auth/logout/', { method: 'POST' });
}

export async function fetchMe(): Promise<User> {
	return apiJson<User>('/auth/me/');
}
