<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import Modal from '$lib/components/Modal.svelte';
	import PurposeForm from './PurposeForm.svelte';
	import { createPurpose, deletePurpose, updatePurpose } from './api';
	import type { Purpose, PurposeInput } from './types';

	let {
		open,
		purpose = null,
		onclose,
		onsaved
	}: {
		open: boolean;
		purpose?: Purpose | null;
		onclose: () => void;
		onsaved: () => void;
	} = $props();

	let submitting = $state(false);
	let deleting = $state(false);
	let error = $state('');

	async function handleSubmit(input: PurposeInput) {
		submitting = true;
		error = '';
		try {
			if (purpose) await updatePurpose(purpose.id, input);
			else await createPurpose(input);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to save purpose.';
		} finally {
			submitting = false;
		}
	}

	async function handleDelete() {
		if (!purpose) return;
		deleting = true;
		error = '';
		try {
			await deletePurpose(purpose.id);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to delete purpose.';
		} finally {
			deleting = false;
		}
	}
</script>

<Modal {open} title={purpose ? 'Edit purpose' : 'New purpose'} {onclose}>
	<PurposeForm
		initial={purpose}
		{submitting}
		{deleting}
		{error}
		onsubmit={handleSubmit}
		oncancel={onclose}
		ondelete={purpose ? handleDelete : undefined}
	/>
</Modal>
