<script lang="ts">
	import { theme } from '$lib/theme/theme.store.svelte';

	const labels = { light: 'Light', dark: 'Dark', system: 'System' } as const;
</script>

<button
	type="button"
	onclick={() => theme.cycle()}
	title={`Theme: ${labels[theme.preference]} — click to change`}
	aria-label={`Change theme (currently ${labels[theme.preference]})`}
	class="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-200/70 focus:ring-2 focus:ring-slate-400 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-800"
>
	{#if theme.preference === 'light'}
		<!-- sun -->
		<svg
			class="size-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path
				stroke-linecap="round"
				d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
			/>
		</svg>
	{:else if theme.preference === 'dark'}
		<!-- moon -->
		<svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
		</svg>
	{:else}
		<!-- monitor (system) -->
		<svg
			class="size-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<rect x="3" y="4" width="18" height="12" rx="1" />
			<path stroke-linecap="round" d="M8 20h8m-4-4v4" />
		</svg>
	{/if}
</button>
