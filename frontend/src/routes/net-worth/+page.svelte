<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { auth } from '$lib/auth/auth.store.svelte';
	import { ApiError } from '$lib/api/client';
	import { fetchNetWorth } from '$lib/net-worth/api';
	import type { NetWorthReport } from '$lib/net-worth/types';
	import NetWorthSummary from '$lib/net-worth/NetWorthSummary.svelte';

	let report = $state<NetWorthReport | null>(null);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		if (!auth.loading && !auth.isAuthenticated) goto(resolve('/login'));
	});

	$effect(() => {
		if (auth.isAuthenticated) load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			report = await fetchNetWorth();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to load net worth.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Net worth</title></svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-slate-50 p-4 dark:bg-slate-950">
	<div class="mx-auto max-w-2xl">
		<h1 class="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Net worth</h1>
		<NetWorthSummary {report} {loading} {error} />
	</div>
</main>
