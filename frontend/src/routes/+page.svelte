<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { auth } from '$lib/auth/auth.store.svelte';
	import AccountsManager from '$lib/accounts/AccountsManager.svelte';

	$effect(() => {
		if (!auth.loading && !auth.isAuthenticated) goto(resolve('/login'));
	});

	async function handleLogout() {
		await auth.logout();
		await goto(resolve('/login'));
	}
</script>

<svelte:head><title>Settings</title></svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-slate-50 p-4 dark:bg-slate-950">
	<div class="mx-auto max-w-2xl">
		{#if auth.loading}
			<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
		{:else if auth.user}
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
					<p class="text-sm text-slate-500 dark:text-slate-400">
						Signed in as {auth.user.username}
					</p>
				</div>
				<button
					type="button"
					onclick={handleLogout}
					class="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-800"
				>
					Sign out
				</button>
			</div>

			<AccountsManager />
		{/if}
	</div>
</main>
