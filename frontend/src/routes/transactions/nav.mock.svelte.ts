import { SvelteURL } from 'svelte/reactivity';

export const page = $state({ url: new SvelteURL('http://localhost/transactions') });

export function goto(target: string): Promise<void> {
	page.url = new SvelteURL(target, page.url);
	return Promise.resolve();
}

export function setUrl(target: string): void {
	page.url = new SvelteURL(target, 'http://localhost');
}

export function resetNav(): void {
	page.url = new SvelteURL('http://localhost/transactions');
}
