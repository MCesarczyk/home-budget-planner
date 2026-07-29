<script lang="ts">
	import type { AccountBalance, NetWorthReport } from './types';

	let {
		report,
		loading,
		error,
		purposeByAccount = {}
	}: {
		report: NetWorthReport | null;
		loading: boolean;
		error: string;
		purposeByAccount?: Record<number, string>;
	} = $props();

	function typeLabel(t: string): string {
		return t.charAt(0).toUpperCase() + t.slice(1);
	}

	function amountClass(v: string): string {
		return v.startsWith('-')
			? 'text-red-600 dark:text-red-400'
			: 'text-slate-900 dark:text-slate-100';
	}

	function sumBalances(accounts: AccountBalance[]): string {
		return accounts.reduce((s, a) => s + Number(a.balance), 0).toFixed(2);
	}

	let isEmpty = $derived(
		!report || (report.assets.length === 0 && report.liabilities.length === 0)
	);

	// Dimmed, low-chroma tints cycled per purpose subgroup so they read apart.
	// Full literal strings so Tailwind keeps them.
	const GROUP_TINTS = [
		'bg-sky-50 dark:bg-sky-950/30',
		'bg-amber-50 dark:bg-amber-950/30',
		'bg-violet-50 dark:bg-violet-950/30',
		'bg-emerald-50 dark:bg-emerald-950/30',
		'bg-rose-50 dark:bg-rose-950/30',
		'bg-teal-50 dark:bg-teal-950/30'
	];

	// Assets split into the ungrouped accounts plus one subgroup per purpose.
	interface AssetSection {
		purpose: string | null;
		accounts: AccountBalance[];
		subtotal: string;
		tint: string;
	}
	let assetSections = $derived.by(() => {
		const ungrouped: AccountBalance[] = [];
		const groups: Record<string, AccountBalance[]> = {};
		for (const account of report?.assets ?? []) {
			const purpose = purposeByAccount[account.id];
			if (purpose) {
				(groups[purpose] ??= []).push(account);
			} else {
				ungrouped.push(account);
			}
		}
		const sections: AssetSection[] = [];
		if (ungrouped.length) {
			sections.push({
				purpose: null,
				accounts: ungrouped,
				subtotal: sumBalances(ungrouped),
				tint: ''
			});
		}
		Object.keys(groups)
			.sort((a, b) => a.localeCompare(b))
			.forEach((purpose, i) => {
				sections.push({
					purpose,
					accounts: groups[purpose],
					subtotal: sumBalances(groups[purpose]),
					tint: GROUP_TINTS[i % GROUP_TINTS.length]
				});
			});
		return sections;
	});
</script>

{#snippet accountRow(account: AccountBalance)}
	<li class="flex items-center justify-between px-4 py-2 text-[10px]">
		<span class="text-slate-700 dark:text-slate-300">
			{account.name}
			<span class="ml-1 text-slate-400 dark:text-slate-500">{typeLabel(account.type)}</span>
		</span>
		<span class="font-medium {amountClass(account.balance)}">{account.balance}</span>
	</li>
{/snippet}

{#snippet groupHeader(title: string, total: string)}
	<div class="flex items-baseline justify-between px-4 py-2">
		<h3 class="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
			{title}
		</h3>
		<span class="text-sm font-semibold {amountClass(total)}">{total}</span>
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

		<div>
			{@render groupHeader('Assets', report.total_assets)}
			{#if report.assets.length === 0}
				<ul class="divide-y divide-slate-100 dark:divide-slate-800">
					<li class="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">None</li>
				</ul>
			{:else}
				{#each assetSections as section (section.purpose ?? '__ungrouped')}
					{#if section.purpose}
						<div class="pl-4 overflow-hidden rounded-md {section.tint}">
							<div class="flex items-baseline justify-between py-1.5 pr-4 pl-2">
								<span
									class="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
									>{section.purpose}</span
								>
								<span class="text-[11px] font-medium text-slate-500 dark:text-slate-400"
									>{section.subtotal}</span
								>
							</div>
							<ul class="divide-y divide-slate-100 dark:divide-slate-800/60">
								{#each section.accounts as account (account.id)}
									{@render accountRow(account)}
								{/each}
							</ul>
						</div>
					{:else}
						<ul class="divide-y divide-slate-100 dark:divide-slate-800">
							{#each section.accounts as account (account.id)}
								{@render accountRow(account)}
							{/each}
						</ul>
					{/if}
				{/each}
			{/if}
		</div>

		<div class="border-t border-slate-200 dark:border-slate-800"></div>

		<div>
			{@render groupHeader('Liabilities', report.total_liabilities)}
			<ul class="divide-y divide-slate-100 dark:divide-slate-800">
				{#each report.liabilities as account (account.id)}
					{@render accountRow(account)}
				{:else}
					<li class="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">None</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
