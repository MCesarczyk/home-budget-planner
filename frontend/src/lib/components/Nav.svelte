<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/transactions', label: 'Transactions' }
	] as const;
</script>

<nav class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
	<div class="mx-auto flex max-w-4xl gap-1 px-4">
		{#each links as link (link.href)}
			{@const href = resolve(link.href)}
			{@const active = page.url.pathname === href}
			<a
				{href}
				aria-current={active ? 'page' : undefined}
				class="border-b-2 px-3 py-3 text-sm font-medium transition-colors {active
					? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
					: 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
			>
				{link.label}
			</a>
		{/each}
	</div>
</nav>
