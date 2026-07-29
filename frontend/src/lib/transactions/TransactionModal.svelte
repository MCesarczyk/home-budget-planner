<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import Modal from '$lib/components/Modal.svelte';
	import TransactionForm from './TransactionForm.svelte';
	import {
		createTransaction,
		deleteTransaction,
		fetchAccounts,
		fetchCategories,
		fetchSubcategories,
		updateTransaction,
		type TransactionCreateInput
	} from './api';
	import type { Account, Category, Subcategory, Transaction } from './types';

	let {
		open,
		transaction = null,
		onclose,
		onsaved
	}: {
		open: boolean;
		transaction?: Transaction | null;
		onclose: () => void;
		onsaved: () => void;
	} = $props();

	let accounts = $state<Account[]>([]);
	let categories = $state<Category[]>([]);
	let subcategories = $state<Subcategory[]>([]);
	let loaded = $state(false);
	let submitting = $state(false);
	let deleting = $state(false);
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
			if (transaction) await updateTransaction(transaction.id, input);
			else await createTransaction(input);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to save transaction.';
		} finally {
			submitting = false;
		}
	}

	async function handleDelete() {
		if (!transaction) return;
		deleting = true;
		error = '';
		try {
			await deleteTransaction(transaction.id);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to delete transaction.';
		} finally {
			deleting = false;
		}
	}
</script>

<Modal {open} title={transaction ? 'Edit transaction' : 'New transaction'} {onclose}>
	<TransactionForm
		{accounts}
		{categories}
		{subcategories}
		initial={transaction}
		{submitting}
		{deleting}
		{error}
		onsubmit={handleSubmit}
		oncancel={onclose}
		ondelete={transaction ? handleDelete : undefined}
	/>
</Modal>
