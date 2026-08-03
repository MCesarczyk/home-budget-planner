<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const links = [
		{ href: '/', label: 'Settings', icon: true },
		{ href: '/transactions', label: 'Transactions', icon: false },
		{ href: '/budget', label: 'Budget', icon: false },
		{ href: '/finances', label: 'Finances', icon: false }
	] as const;
</script>

<nav class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
	<div class="mx-auto flex max-w-4xl gap-1 px-4">
		{#each links as link (link.href)}
			{@const href = resolve(link.href)}
			{@const active = page.url.pathname === href}
			<a
				{href}
				aria-label={link.icon ? link.label : undefined}
				aria-current={active ? 'page' : undefined}
				class="flex items-center border-b-2 px-3 py-3 text-sm font-medium transition-colors {active
					? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
					: 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
			>
				{#if link.icon}
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="3" />
						<path
							d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
						/>
					</svg>
				{:else}
					{link.label}
				{/if}
			</a>
		{/each}
	</div>
</nav>
