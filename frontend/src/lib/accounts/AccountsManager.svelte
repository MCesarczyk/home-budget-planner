<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { fetchAccounts } from './api';
	import type { Account } from './types';
	import AccountModal from './AccountModal.svelte';

	let accounts = $state<Account[]>([]);
	let loading = $state(true);
	let error = $state('');
	let modalOpen = $state(false);
	let editing = $state<Account | null>(null);

	$effect(() => {
		load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			accounts = await fetchAccounts();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to load accounts.';
		} finally {
			loading = false;
		}
	}

	function openNew() {
		editing = null;
		modalOpen = true;
	}
	function openEdit(account: Account) {
		editing = account;
		modalOpen = true;
	}
	function onRowKey(e: KeyboardEvent, account: Account) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openEdit(account);
		}
	}

	function typeLabel(t: string): string {
		return t.charAt(0).toUpperCase() + t.slice(1);
	}
	function amountClass(v: string): string {
		return v.startsWith('-')
			? 'text-red-600 dark:text-red-400'
			: 'text-slate-900 dark:text-slate-100';
	}
</script>

<div
	class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	<div
		class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
	>
		<h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Accounts</h2>
		<button
			type="button"
			onclick={openNew}
			class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
		>
			Add account
		</button>
	</div>

	{#if loading}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if accounts.length === 0}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No accounts yet.</p>
	{:else}
		<ul class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each accounts as account (account.id)}
				<li>
					<div
						role="button"
						tabindex="0"
						onclick={() => openEdit(account)}
						onkeydown={(e) => onRowKey(e, account)}
						class="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
					>
						<span class="text-slate-700 dark:text-slate-300">
							{account.name}
							<span class="ml-1 text-xs text-slate-400 dark:text-slate-500"
								>{typeLabel(account.type)}</span
							>
							{#if !account.is_active}
								<span
									class="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
									>Archived</span
								>
							{/if}
						</span>
						<span class="font-medium {amountClass(account.balance)}">{account.balance}</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<AccountModal
	open={modalOpen}
	account={editing}
	onclose={() => (modalOpen = false)}
	onsaved={load}
/>
