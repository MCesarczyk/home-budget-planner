<script lang="ts">
	import type { AccountBalance, NetWorthReport } from './types';

	let {
		report,
		loading,
		error
	}: {
		report: NetWorthReport | null;
		loading: boolean;
		error: string;
	} = $props();

	function typeLabel(t: string): string {
		return t.charAt(0).toUpperCase() + t.slice(1);
	}

	function amountClass(v: string): string {
		return v.startsWith('-')
			? 'text-red-600 dark:text-red-400'
			: 'text-slate-900 dark:text-slate-100';
	}

	let isEmpty = $derived(
		!report || (report.assets.length === 0 && report.liabilities.length === 0)
	);
</script>

{#snippet group(title: string, items: AccountBalance[], total: string)}
	<div>
		<div class="flex items-baseline justify-between px-4 py-2">
			<h3 class="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
				{title}
			</h3>
			<span class="text-sm font-semibold {amountClass(total)}">{total}</span>
		</div>
		<ul class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each items as account (account.id)}
				<li class="flex items-center justify-between px-4 py-2 text-xs">
					<span class="text-slate-700 dark:text-slate-300">
						{account.name}
						<span class="ml-1 text-slate-400 dark:text-slate-500">{typeLabel(account.type)}</span>
					</span>
					<span class="font-medium {amountClass(account.balance)}">{account.balance}</span>
				</li>
			{:else}
				<li class="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">None</li>
			{/each}
		</ul>
	</div>
{/snippet}

<div
	class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	{#if loading}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if isEmpty}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No accounts yet.</p>
	{:else if report}
		<div
			class="flex items-baseline justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800"
		>
			<span class="text-sm font-medium text-slate-600 dark:text-slate-300">Net worth</span>
			<span class="text-2xl font-bold {amountClass(report.net_worth)}">{report.net_worth}</span>
		</div>

		{@render group('Assets', report.assets, report.total_assets)}
		<div class="border-t border-slate-200 dark:border-slate-800"></div>
		{@render group('Liabilities', report.liabilities, report.total_liabilities)}
	{/if}
</div>
