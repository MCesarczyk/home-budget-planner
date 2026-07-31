<script lang="ts">
	import { ApiError } from '$lib/api/client';
	import Modal from '$lib/components/Modal.svelte';
	import AccountForm from './AccountForm.svelte';
	import { createAccount, fetchPurposeOptions, updateAccount } from './api';
	import type { Account, AccountInput, PurposeOption } from './types';

	let {
		open,
		account = null,
		onclose,
		onsaved
	}: {
		open: boolean;
		account?: Account | null;
		onclose: () => void;
		onsaved: () => void;
	} = $props();

	let purposes = $state<PurposeOption[]>([]);
	let loaded = $state(false);
	let submitting = $state(false);
	let error = $state('');

	// The active state defaults to the account's, but archive/restore can override
	// it in place (a writable derived — it resets when a different account opens).
	let liveActive = $derived(account?.is_active ?? true);

	$effect(() => {
		if (open && !loaded) loadPurposes();
	});

	async function loadPurposes() {
		try {
			purposes = await fetchPurposeOptions();
			loaded = true;
		} catch {
			// non-fatal: the purpose select just stays empty
		}
	}

	async function handleSubmit(input: AccountInput) {
		submitting = true;
		error = '';
		try {
			if (account) await updateAccount(account.id, input);
			else await createAccount(input);
			onsaved();
			onclose();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to save account.';
		} finally {
			submitting = false;
		}
	}

	// Archive/restore: persist the new active state, refresh the list, and keep
	// the modal open. Accounts are intentionally never deleted.
	async function handleSetActive(input: AccountInput) {
		if (!account) return;
		submitting = true;
		error = '';
		try {
			const updated = await updateAccount(account.id, input);
			liveActive = updated.is_active;
			onsaved();
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Failed to update account.';
		} finally {
			submitting = false;
		}
	}
</script>

<Modal {open} title={account ? 'Edit account' : 'New account'} {onclose}>
	<AccountForm
		{purposes}
		initial={account}
		active={liveActive}
		{submitting}
		{error}
		onsubmit={handleSubmit}
		onsetactive={handleSetActive}
		oncancel={onclose}
	/>
</Modal>
