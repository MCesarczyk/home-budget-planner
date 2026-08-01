<script lang="ts">
	import { currentMonth, shiftMonth } from '$lib/transactions/helpers';
	import type { Category, Subcategory } from '$lib/transactions/types';
	import type { BudgetPlanDetail, BudgetPlanInput } from './types';

	let {
		categories,
		subcategories,
		initial = null,
		template = null,
		submitting = false,
		deleting = false,
		error = '',
		onsubmit,
		oncancel,
		ondelete
	}: {
		categories: Category[];
		subcategories: Subcategory[];
		initial?: BudgetPlanDetail | null;
		template?: BudgetPlanDetail | null;
		submitting?: boolean;
		deleting?: boolean;
		error?: string;
		onsubmit: (input: BudgetPlanInput) => void;
		oncancel: () => void;
		ondelete?: () => void;
	} = $props();

	interface Line {
		included: boolean;
		amount: number | null;
	}

	// Seed once. Every subcategory gets a row; the ones present in the plan being
	// edited (or inherited from a template) start checked with their amount. When
	// creating from a template the month advances to the next one.
	// input type="month" wants YYYY-MM; the stored month is YYYY-MM-DD.
	function seed() {
		const source = initial ?? template;
		const amounts: Record<number, string> = {};
		if (source) for (const it of source.items) amounts[it.subcategory.id] = it.amount;

		const selection: Record<number, Line> = {};
		for (const s of subcategories) {
			const amount = amounts[s.id];
			selection[s.id] = {
				included: amount !== undefined,
				amount: amount !== undefined ? Number(amount) : null
			};
		}

		const month = source
			? initial
				? source.month.slice(0, 7)
				: shiftMonth(source.month.slice(0, 7), 1)
			: currentMonth();

		return { month, selection };
	}
	const seeded = seed();

	let month = $state(seeded.month);
	let selection = $state<Record<number, Line>>(seeded.selection);
	let validationError = $state('');
	let confirmingDelete = $state(false);

	let groups = $derived(
		categories
			.map((c) => ({
				id: c.id,
				name: c.name,
				kind: c.kind,
				subs: subcategories.filter((s) => s.category === c.id)
			}))
			.filter((g) => g.subs.length > 0)
	);
	// Income categories are listed before expenses, each kind as its own section.
	let incomeGroups = $derived(groups.filter((g) => g.kind === 'income'));
	let expenseGroups = $derived(groups.filter((g) => g.kind === 'expense'));

	let includedCount = $derived(Object.values(selection).filter((l) => l.included).length);

	const fieldClass =
		'w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
	const labelClass = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		validationError = '';

		if (!month) {
			validationError = 'Select a month.';
			return;
		}

		const items: { subcategory: number; amount: string }[] = [];
		for (const s of subcategories) {
			const line = selection[s.id];
			if (!line?.included) continue;
			if (!(Number(line.amount) > 0)) {
				validationError = 'Every included line needs an amount greater than 0.';
				return;
			}
			items.push({ subcategory: s.id, amount: String(line.amount) });
		}

		onsubmit({ month: `${month}-01`, items });
	}
</script>

{#snippet groupBlock(group: { id: number; name: string; subs: Subcategory[] })}
	<div
		class="border-b border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60"
	>
		<h4 class="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
			{group.name}
		</h4>
	</div>
	<ul class="divide-y divide-slate-100 dark:divide-slate-800">
		{#each group.subs as sub (sub.id)}
			{@const line = selection[sub.id]}
			<li class="flex items-center gap-3 px-3 py-2">
				<input
					type="checkbox"
					aria-label="Include {sub.name}"
					bind:checked={line.included}
					class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
				/>
				<span
					class="flex-1 text-sm {line.included
						? 'text-slate-800 dark:text-slate-200'
						: 'text-slate-400 dark:text-slate-500'}"
				>
					{sub.name}
				</span>
				<input
					type="number"
					step="0.01"
					min="0"
					aria-label="Amount for {sub.name}"
					bind:value={line.amount}
					disabled={!line.included}
					placeholder="0.00"
					class="{fieldClass} w-28 disabled:opacity-40"
				/>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet kindSection(title: string, sections: { id: number; name: string; subs: Subcategory[] }[])}
	{#if sections.length > 0}
		<div
			class="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-800 dark:bg-slate-800"
		>
			<h3 class="text-xs font-bold tracking-wide text-slate-600 uppercase dark:text-slate-300">
				{title}
			</h3>
		</div>
		{#each sections as group (group.id)}
			{@render groupBlock(group)}
		{/each}
	{/if}
{/snippet}

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<label class={labelClass} for="budget-month">Month</label>
		<input id="budget-month" type="month" bind:value={month} class={fieldClass} />
	</div>

	<div>
		<div class="mb-1 flex items-center justify-between">
			<span class={labelClass}>Lines</span>
			<span class="text-xs text-slate-400 dark:text-slate-500">{includedCount} selected</span>
		</div>

		{#if groups.length === 0}
			<p class="py-2 text-xs text-slate-400 dark:text-slate-500">No categories available.</p>
		{:else}
			<div
				class="scrollbar-thin overflow-y-auto rounded-md ring-1 ring-slate-200 dark:ring-slate-800"
			>
				{@render kindSection('Income', incomeGroups)}
				{@render kindSection('Expenses', expenseGroups)}
			</div>
		{/if}
	</div>

	{#if validationError || error}
		<div
			role="alert"
			class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900"
		>
			{validationError || error}
		</div>
	{/if}

	<div class="flex items-center justify-between gap-3 pt-2">
		<div>
			{#if ondelete}
				{#if confirmingDelete}
					<div class="flex items-center gap-2 text-sm">
						<span class="text-slate-600 dark:text-slate-400">Delete?</span>
						<button
							type="button"
							onclick={ondelete}
							disabled={deleting}
							class="rounded-md px-2 py-1 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
						>
							{deleting ? 'Deleting…' : 'Confirm'}
						</button>
						<button
							type="button"
							onclick={() => (confirmingDelete = false)}
							class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
						>
							Keep
						</button>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => (confirmingDelete = true)}
						class="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
					>
						Delete
					</button>
				{/if}
			{/if}
		</div>

		<div class="flex gap-3">
			<button
				type="button"
				onclick={oncancel}
				class="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={submitting}
				class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
			>
				{submitting ? 'Saving…' : 'Save'}
			</button>
		</div>
	</div>
</form>
