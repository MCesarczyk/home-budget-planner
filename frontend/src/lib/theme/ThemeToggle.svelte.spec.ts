import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ThemeToggle from './ThemeToggle.svelte';
import { theme } from './theme.store.svelte';

beforeEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove('dark');
	theme.preference = 'light';
});

describe('ThemeToggle', () => {
	it('labels the button with the current preference', async () => {
		render(ThemeToggle);
		const button = page.getByRole('button');
		await expect.element(button).toHaveAttribute('aria-label', 'Change theme (currently Light)');
	});

	it('cycles the preference on click', async () => {
		render(ThemeToggle);
		const button = page.getByRole('button');

		await button.click();
		expect(theme.preference).toBe('dark');
		await expect.element(button).toHaveAttribute('aria-label', 'Change theme (currently Dark)');

		await button.click();
		expect(theme.preference).toBe('system');
	});
});
