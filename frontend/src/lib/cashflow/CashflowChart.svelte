<script lang="ts">
	import type { CashflowReport } from './types';

	let {
		report,
		loading,
		error
	}: {
		report: CashflowReport | null;
		loading: boolean;
		error: string;
	} = $props();

	const MONTH_NAMES = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];
	function fmtMonth(m: string): string {
		const [year, month] = m.split('-');
		return `${MONTH_NAMES[Number(month) - 1]} ${year.slice(2)}`;
	}

	// Fixed SVG coordinate space; the element scales to its container width.
	const W = 640;
	const H = 200;
	const PAD_L = 44;
	const PAD_R = 12;
	const PAD_T = 12;
	const PAD_B = 28;
	const plotW = W - PAD_L - PAD_R;
	const plotH = H - PAD_T - PAD_B;
	const baseline = PAD_T + plotH;

	let months = $derived(report?.months ?? []);
	let maxVal = $derived(
		Math.max(1, ...months.flatMap((m) => [Number(m.income), Number(m.expense)]))
	);
	// Keep the x-axis readable when there are many months.
	let labelStep = $derived(Math.ceil(months.length / 12));

	function barTop(v: number): number {
		return baseline - (v / maxVal) * plotH;
	}
	function barHeight(v: number): number {
		return (v / maxVal) * plotH;
	}
</script>

<div
	class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	<div
		class="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800"
	>
		<h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Cash flow</h2>
		{#if report}
			<div class="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
				<span
					>In <span class="font-semibold text-emerald-600 dark:text-emerald-400"
						>{report.totals.income}</span
					></span
				>
				<span
					>Out <span class="font-semibold text-red-600 dark:text-red-400"
						>{report.totals.expense}</span
					></span
				>
				<span
					>Net <span class="font-semibold text-slate-900 dark:text-slate-100"
						>{report.totals.net}</span
					></span
				>
			</div>
		{/if}
	</div>

	{#if loading}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if months.length === 0}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No cash flow yet.</p>
	{:else}
		<div class="px-2 py-3">
			<div
				class="mb-1 flex items-center justify-end gap-4 px-2 text-xs text-slate-500 dark:text-slate-400"
			>
				<span class="flex items-center gap-1">
					<span class="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500"></span>Income
				</span>
				<span class="flex items-center gap-1">
					<span class="inline-block h-2.5 w-2.5 rounded-sm bg-red-500"></span>Expense
				</span>
			</div>

			<svg viewBox="0 0 {W} {H}" class="w-full" role="img" aria-label="Monthly income and expense">
				<line
					x1={PAD_L}
					y1={PAD_T}
					x2={W - PAD_R}
					y2={PAD_T}
					class="stroke-slate-200 dark:stroke-slate-800"
					stroke-width="1"
				/>
				<line
					x1={PAD_L}
					y1={baseline}
					x2={W - PAD_R}
					y2={baseline}
					class="stroke-slate-300 dark:stroke-slate-700"
					stroke-width="1"
				/>
				<text x={PAD_L - 6} y={PAD_T + 4} text-anchor="end" class="fill-slate-400 text-[10px]">
					{Math.round(maxVal)}
				</text>
				<text x={PAD_L - 6} y={baseline + 4} text-anchor="end" class="fill-slate-400 text-[10px]"
					>0</text
				>

				{#each months as m, i (m.month)}
					{@const gw = plotW / months.length}
					{@const cx = PAD_L + gw * (i + 0.5)}
					{@const bw = Math.max(3, Math.min(14, gw / 2 - 3))}
					{@const income = Number(m.income)}
					{@const expense = Number(m.expense)}
					<rect
						x={cx - bw - 1}
						y={barTop(income)}
						width={bw}
						height={barHeight(income)}
						rx="2"
						class="fill-emerald-500"
					>
						<title>{fmtMonth(m.month)} · income {m.income} · net {m.net}</title>
					</rect>
					<rect
						x={cx + 1}
						y={barTop(expense)}
						width={bw}
						height={barHeight(expense)}
						rx="2"
						class="fill-red-500"
					>
						<title>{fmtMonth(m.month)} · expense {m.expense} · net {m.net}</title>
					</rect>
					{#if i % labelStep === 0}
						<text x={cx} y={H - 10} text-anchor="middle" class="fill-slate-400 text-[10px]">
							{fmtMonth(m.month)}
						</text>
					{/if}
				{/each}
			</svg>
		</div>
	{/if}
</div>
