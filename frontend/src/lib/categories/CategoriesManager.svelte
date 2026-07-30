<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { fetchCategoryList } from './api';
	import type { Category } from './types';
	import CategoryModal from './CategoryModal.svelte';

	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let error = $state('');
	let modalOpen = $state(false);
	let editing = $state<Category | null>(null);

	$effect(() => {
		load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			categories = await fetchCategoryList();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to load categories.';
		} finally {
			loading = false;
		}
	}

	function openNew() {
		editing = null;
		modalOpen = true;
	}
	function openEdit(category: Category) {
		editing = category;
		modalOpen = true;
	}
	function onRowKey(e: KeyboardEvent, category: Category) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openEdit(category);
		}
	}

	function kindClass(kind: string): string {
		return kind === 'income'
			? 'text-emerald-600 dark:text-emerald-400'
			: 'text-red-600 dark:text-red-400';
	}
</script>

<div
	class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	<div
		class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
	>
		<h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Categories</h2>
		<button
			type="button"
			onclick={openNew}
			class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
		>
			Add category
		</button>
	</div>

	{#if loading}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if categories.length === 0}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No categories yet.</p>
	{:else}
		<ul class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each categories as category (category.id)}
				<li>
					<div
						role="button"
						tabindex="0"
						onclick={() => openEdit(category)}
						onkeydown={(e) => onRowKey(e, category)}
						class="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
					>
						<span class="text-slate-700 dark:text-slate-300">{category.name}</span>
						<span class="text-xs font-medium {kindClass(category.kind)}">{category.kind}</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<CategoryModal
	open={modalOpen}
	category={editing}
	onclose={() => (modalOpen = false)}
	onsaved={load}
/>
