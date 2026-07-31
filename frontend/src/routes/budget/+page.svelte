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
	import type { BudgetPlanRef, BudgetProgressReport } from '$lib/budgets/types';
	import BudgetProgress from '$lib/budgets/BudgetProgress.svelte';

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

	let plans = $state<BudgetPlanRef[]>([]);
	let selectedId = $state<number | null>(null);
	let report = $state<BudgetProgressReport | null>(null);
	let loading = $state(true);
	let error = $state('');

	let reqId = 0;

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
		plans = await fetchBudgetPlans().catch(() => [] as BudgetPlanRef[]);
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
</script>

<svelte:head><title>Budget</title></svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-slate-50 p-4 dark:bg-slate-950">
	<div class="mx-auto max-w-2xl">
		<div class="mb-4 flex items-center justify-between gap-3">
			<h1 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Budget plan</h1>
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
			{/if}
		</div>

		<BudgetProgress {report} {loading} {error} />
	</div>
</main>
