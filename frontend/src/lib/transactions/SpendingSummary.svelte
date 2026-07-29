<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { SpendingReport } from './types';

	let {
		report,
		loading,
		error,
		label
	}: {
		report: SpendingReport | null;
		loading: boolean;
		error: string;
		label: string;
	} = $props();

	const expanded = new SvelteSet<number>();

	function toggle(id: number) {
		if (expanded.has(id)) expanded.delete(id);
		else expanded.add(id);
	}
</script>

<div
	class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	<div
		class="flex items-baseline justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
	>
		<h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Spending</h2>
		<span class="text-xs text-slate-500 dark:text-slate-400">{label}</span>
	</div>

	{#if loading}
		<p class="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-6 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if !report || report.categories.length === 0}
		<p class="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
			No spending in this period.
		</p>
	{:else}
		<div class="flex items-baseline justify-between px-4 py-3 text-sm">
			<span class="font-medium text-slate-700 dark:text-slate-200">Total</span>
			<span class="font-semibold text-slate-900 dark:text-slate-100">{report.total}</span>
		</div>

		<ul
			class="max-h-[calc(100vh-16rem)] scrollbar-thin overflow-y-auto border-t border-slate-100 dark:border-slate-800"
		>
			{#each report.categories as category (category.id)}
				<li class="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
					<button
						type="button"
						onclick={() => toggle(category.id)}
						aria-expanded={expanded.has(category.id)}
						class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
					>
						<span class="w-3 text-xs text-slate-400 dark:text-slate-500">
							{expanded.has(category.id) ? '▾' : '▸'}
						</span>
						<span class="flex-1 text-slate-700 dark:text-slate-300">{category.name}</span>
						<span class="font-medium text-slate-900 dark:text-slate-100">{category.total}</span>
					</button>

					{#if expanded.has(category.id)}
						<ul class="pb-2">
							{#each category.subcategories as sub (sub.id)}
								<li
									class="flex items-center justify-between py-1 pr-4 pl-9 text-sm text-slate-500 dark:text-slate-400"
								>
									<span>{sub.name}</span>
									<span>{sub.total}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
