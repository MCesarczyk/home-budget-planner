<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { auth } from '$lib/auth/auth.store.svelte';
	import { ApiError } from '$lib/api/client';
	import { fetchNetWorth } from '$lib/net-worth/api';
	import type { NetWorthReport } from '$lib/net-worth/types';
	import NetWorthSummary from '$lib/net-worth/NetWorthSummary.svelte';
	import { fetchPurposes } from '$lib/purposes/api';
	import type { PurposesReport } from '$lib/purposes/types';
	import PurposesSummary from '$lib/purposes/PurposesSummary.svelte';
	import { fetchCashflow } from '$lib/cashflow/api';
	import type { CashflowReport } from '$lib/cashflow/types';
	import CashflowChart from '$lib/cashflow/CashflowChart.svelte';

	let netWorth = $state<NetWorthReport | null>(null);
	let nwLoading = $state(true);
	let nwError = $state('');

	let purposes = $state<PurposesReport | null>(null);
	let pLoading = $state(true);
	let pError = $state('');

	let cashflow = $state<CashflowReport | null>(null);
	let cfLoading = $state(true);
	let cfError = $state('');

	// Which purpose each account is earmarked for, so net worth can flag them.
	let purposeByAccount = $derived.by(() => {
		const map: Record<number, string> = {};
		for (const purpose of purposes?.purposes ?? []) {
			for (const account of purpose.accounts) map[account.id] = purpose.name;
		}
		return map;
	});

	$effect(() => {
		if (!auth.loading && !auth.isAuthenticated) goto(resolve('/login'));
	});

	$effect(() => {
		if (!auth.isAuthenticated) return;
		loadNetWorth();
		loadPurposes();
		loadCashflow();
	});

	async function loadNetWorth() {
		nwLoading = true;
		nwError = '';
		try {
			netWorth = await fetchNetWorth();
		} catch (e) {
			nwError = e instanceof ApiError ? e.message : 'Failed to load net worth.';
		} finally {
			nwLoading = false;
		}
	}

	async function loadPurposes() {
		pLoading = true;
		pError = '';
		try {
			purposes = await fetchPurposes();
		} catch (e) {
			pError = e instanceof ApiError ? e.message : 'Failed to load purposes.';
		} finally {
			pLoading = false;
		}
	}

	async function loadCashflow() {
		cfLoading = true;
		cfError = '';
		try {
			cashflow = await fetchCashflow();
		} catch (e) {
			cfError = e instanceof ApiError ? e.message : 'Failed to load cash flow.';
		} finally {
			cfLoading = false;
		}
	}
</script>

<svelte:head><title>Finances</title></svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-slate-50 p-4 dark:bg-slate-950">
	<div class="mx-auto max-w-2xl">
		<div class="space-y-4">
			<NetWorthSummary report={netWorth} loading={nwLoading} error={nwError} {purposeByAccount} />
			<CashflowChart report={cashflow} loading={cfLoading} error={cfError} />
			<PurposesSummary report={purposes} loading={pLoading} error={pError} />
		</div>
	</div>
</main>
