<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import { fetchCategoryList } from '$lib/categories/api';
	import type { Category } from '$lib/categories/types';
	import { fetchSubcategoryList } from './api';
	import type { Subcategory } from './types';
	import SubcategoryModal from './SubcategoryModal.svelte';

	let subcategories = $state<Subcategory[]>([]);
	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let error = $state('');
	let modalOpen = $state(false);
	let editing = $state<Subcategory | null>(null);

	$effect(() => {
		load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			const [subs, cats] = await Promise.all([fetchSubcategoryList(), fetchCategoryList()]);
			subcategories = subs;
			categories = cats;
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to load subcategories.';
		} finally {
			loading = false;
		}
	}

	let categoryName = $derived.by(() => {
		const map: Record<number, string> = {};
		for (const category of categories) map[category.id] = category.name;
		return map;
	});

	function openNew() {
		editing = null;
		modalOpen = true;
	}
	function openEdit(subcategory: Subcategory) {
		editing = subcategory;
		modalOpen = true;
	}
	function onRowKey(e: KeyboardEvent, subcategory: Subcategory) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openEdit(subcategory);
		}
	}
</script>

<div
	class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
>
	<div
		class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
	>
		<h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Subcategories</h2>
		<button
			type="button"
			onclick={openNew}
			class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
		>
			Add subcategory
		</button>
	</div>

	{#if loading}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
	{:else if error}
		<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
	{:else if subcategories.length === 0}
		<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No subcategories yet.</p>
	{:else}
		<ul class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each subcategories as subcategory (subcategory.id)}
				<li>
					<div
						role="button"
						tabindex="0"
						onclick={() => openEdit(subcategory)}
						onkeydown={(e) => onRowKey(e, subcategory)}
						class="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
					>
						<span class="text-slate-700 dark:text-slate-300">{subcategory.name}</span>
						<span class="text-xs text-slate-400 dark:text-slate-500"
							>{categoryName[subcategory.category] ?? ''}</span
						>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<SubcategoryModal
	open={modalOpen}
	subcategory={editing}
	{categories}
	onclose={() => (modalOpen = false)}
	onsaved={load}
/>
