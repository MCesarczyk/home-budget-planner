<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import Modal from '$lib/components/Modal.svelte';
	import { fetchCategories, fetchSubcategories } from '$lib/transactions/api';
	import type { Category, Subcategory } from '$lib/transactions/types';
	import BudgetPlanForm from './BudgetPlanForm.svelte';
	import { createBudgetPlan, deleteBudgetPlan, updateBudgetPlan } from './api';
	import type { BudgetPlanDetail, BudgetPlanInput } from './types';

	let {
		open,
		plan = null,
		template = null,
		onclose,
		onsaved,
		ondeleted
	}: {
		open: boolean;
		plan?: BudgetPlanDetail | null;
		template?: BudgetPlanDetail | null;
		onclose: () => void;
		onsaved: (saved: BudgetPlanDetail) => void;
		ondeleted: () => void;
	} = $props();

	let categories = $state<Category[]>([]);
	let subcategories = $state<Subcategory[]>([]);
	let loaded = $state(false);
	let submitting = $state(false);
	let deleting = $state(false);
	let error = $state('');

	// Clear any error left over from a previous session each time the modal opens
	// (the form re-mounts on open, resetting its own validation, but this
	// modal-level error state would otherwise persist).
	$effect(() => {
		if (open) error = '';
	});

	// Fetch the subcategory picker lazily the first time the modal is opened.
	$effect(() => {
		if (open && !loaded) loadOptions();
	});

	async function loadOptions() {
		try {
			const [c, s] = await Promise.all([fetchCategories(), fetchSubcategories()]);
			categories = c;
			subcategories = s;
			loaded = true;
		} catch {
			error = 'Failed to load form options.';
		}
	}

	async function handleSubmit(input: BudgetPlanInput) {
		submitting = true;
		error = '';
		try {
			const saved = plan ? await updateBudgetPlan(plan.id, input) : await createBudgetPlan(input);
			onsaved(saved);
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to save budget plan.';
		} finally {
			submitting = false;
		}
	}

	async function handleDelete() {
		if (!plan) return;
		deleting = true;
		error = '';
		try {
			await deleteBudgetPlan(plan.id);
			ondeleted();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to delete budget plan.';
		} finally {
			deleting = false;
		}
	}
</script>

<Modal {open} title={plan ? 'Edit budget plan' : 'New budget plan'} {onclose}>
	<BudgetPlanForm
		{categories}
		{subcategories}
		initial={plan}
		template={plan ? null : template}
		{submitting}
		{deleting}
		{error}
		onsubmit={handleSubmit}
		oncancel={onclose}
		ondelete={plan ? handleDelete : undefined}
	/>
</Modal>
