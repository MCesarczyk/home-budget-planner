<script lang="ts">
	import type { TransactionCreateInput } from './api';
	import { today } from './helpers';
	import type { Account, Category, Subcategory, TransactionType } from './types';

	let {
		accounts,
		categories,
		subcategories,
		submitting = false,
		error = '',
		onsubmit,
		oncancel
	}: {
		accounts: Account[];
		categories: Category[];
		subcategories: Subcategory[];
		submitting?: boolean;
		error?: string;
		onsubmit: (input: TransactionCreateInput) => void;
		oncancel: () => void;
	} = $props();

	let type = $state<TransactionType>('expense');
	let amount = $state<number | null>(null);
	let txDate = $state(today());
	let comment = $state('');
	let accountId = $state('');
	let sourceId = $state('');
	let destinationId = $state('');
	let categoryId = $state('');
	let subcategoryId = $state('');
	let validationError = $state('');

	let expectedKind = $derived(type === 'income' ? 'income' : 'expense');
	let activeAccounts = $derived(accounts.filter((a) => a.is_active));
	let categoryOptions = $derived(categories.filter((c) => c.kind === expectedKind));
	let subcategoryOptions = $derived(
		categoryId ? subcategories.filter((s) => s.category === Number(categoryId)) : []
	);

	function setType(next: TransactionType) {
		type = next;
		categoryId = '';
		subcategoryId = '';
		validationError = '';
	}

	function onCategoryChange() {
		subcategoryId = '';
	}

	const fieldClass =
		'w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
	const labelClass = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

	const typeClass = (active: boolean): string =>
		active
			? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
			: 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300';

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		validationError = '';

		if (!(Number(amount) > 0)) {
			validationError = 'Amount must be greater than 0.';
			return;
		}

		const base = { tx_date: txDate, amount: String(amount), comment };

		if (type === 'transfer') {
			if (!sourceId || !destinationId) {
				validationError = 'Select both accounts.';
				return;
			}
			if (sourceId === destinationId) {
				validationError = 'The two accounts must differ.';
				return;
			}
			onsubmit({
				...base,
				source_account: Number(sourceId),
				destination_account: Number(destinationId)
			});
			return;
		}

		if (!accountId) {
			validationError = 'Select an account.';
			return;
		}
		if (!subcategoryId) {
			validationError = 'Select a subcategory.';
			return;
		}
		onsubmit({
			...base,
			subcategory: Number(subcategoryId),
			...(type === 'expense'
				? { source_account: Number(accountId) }
				: { destination_account: Number(accountId) })
		});
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div class="inline-flex overflow-hidden rounded-md ring-1 ring-slate-300 dark:ring-slate-700">
		<button
			type="button"
			onclick={() => setType('expense')}
			class="px-3 py-1.5 text-sm font-medium {typeClass(type === 'expense')}">Expense</button
		>
		<button
			type="button"
			onclick={() => setType('income')}
			class="px-3 py-1.5 text-sm font-medium {typeClass(type === 'income')}">Income</button
		>
		<button
			type="button"
			onclick={() => setType('transfer')}
			class="px-3 py-1.5 text-sm font-medium {typeClass(type === 'transfer')}">Transfer</button
		>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div>
			<label class={labelClass} for="tx-amount">Amount</label>
			<input
				id="tx-amount"
				type="number"
				step="0.01"
				min="0"
				bind:value={amount}
				class={fieldClass}
			/>
		</div>
		<div>
			<label class={labelClass} for="tx-date">Date</label>
			<input id="tx-date" type="date" bind:value={txDate} class={fieldClass} />
		</div>
	</div>

	{#if type === 'transfer'}
		<div>
			<label class={labelClass} for="tx-source">From account</label>
			<select id="tx-source" bind:value={sourceId} class={fieldClass}>
				<option value="">Select account…</option>
				{#each activeAccounts as account (account.id)}
					<option value={String(account.id)}>{account.name}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class={labelClass} for="tx-destination">To account</label>
			<select id="tx-destination" bind:value={destinationId} class={fieldClass}>
				<option value="">Select account…</option>
				{#each activeAccounts as account (account.id)}
					<option value={String(account.id)}>{account.name}</option>
				{/each}
			</select>
		</div>
	{:else}
		<div>
			<label class={labelClass} for="tx-account">Account</label>
			<select id="tx-account" bind:value={accountId} class={fieldClass}>
				<option value="">Select account…</option>
				{#each activeAccounts as account (account.id)}
					<option value={String(account.id)}>{account.name}</option>
				{/each}
			</select>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label class={labelClass} for="tx-category">Category</label>
				<select
					id="tx-category"
					bind:value={categoryId}
					onchange={onCategoryChange}
					class={fieldClass}
				>
					<option value="">Select category…</option>
					{#each categoryOptions as category (category.id)}
						<option value={String(category.id)}>{category.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class={labelClass} for="tx-subcategory">Subcategory</label>
				<select id="tx-subcategory" bind:value={subcategoryId} class={fieldClass}>
					<option value="">Select subcategory…</option>
					{#each subcategoryOptions as subcategory (subcategory.id)}
						<option value={String(subcategory.id)}>{subcategory.name}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}

	<div>
		<label class={labelClass} for="tx-comment">Comment</label>
		<input id="tx-comment" type="text" bind:value={comment} class={fieldClass} />
	</div>

	{#if validationError || error}
		<p class="text-sm text-red-600 dark:text-red-400">{validationError || error}</p>
	{/if}

	<div class="flex justify-end gap-3 pt-2">
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
</form>
