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

<main class="flex min-h-screen items-center justify-center bg-slate-50 p-4">
	{#if auth.loading}
		<p class="text-sm text-slate-500">Loading…</p>
	{:else if auth.user}
		<div class="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
			<p class="text-sm text-slate-500">Signed in as</p>
			<p class="mt-1 text-lg font-semibold text-slate-900">{auth.user.username}</p>
			<button
				type="button"
				onclick={handleLogout}
				class="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
			>
				Sign out
			</button>
		</div>
	{/if}
</main>
