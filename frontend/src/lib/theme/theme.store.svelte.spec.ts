import { beforeEach, describe, expect, it } from 'vitest';
import { theme } from './theme.store.svelte';

beforeEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove('dark');
	theme.preference = 'system';
});

describe('theme store (browser)', () => {
	it('set("dark") adds the .dark class and persists the choice', () => {
		theme.set('dark');
		expect(document.documentElement.classList.contains('dark')).toBe(true);
		expect(localStorage.getItem('theme')).toBe('dark');
	});

	it('set("light") removes the .dark class and persists the choice', () => {
		theme.set('dark');
		theme.set('light');
		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(localStorage.getItem('theme')).toBe('light');
	});

	it('init() applies the stored preference to the DOM', () => {
		localStorage.setItem('theme', 'dark');
		theme.init();
		expect(theme.preference).toBe('dark');
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});
});
