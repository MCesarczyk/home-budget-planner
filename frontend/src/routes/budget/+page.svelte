<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { auth } from '$lib/auth/auth.store.svelte';
	import { ApiError } from '$lib/api/client';
	import {
		fetchBudgetPlans,
		fetchBudgetProgress,
		fetchCurrentBudgetProgress
	} from '$lib/budgets/api';
	import type { BudgetPlanDetail, BudgetProgressReport } from '$lib/budgets/types';
	import BudgetProgress from '$lib/budgets/BudgetProgress.svelte';
	import BudgetPlanModal from '$lib/budgets/BudgetPlanModal.svelte';

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
		const [year, month] = iso.split('-');
		return `${FULL_MONTHS[Number(month) - 1]} ${year}`;
	}

	let plans = $state<BudgetPlanDetail[]>([]);
	let selectedId = $state<number | null>(null);
	let report = $state<BudgetProgressReport | null>(null);
	let loading = $state(true);
	let error = $state('');

	let modalOpen = $state(false);
	let editingPlan = $state<BudgetPlanDetail | null>(null);

	let reqId = 0;

	// The full plan behind the selected month, for the Edit form (list carries items).
	let selectedPlan = $derived(plans.find((p) => p.id === selectedId) ?? null);

	$effect(() => {
		if (!auth.loading && !auth.isAuthenticated) goto(resolve('/login'));
	});

	$effect(() => {
		if (auth.isAuthenticated) init();
	});

	// Load the month list (for the selector) and the plan currently in effect.
	async function init() {
		loading = true;
		error = '';
		plans = await fetchBudgetPlans().catch(() => [] as BudgetPlanDetail[]);
		try {
			report = await fetchCurrentBudgetProgress();
			selectedId = report.id;
		} catch (e) {
			// No plan in effect yet (404) is an empty state, not an error banner.
			if (e instanceof ApiError && e.status === 404) {
				report = null;
			} else {
				error = e instanceof ApiError ? e.message : 'Failed to load budget.';
			}
		} finally {
			loading = false;
		}
	}

	async function loadProgress(id: number) {
		const rid = ++reqId;
		loading = true;
		error = '';
		try {
			const data = await fetchBudgetProgress(id);
			if (rid !== reqId) return;
			report = data;
		} catch (e) {
			if (rid !== reqId) return;
			error = e instanceof ApiError ? e.message : 'Failed to load budget.';
		} finally {
			if (rid === reqId) loading = false;
		}
	}

	function onSelect(e: Event) {
		const id = Number((e.currentTarget as HTMLSelectElement).value);
		selectedId = id;
		loadProgress(id);
	}

	function openNew() {
		editingPlan = null;
		modalOpen = true;
	}
	function openEdit() {
		if (selectedPlan) {
			editingPlan = selectedPlan;
			modalOpen = true;
		}
	}

	// After a save, refresh the plan list and jump to the saved month's progress.
	async function onSaved(saved: BudgetPlanDetail) {
		plans = await fetchBudgetPlans().catch(() => plans);
		selectedId = saved.id;
		loadProgress(saved.id);
	}

	// After a delete, fall back to the latest remaining plan (or the empty state).
	async function onDeleted() {
		plans = await fetchBudgetPlans().catch(() => [] as BudgetPlanDetail[]);
		if (plans.length) {
			selectedId = plans[0].id;
			loadProgress(plans[0].id);
		} else {
			selectedId = null;
			report = null;
		}
	}
</script>

<svelte:head><title>Budget</title></svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-slate-50 p-4 dark:bg-slate-950">
	<div class="mx-auto max-w-2xl">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<h1 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Budget plan</h1>
			<div class="flex items-center gap-2">
				{#if plans.length > 0}
					<select
						aria-label="Budget month"
						value={selectedId ?? ''}
						onchange={onSelect}
						class="rounded-md border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
					>
						{#each plans as plan (plan.id)}
							<option value={plan.id}>{fmtMonth(plan.month)}</option>
						{/each}
					</select>
					<button
						type="button"
						onclick={openEdit}
						disabled={!selectedPlan}
						class="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
					>
						Edit
					</button>
				{/if}
				<button
					type="button"
					onclick={openNew}
					class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					New plan
				</button>
			</div>
		</div>

		<BudgetProgress {report} {loading} {error} />
	</div>

	<BudgetPlanModal
		open={modalOpen}
		plan={editingPlan}
		onclose={() => (modalOpen = false)}
		onsaved={onSaved}
		ondeleted={onDeleted}
	/>
</main>
