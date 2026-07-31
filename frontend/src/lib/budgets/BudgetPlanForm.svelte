<script lang="ts">
	import { currentMonth } from '$lib/transactions/helpers';
	import type { Category, Subcategory } from '$lib/transactions/types';
	import type { BudgetPlanDetail, BudgetPlanInput } from './types';

	let {
		categories,
		subcategories,
		initial = null,
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
		submitting?: boolean;
		deleting?: boolean;
		error?: string;
		onsubmit: (input: BudgetPlanInput) => void;
		oncancel: () => void;
		ondelete?: () => void;
	} = $props();

	interface Row {
		key: number;
		subcategoryId: string;
		amount: number | null;
	}
	let uid = 0;
	function makeRow(subcategoryId = '', amount: number | null = null): Row {
		return { key: uid++, subcategoryId, amount };
	}

	// Seed field state once from the plan being edited (null for a new one).
	// input type="month" wants YYYY-MM; the stored month is YYYY-MM-DD.
	function seed() {
		return {
			month: initial ? initial.month.slice(0, 7) : currentMonth(),
			rows: initial
				? initial.items.map((it) => makeRow(String(it.subcategory.id), Number(it.amount)))
				: [makeRow()]
		};
	}
	const seeded = seed();

	let month = $state(seeded.month);
	let rows = $state<Row[]>(seeded.rows.length ? seeded.rows : [makeRow()]);
	let validationError = $state('');
	let confirmingDelete = $state(false);

	// Subcategories grouped under their category, for a grouped <select>.
	let groups = $derived(
		categories
			.map((c) => ({
				id: c.id,
				name: c.name,
				subs: subcategories.filter((s) => s.category === c.id)
			}))
			.filter((g) => g.subs.length > 0)
	);

	function addRow() {
		rows = [...rows, makeRow()];
	}
	function removeRow(key: number) {
		rows = rows.filter((r) => r.key !== key);
	}

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
		const seen: number[] = [];
		for (const r of rows) {
			// Skip fully-blank rows so an accidental empty line isn't an error.
			if (!r.subcategoryId && r.amount == null) continue;
			if (!r.subcategoryId) {
				validationError = 'Every line needs a subcategory.';
				return;
			}
			if (!(Number(r.amount) > 0)) {
				validationError = 'Every amount must be greater than 0.';
				return;
			}
			const sid = Number(r.subcategoryId);
			if (seen.includes(sid)) {
				validationError = 'Each subcategory can appear only once.';
				return;
			}
			seen.push(sid);
			items.push({ subcategory: sid, amount: String(r.amount) });
		}

		onsubmit({ month: `${month}-01`, items });
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<label class={labelClass} for="budget-month">Month</label>
		<input id="budget-month" type="month" bind:value={month} class={fieldClass} />
	</div>

	<div>
		<div class="mb-1 flex items-center justify-between">
			<span class={labelClass}>Lines</span>
			<button
				type="button"
				onclick={addRow}
				class="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
			>
				+ Add line
			</button>
		</div>

		{#if rows.length === 0}
			<p class="py-2 text-xs text-slate-400 dark:text-slate-500">
				No lines yet — add one, or save an empty plan.
			</p>
		{:else}
			<ul class="space-y-2">
				{#each rows as row, i (row.key)}
					<li class="grid grid-flow-col gap-2">
						<select
							aria-label="Subcategory for line {i + 1}"
							bind:value={row.subcategoryId}
							class="{fieldClass} flex-1"
						>
							<option value="">Select subcategory…</option>
							{#each groups as group (group.id)}
								<optgroup label={group.name}>
									{#each group.subs as sub (sub.id)}
										<option value={String(sub.id)}>{sub.name}</option>
									{/each}
								</optgroup>
							{/each}
						</select>
						<input
							type="number"
							step="0.01"
							min="0"
							aria-label="Amount for line {i + 1}"
							bind:value={row.amount}
							placeholder="0.00"
							class="{fieldClass} w-28"
						/>
						<button
							type="button"
							aria-label="Remove line {i + 1}"
							onclick={() => removeRow(row.key)}
							class="rounded-md px-2 py-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-red-400"
						>
							✕
						</button>
					</li>
				{/each}
			</ul>
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
