import { beforeEach, describe, expect, it } from 'vitest';
import { theme } from './theme.store.svelte';

beforeEach(() => {
	theme.preference = 'system';
});

describe('theme store (logic)', () => {
	it('resolves an explicit preference directly', () => {
		theme.set('dark');
		expect(theme.resolved).toBe('dark');
		theme.set('light');
		expect(theme.resolved).toBe('light');
	});

	it('cycle() steps light → dark → system → light', () => {
		theme.set('light');
		theme.cycle();
		expect(theme.preference).toBe('dark');
		theme.cycle();
		expect(theme.preference).toBe('system');
		theme.cycle();
		expect(theme.preference).toBe('light');
	});
});
