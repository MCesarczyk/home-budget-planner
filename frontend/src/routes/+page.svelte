<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { auth } from '$lib/auth/auth.store.svelte';

	$effect(() => {
		if (!auth.loading && !auth.isAuthenticated) goto(resolve('/login'));
	});

	async function handleLogout() {
		await auth.logout();
		await goto(resolve('/login'));
	}
</script>

<svelte:head><title>Home Budget Planner</title></svelte:head>

<main
	class="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-50 p-4 dark:bg-slate-950"
>
	{#if auth.loading}
		<p class="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if auth.user}
		<div
			class="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
		>
			<p class="text-sm text-slate-500 dark:text-slate-400">Signed in as</p>
			<p class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
				{auth.user.username}
			</p>
			<button
				type="button"
				onclick={handleLogout}
				class="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
			>
				Sign out
			</button>
		</div>
	{/if}
</main>
