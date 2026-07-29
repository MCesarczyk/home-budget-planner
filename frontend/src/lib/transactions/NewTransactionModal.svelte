<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import Modal from '$lib/components/Modal.svelte';
	import TransactionForm from './TransactionForm.svelte';
	import {
		createTransaction,
		fetchAccounts,
		fetchCategories,
		fetchSubcategories,
		type TransactionCreateInput
	} from './api';
	import type { Account, Category, Subcategory } from './types';

	let {
		open,
		onclose,
		oncreated
	}: {
		open: boolean;
		onclose: () => void;
		oncreated: () => void;
	} = $props();

	let accounts = $state<Account[]>([]);
	let categories = $state<Category[]>([]);
	let subcategories = $state<Subcategory[]>([]);
	let loaded = $state(false);
	let submitting = $state(false);
	let error = $state('');

	// Fetch the option lists lazily the first time the modal is opened.
	$effect(() => {
		if (open && !loaded) loadOptions();
	});

	async function loadOptions() {
		try {
			const [a, c, s] = await Promise.all([
				fetchAccounts(),
				fetchCategories(),
				fetchSubcategories()
			]);
			accounts = a;
			categories = c;
			subcategories = s;
			loaded = true;
		} catch {
			error = 'Failed to load form options.';
		}
	}

	async function handleSubmit(input: TransactionCreateInput) {
		submitting = true;
		error = '';
		try {
			await createTransaction(input);
			oncreated();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to create transaction.';
		} finally {
			submitting = false;
		}
	}
</script>

<Modal {open} title="New transaction" {onclose}>
	<TransactionForm
		{accounts}
		{categories}
		{subcategories}
		{submitting}
		{error}
		onsubmit={handleSubmit}
		oncancel={onclose}
	/>
</Modal>
