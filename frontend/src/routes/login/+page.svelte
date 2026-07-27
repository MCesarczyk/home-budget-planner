<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ApiError } from '$lib/api/client';
	import { auth } from '$lib/auth/auth.store.svelte';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	$effect(() => {
		if (auth.isAuthenticated) goto(resolve('/'));
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;

		error = '';
		submitting = true;
		try {
			await auth.login(username, password);
			await goto(resolve('/'));
		} catch (e) {
			error = messageFor(e);
		} finally {
			submitting = false;
		}
	}

	function messageFor(e: unknown): string {
		if (e instanceof ApiError) {
			if (e.status === 401) return 'Invalid username or password.';
			if (e.status === 429) return 'Too many attempts. Please wait a minute and try again.';
			if (e.status === 400) return 'Please enter both a username and a password.';
			return e.message || 'Login failed. Please try again.';
		}
		return 'Could not reach the server. Please try again.';
	}
</script>

<svelte:head><title>Sign in · Home Budget Planner</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
	<div
		class="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
	>
		<h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Sign in</h1>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Home Budget Planner</p>

		<form class="mt-6 space-y-4" onsubmit={handleSubmit}>
			{#if error}
				<div
					class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900"
					role="alert"
				>
					{error}
				</div>
			{/if}

			<div>
				<label for="username" class="block text-sm font-medium text-slate-700 dark:text-slate-300"
					>Username</label
				>
				<input
					id="username"
					name="username"
					type="text"
					autocomplete="username"
					required
					bind:value={username}
					disabled={submitting}
					class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-400"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300"
					>Password</label
				>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					bind:value={password}
					disabled={submitting}
					class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-400"
				/>
			</div>

			<button
				type="submit"
				disabled={submitting}
				class="flex w-full justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
			>
				{submitting ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
	</div>
</main>
