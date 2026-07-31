<script lang="ts">
	import type { Account, AccountInput, AccountType, PurposeOption } from './types';

	let {
		purposes,
		initial = null,
		active = true,
		submitting = false,
		error = '',
		onsubmit,
		onsetactive,
		oncancel
	}: {
		purposes: PurposeOption[];
		initial?: Account | null;
		// Current active state — controlled by the modal so archive/restore reflects
		// the persisted result (and never flips on a failed archive).
		active?: boolean;
		submitting?: boolean;
		error?: string;
		onsubmit: (input: AccountInput) => void;
		onsetactive: (input: AccountInput) => void;
		oncancel: () => void;
	} = $props();

	const TYPES: { value: AccountType; label: string }[] = [
		{ value: 'checking', label: 'Checking' },
		{ value: 'savings', label: 'Savings' },
		{ value: 'investment', label: 'Investment' },
		{ value: 'liability', label: 'Liability' }
	];

	function seed() {
		return {
			name: initial?.name ?? '',
			type: initial?.type ?? ('checking' as AccountType),
			openingBalance: initial ? Number(initial.opening_balance) : 0,
			purposeId: initial?.purpose != null ? String(initial.purpose) : ''
		};
	}
	const seeded = seed();

	let name = $state(seeded.name);
	let type = $state<AccountType>(seeded.type);
	let openingBalance = $state<number | null>(seeded.openingBalance);
	let purposeId = $state(seeded.purposeId);
	let validationError = $state('');

	const fieldClass =
		'w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
	const labelClass = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

	function buildInput(isActive: boolean): AccountInput | null {
		validationError = '';
		if (!name.trim()) {
			validationError = 'Name is required.';
			return null;
		}
		return {
			name: name.trim(),
			type,
			opening_balance: String(openingBalance ?? 0),
			purpose: purposeId ? Number(purposeId) : null,
			is_active: isActive
		};
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const input = buildInput(active);
		if (input) onsubmit(input);
	}

	// Archive/restore updates in place — the modal stays open (unlike Save).
	function toggleActive() {
		const input = buildInput(!active);
		if (input) onsetactive(input);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<label class={labelClass} for="acc-name">Name</label>
		<input id="acc-name" type="text" bind:value={name} class={fieldClass} />
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div>
			<label class={labelClass} for="acc-type">Type</label>
			<select id="acc-type" bind:value={type} class={fieldClass}>
				{#each TYPES as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class={labelClass} for="acc-opening">Opening balance</label>
			<input
				id="acc-opening"
				type="number"
				step="0.01"
				bind:value={openingBalance}
				class={fieldClass}
			/>
		</div>
	</div>

	<div>
		<label class={labelClass} for="acc-purpose">Purpose</label>
		<select id="acc-purpose" bind:value={purposeId} class={fieldClass}>
			<option value="">No purpose</option>
			{#each purposes as purpose (purpose.id)}
				<option value={String(purpose.id)}>{purpose.name}</option>
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
			{#if initial}
				<button
					type="button"
					onclick={toggleActive}
					disabled={submitting}
					class="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 {active
						? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30'
						: 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30'}"
				>
					{active ? 'Archive' : 'Restore'}
				</button>
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
