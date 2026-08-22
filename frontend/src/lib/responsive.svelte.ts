// Mirrors Tailwind's default `sm` breakpoint
export const SM_QUERY = '(min-width: 40rem)';

export function createMediaQuery(query: string) {
	let matches = $state(false);

	$effect(() => {
		const mql = window.matchMedia(query);
		matches = mql.matches;
		const onChange = (e: MediaQueryListEvent) => (matches = e.matches);
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	});

	return {
		get matches() {
			return matches;
		}
	};
}
