<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import Modal from '$lib/components/Modal.svelte';
	import type { Category } from '$lib/categories/types';
	import SubcategoryForm from './SubcategoryForm.svelte';
	import { createSubcategory, deleteSubcategory, updateSubcategory } from './api';
	import type { Subcategory, SubcategoryInput } from './types';

	let {
		open,
		subcategory = null,
		categories,
		onclose,
		onsaved
	}: {
		open: boolean;
		subcategory?: Subcategory | null;
		categories: Category[];
		onclose: () => void;
		onsaved: () => void;
	} = $props();

	let submitting = $state(false);
	let deleting = $state(false);
	let error = $state('');

	$effect(() => {
		if (open) error = '';
	});

	async function handleSubmit(input: SubcategoryInput) {
		submitting = true;
		error = '';
		try {
			if (subcategory) await updateSubcategory(subcategory.id, input);
			else await createSubcategory(input);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to save subcategory.';
		} finally {
			submitting = false;
		}
	}

	async function handleDelete() {
		if (!subcategory) return;
		deleting = true;
		error = '';
		try {
			await deleteSubcategory(subcategory.id);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to delete subcategory.';
		} finally {
			deleting = false;
		}
	}
</script>

<Modal {open} title={subcategory ? 'Edit subcategory' : 'New subcategory'} {onclose}>
	<SubcategoryForm
		{categories}
		initial={subcategory}
		{submitting}
		{deleting}
		{error}
		onsubmit={handleSubmit}
		oncancel={onclose}
		ondelete={subcategory ? handleDelete : undefined}
	/>
</Modal>
