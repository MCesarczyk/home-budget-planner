<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import Modal from '$lib/components/Modal.svelte';
	import CategoryForm from './CategoryForm.svelte';
	import { createCategory, deleteCategory, updateCategory } from './api';
	import type { Category, CategoryInput } from './types';

	let {
		open,
		category = null,
		onclose,
		onsaved
	}: {
		open: boolean;
		category?: Category | null;
		onclose: () => void;
		onsaved: () => void;
	} = $props();

	let submitting = $state(false);
	let deleting = $state(false);
	let error = $state('');

	$effect(() => {
		if (open) error = '';
	});

	async function handleSubmit(input: CategoryInput) {
		submitting = true;
		error = '';
		try {
			if (category) await updateCategory(category.id, input);
			else await createCategory(input);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to save category.';
		} finally {
			submitting = false;
		}
	}

	async function handleDelete() {
		if (!category) return;
		deleting = true;
		error = '';
		try {
			await deleteCategory(category.id);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to delete category.';
		} finally {
			deleting = false;
		}
	}
</script>

<Modal {open} title={category ? 'Edit category' : 'New category'} {onclose}>
	<CategoryForm
		initial={category}
		{submitting}
		{deleting}
		{error}
		onsubmit={handleSubmit}
		oncancel={onclose}
		ondelete={category ? handleDelete : undefined}
	/>
</Modal>
