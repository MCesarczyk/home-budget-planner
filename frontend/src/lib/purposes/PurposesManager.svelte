<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { fetchPurposeList } from './api';
	import type { Purpose } from './types';
	import PurposeModal from './PurposeModal.svelte';

	let purposes = $state<Purpose[]>([]);
	let loading = $state(true);
	let error = $state('');
	let modalOpen = $state(false);
	let editing = $state<Purpose | null>(null);

	$effect(() => {
		load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			purposes = await fetchPurposeList();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to load purposes.';
		} finally {
			loading = false;
		}
	}

	function openNew() {
		editing = null;
		modalOpen = true;
	}
	function openEdit(purpose: Purpose) {
		editing = purpose;
		modalOpen = true;
	}
	function onRowKey(e: KeyboardEvent, purpose: Purpose) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openEdit(purpose);
		}
	}
</script>

<div
	class="flex h-72 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	<div
		class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
	>
		<h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Purposes</h2>
		<button
			type="button"
			onclick={openNew}
			class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
		>
			Add purpose
		</button>
	</div>

	{#if loading}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if purposes.length === 0}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No purposes yet.</p>
	{:else}
		<ul
			class="min-h-0 flex-1 scrollbar-thin divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800"
		>
			{#each purposes as purpose (purpose.id)}
				<li>
					<div
						role="button"
						tabindex="0"
						onclick={() => openEdit(purpose)}
						onkeydown={(e) => onRowKey(e, purpose)}
						class="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
					>
						<span class="text-slate-700 dark:text-slate-300">{purpose.name}</span>
						{#if purpose.target_amount !== null}
							<span class="text-slate-500 dark:text-slate-400">{purpose.target_amount}</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<PurposeModal
	open={modalOpen}
	purpose={editing}
	onclose={() => (modalOpen = false)}
	onsaved={load}
/>
