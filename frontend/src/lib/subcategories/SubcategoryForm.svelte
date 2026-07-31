<script lang="ts">
	import type { Category } from '$lib/categories/types';
	import type { Subcategory, SubcategoryInput } from './types';

	let {
		categories,
		initial = null,
		submitting = false,
		deleting = false,
		error = '',
		onsubmit,
		oncancel,
		ondelete
	}: {
		categories: Category[];
		initial?: Subcategory | null;
		submitting?: boolean;
		deleting?: boolean;
		error?: string;
		onsubmit: (input: SubcategoryInput) => void;
		oncancel: () => void;
		ondelete?: () => void;
	} = $props();

	function seed() {
		return {
			name: initial?.name ?? '',
			categoryId: initial ? String(initial.category) : ''
		};
	}
	const seeded = seed();

	let name = $state(seeded.name);
	let categoryId = $state(seeded.categoryId);
	let validationError = $state('');
	let confirmingDelete = $state(false);

	const fieldClass =
		'w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
	const labelClass = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		validationError = '';
		if (!name.trim()) {
			validationError = 'Name is required.';
			return;
		}
		if (!categoryId) {
			validationError = 'Select a category.';
			return;
		}
		onsubmit({ name: name.trim(), category: Number(categoryId) });
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<label class={labelClass} for="subcategory-name">Name</label>
		<input id="subcategory-name" type="text" bind:value={name} class={fieldClass} />
	</div>

	<div>
		<label class={labelClass} for="subcategory-category">Category</label>
		<select id="subcategory-category" bind:value={categoryId} class={fieldClass}>
			<option value="">Select category…</option>
			{#each categories as category (category.id)}
				<option value={String(category.id)}>{category.name}</option>
			{/each}
		</select>
	</div>

	{#if validationError || error}
		<div
			role="alert"
			class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900"
		>
			{validationError || error}
		</div>
	{/if}

	<div class="flex items-center justify-between gap-3 pt-2">
		<div>
			{#if ondelete}
				{#if confirmingDelete}
					<div class="flex items-center gap-2 text-sm">
						<span class="text-slate-600 dark:text-slate-400">Delete?</span>
						<button
							type="button"
							onclick={ondelete}
							disabled={deleting}
							class="rounded-md px-2 py-1 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
						>
							{deleting ? 'Deleting…' : 'Confirm'}
						</button>
						<button
							type="button"
							onclick={() => (confirmingDelete = false)}
							class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
						>
							Keep
						</button>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => (confirmingDelete = true)}
						class="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
					>
						Delete
					</button>
				{/if}
			{/if}
		</div>

		<div class="flex gap-3">
			<button
				type="button"
				onclick={oncancel}
				class="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={submitting}
				class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
			>
				{submitting ? 'Saving…' : 'Save'}
			</button>
		</div>
	</div>
</form>
