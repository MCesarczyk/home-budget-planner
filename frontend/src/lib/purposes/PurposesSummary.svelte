<script lang="ts">
	import type { PurposesReport } from './types';

	let {
		report,
		loading,
		error
	}: {
		report: PurposesReport | null;
		loading: boolean;
		error: string;
	} = $props();

	function percent(progress: number | null): number {
		if (progress === null) return 0;
		return Math.round(progress * 100);
	}

	function barWidth(progress: number | null): string {
		return `${Math.min(100, Math.max(0, percent(progress)))}%`;
	}
</script>

<div
	class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	<div class="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
		<h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Purposes</h2>
	</div>

	{#if loading}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if !report || report.purposes.length === 0}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No purposes defined.</p>
	{:else}
		<ul class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each report.purposes as purpose (purpose.id)}
				<li class="px-4 py-3">
					<div class="flex items-baseline justify-between text-sm">
						<span class="font-medium text-slate-800 dark:text-slate-200">{purpose.name}</span>
						<span class="text-slate-600 dark:text-slate-300">
							{purpose.current_amount}
							{#if purpose.target_amount !== null}
								<span class="text-slate-400 dark:text-slate-500">/ {purpose.target_amount}</span>
							{/if}
						</span>
					</div>

					{#if purpose.progress !== null}
						<div class="mt-2 flex items-center gap-2">
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
								<div
									class="h-full rounded-full bg-emerald-500"
									style="width: {barWidth(purpose.progress)}"
								></div>
							</div>
							<span class="w-10 text-right text-xs text-slate-500 dark:text-slate-400"
								>{percent(purpose.progress)}%</span
							>
						</div>
					{:else}
						<p class="mt-1 text-xs text-slate-400 dark:text-slate-500">No target set</p>
					{/if}

					{#if purpose.accounts.length > 0}
						<p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
							{purpose.accounts.map((a) => a.name).join(', ')}
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
