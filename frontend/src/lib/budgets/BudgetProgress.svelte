<script lang="ts">
	import type { BudgetProgressReport, ProgressCategory } from './types';

	let {
		report,
		loading,
		error
	}: {
		report: BudgetProgressReport | null;
		loading: boolean;
		error: string;
	} = $props();

	const FULL_MONTHS = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	function fmtMonth(iso: string): string {
		if (!iso) return '';
		const [year, month] = iso.split('-');
		return `${FULL_MONTHS[Number(month) - 1]} ${year}`;
	}

	function isUnbudgeted(planned: string): boolean {
		return Number(planned) === 0;
	}

	function pctLabel(progress: number | null): string {
		return progress === null ? '—' : `${Math.round(progress * 100)}%`;
	}

	function barWidth(progress: number | null): string {
		if (progress === null) return '0%';
		return `${Math.min(100, Math.max(0, progress * 100))}%`;
	}

	// Expense within budget reads positive (emerald); over budget is a warning
	// (red). Income fills toward its planned target (indigo). Unbudgeted spend has
	// no plan to measure against, so it stays neutral.
	function barColor(kind: 'income' | 'expense', progress: number | null): string {
		if (progress === null) return 'bg-slate-400 dark:bg-slate-500';
		if (kind === 'expense') return progress > 1 ? 'bg-red-500' : 'bg-emerald-500';
		return 'bg-indigo-500';
	}

	function pctClass(kind: 'income' | 'expense', progress: number | null): string {
		if (progress !== null && kind === 'expense' && progress > 1) {
			return 'text-red-600 dark:text-red-400';
		}
		return 'text-slate-500 dark:text-slate-400';
	}

	interface Note {
		text: string;
		cls: string;
	}
	function remainingNote(
		kind: 'income' | 'expense',
		planned: string,
		remaining: string
	): Note | null {
		if (isUnbudgeted(planned)) return null;
		const r = Number(remaining);
		const abs = remaining.replace('-', '');
		if (kind === 'expense') {
			return r >= 0
				? { text: `${remaining} left`, cls: 'text-slate-400 dark:text-slate-500' }
				: { text: `${abs} over`, cls: 'text-red-600 dark:text-red-400' };
		}
		return r > 0
			? { text: `${remaining} to go`, cls: 'text-slate-400 dark:text-slate-500' }
			: { text: `${abs} over`, cls: 'text-emerald-600 dark:text-emerald-400' };
	}

	function fundsToDistribute(r: BudgetProgressReport): number {
		return Number(r.totals.income.planned) - Number(r.totals.expense.planned);
	}

	function incomeSpentPercent(r: BudgetProgressReport): number | null {
		const income = Number(r.totals.income.actual);
		if (income <= 0) return null;
		return Math.round((Number(r.totals.expense.actual) / income) * 100);
	}

	function monthlyProgressPercent(iso: string): number {
		const [y, m] = iso.split('-').map(Number);
		const now = new Date();
		const start = new Date(y, m - 1, 1);
		const next = new Date(y, m, 1);
		if (now >= next) return 100;
		if (now < start) return 0;
		const daysInMonth = new Date(y, m, 0).getDate();
		return Math.round((now.getDate() / daysInMonth) * 100);
	}

	function clampPct(p: number | null): string {
		if (p === null) return '0%';
		return `${Math.min(100, Math.max(0, p))}%`;
	}

	let expenseCats = $derived<ProgressCategory[]>(
		report?.categories.filter((c) => c.kind === 'expense') ?? []
	);
	let incomeCats = $derived<ProgressCategory[]>(
		report?.categories.filter((c) => c.kind === 'income') ?? []
	);
</script>

{#snippet meter(
	kind: 'income' | 'expense',
	name: string,
	planned: string,
	actual: string,
	remaining: string,
	progress: number | null,
	strong: boolean
)}
	{@const unbudgeted = isUnbudgeted(planned)}
	{@const note = remainingNote(kind, planned, remaining)}
	<div class="flex items-baseline justify-between text-xs">
		<span
			class={strong
				? 'font-semibold text-slate-800 dark:text-slate-200'
				: 'font-medium text-slate-700 dark:text-slate-300'}
		>
			{name}
			{#if unbudgeted}
				<span
					class="ml-1 rounded-sm bg-slate-100 px-1 py-0.5 text-[10px] font-normal text-slate-500 dark:bg-slate-800 dark:text-slate-400"
					>unbudgeted</span
				>
			{/if}
		</span>
		<span class="text-slate-600 tabular-nums dark:text-slate-300">
			{actual}{#if !unbudgeted}<span class="text-slate-400 dark:text-slate-500">
					/ {planned}</span
				>{/if}
		</span>
	</div>
	<div class="mt-1.5 flex items-center gap-2">
		<div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
			<div
				class="h-full rounded-full {barColor(kind, progress)}"
				style="width: {barWidth(progress)}"
			></div>
		</div>
		<span class="w-11 text-right text-xs tabular-nums {pctClass(kind, progress)}"
			>{pctLabel(progress)}</span
		>
	</div>
	{#if note}
		<p class="mt-0.5 text-right text-[11px] tabular-nums {note.cls}">{note.text}</p>
	{/if}
{/snippet}

{#snippet categoryBlock(cat: ProgressCategory)}
	<li class="px-4 py-3">
		{@render meter(cat.kind, cat.name, cat.planned, cat.actual, cat.remaining, cat.progress, true)}
		{#if cat.subcategories.length > 0}
			<ul class="mt-2 space-y-2 border-l border-slate-100 pl-3 dark:border-slate-800">
				{#each cat.subcategories as sub (sub.id)}
					<li>
						{@render meter(
							cat.kind,
							sub.name,
							sub.planned,
							sub.actual,
							sub.remaining,
							sub.progress,
							false
						)}
					</li>
				{/each}
			</ul>
		{/if}
	</li>
{/snippet}

{#snippet section(title: string, cats: ProgressCategory[])}
	{#if cats.length > 0}
		<div class="border-b border-slate-100 px-4 py-2 dark:border-slate-800/60">
			<h3 class="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
				{title}
			</h3>
		</div>
		<ul class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each cats as cat (cat.id)}
				{@render categoryBlock(cat)}
			{/each}
		</ul>
	{/if}
{/snippet}

<div
	class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	<div
		class="flex items-baseline justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
	>
		<h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Budget</h2>
		{#if report}
			<span class="text-xs text-slate-500 dark:text-slate-400">{fmtMonth(report.month)}</span>
		{/if}
	</div>

	{#if loading}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if !report}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No budget plan yet.</p>
	{:else}
		{@const funds = fundsToDistribute(report)}
		{@const spent = incomeSpentPercent(report)}
		{@const monthly = monthlyProgressPercent(report.month)}
		<div
			class="grid grid-cols-1 divide-y divide-slate-100 border-b border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800"
		>
			<div class="px-4 py-3">
				<p
					class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500"
				>
					Funds to be distributed
				</p>
				<p
					class="mt-1 text-lg font-bold tabular-nums {funds < 0
						? 'text-red-600 dark:text-red-400'
						: 'text-emerald-600 dark:text-emerald-400'}"
				>
					{funds.toFixed(2)}
				</p>
			</div>

			<div class="px-4 py-3">
				<p
					class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500"
				>
					Percentage of income spent
				</p>
				<p
					class="mt-1 text-lg font-bold tabular-nums {spent !== null && spent > 100
						? 'text-red-600 dark:text-red-400'
						: 'text-slate-800 dark:text-slate-100'}"
				>
					{spent === null ? '—' : `${spent}%`}
				</p>
				<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
					<div
						class="h-full rounded-full {spent !== null && spent > 100
							? 'bg-red-500'
							: 'bg-indigo-500'}"
						style="width: {clampPct(spent)}"
					></div>
				</div>
			</div>

			<div class="px-4 py-3">
				<p
					class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500"
				>
					Monthly progress percentage
				</p>
				<p class="mt-1 text-lg font-bold text-slate-800 tabular-nums dark:text-slate-100">
					{monthly}%
				</p>
				<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
					<div
						class="h-full rounded-full bg-slate-400 dark:bg-slate-500"
						style="width: {monthly}%"
					></div>
				</div>
			</div>
		</div>

		<div class="space-y-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
			{@render meter(
				'expense',
				'Expenses',
				report.totals.expense.planned,
				report.totals.expense.actual,
				report.totals.expense.remaining,
				report.totals.expense.progress,
				true
			)}
			{@render meter(
				'income',
				'Income',
				report.totals.income.planned,
				report.totals.income.actual,
				report.totals.income.remaining,
				report.totals.income.progress,
				true
			)}
		</div>

		{#if report.categories.length === 0}
			<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
				This plan has no lines.
			</p>
		{:else}
			{@render section('Expenses', expenseCats)}
			{@render section('Income', incomeCats)}
		{/if}
	{/if}
</div>
