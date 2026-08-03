export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';
const THEMES: readonly Theme[] = ['light', 'dark', 'system'];
const isBrowser = typeof window !== 'undefined';

function systemPrefersDark(): boolean {
	return isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStored(): Theme {
	if (!isBrowser) return 'system';
	const v = localStorage.getItem(STORAGE_KEY);
	return (THEMES as readonly string[]).includes(v ?? '') ? (v as Theme) : 'system';
}

class ThemeState {
	preference = $state<Theme>('system');
	#systemDark = $state(false);

	get resolved(): 'light' | 'dark' {
		if (this.preference === 'system') return this.#systemDark ? 'dark' : 'light';
		return this.preference;
	}

	set(theme: Theme): void {
		this.preference = theme;
		if (isBrowser) localStorage.setItem(STORAGE_KEY, theme);
		this.#apply();
	}

	cycle(): void {
		const next = THEMES[(THEMES.indexOf(this.preference) + 1) % THEMES.length];
		this.set(next);
	}

	init(): void {
		if (!isBrowser) return;
		this.preference = readStored();
		this.#systemDark = systemPrefersDark();
		this.#apply();
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			this.#systemDark = e.matches;
			if (this.preference === 'system') this.#apply();
		});
	}

	#apply(): void {
		if (!isBrowser) return;
		document.documentElement.classList.toggle('dark', this.resolved === 'dark');
	}
}

export const theme = new ThemeState();
