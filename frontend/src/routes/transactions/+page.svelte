<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { auth } from '$lib/auth/auth.store.svelte';
	import { ApiError } from '$lib/api/client';
	import { fetchTransactions, PAGE_SIZE, type TransactionFilters } from '$lib/transactions/api';
	import {
		currentMonth,
		currentYear,
		monthRange,
		shiftMonth,
		shiftYear,
		yearRange
	} from '$lib/transactions/helpers';
	import type { Transaction } from '$lib/transactions/types';

	type Mode = 'all' | 'month' | 'year';

	let mode = $state<Mode>('month');
	let month = $state(currentMonth());
	let year = $state(currentYear());
	let pageNum = $state(1);
	let transactions = $state<Transaction[]>([]);
	let count = $state(0);
	let loading = $state(true);
	let error = $state('');

	let reqId = 0;
	let totalPages = $derived(Math.max(1, Math.ceil(count / PAGE_SIZE)));

	$effect(() => {
		if (!auth.loading && !auth.isAuthenticated) goto(resolve('/login'));
	});

	let filters = $derived<TransactionFilters>(
		mode === 'month' ? monthRange(month) : mode === 'year' ? yearRange(year) : {}
	);

	$effect(() => {
		if (!auth.isAuthenticated) return;
		load(filters, pageNum);
	});

	async function load(filters: TransactionFilters, page: number) {
		const id = ++reqId;
		loading = true;
		error = '';
		try {
			const data = await fetchTransactions(filters, page);
			if (id !== reqId) return;
			transactions = data.results;
			count = data.count;
		} catch (e) {
			if (id !== reqId) return;
			error = e instanceof ApiError ? e.message : 'Failed to load transactions.';
		} finally {
			if (id === reqId) loading = false;
		}
	}

	// Filter changes reset paging; page steps stay within bounds.
	function setMode(next: Mode) {
		mode = next;
		pageNum = 1;
	}
	function setMonth(next: string) {
		month = next;
		pageNum = 1;
	}
	function setYear(next: string) {
		year = next;
		pageNum = 1;
	}
	function prevPage() {
		if (pageNum > 1) pageNum -= 1;
	}
	function nextPage() {
		if (pageNum < totalPages) pageNum += 1;
	}

	const toggleClass = (active: boolean): string =>
		active
			? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
			: 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800';

	const badgeClass: Record<Transaction['type'], string> = {
		income: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
		expense: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
		transfer: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
	};

	function amountClass(type: Transaction['type']): string {
		if (type === 'income') return 'text-emerald-600 dark:text-emerald-400';
		if (type === 'expense') return 'text-red-600 dark:text-red-400';
		return 'text-slate-700 dark:text-slate-300';
	}

	function signedAmount(tx: Transaction): string {
		const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : '';
		return `${sign}${tx.amount}`;
	}

	function accountsLabel(tx: Transaction): string {
		const src = tx.source_account?.name;
		const dst = tx.destination_account?.name;
		if (tx.type === 'transfer') return `${src} → ${dst}`;
		if (tx.type === 'income') return dst ?? '';
		return src ?? '';
	}

	function categoryLabel(tx: Transaction): string {
		if (!tx.subcategory) return '—';
		return `${tx.subcategory.category.name} · ${tx.subcategory.name}`;
	}
</script>

<svelte:head><title>Transactions</title></svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-slate-50 p-4 dark:bg-slate-950">
	<div class="mx-auto max-w-4xl">
		<div class="mb-4 flex flex-wrap items-center gap-3">
			<h1 class="mr-auto text-xl font-semibold text-slate-900 dark:text-slate-100">Transactions</h1>

			<div class="inline-flex overflow-hidden rounded-md ring-1 ring-slate-300 dark:ring-slate-700">
				<button
					type="button"
					onclick={() => setMode('all')}
					class="px-3 py-1.5 text-sm font-medium {toggleClass(mode === 'all')}"
				>
					All
				</button>
				<button
					type="button"
					onclick={() => setMode('month')}
					class="px-3 py-1.5 text-sm font-medium {toggleClass(mode === 'month')}"
				>
					Month
				</button>
				<button
					type="button"
					onclick={() => setMode('year')}
					class="px-3 py-1.5 text-sm font-medium {toggleClass(mode === 'year')}"
				>
					Year
				</button>
			</div>

			{#if mode === 'month'}
				<div class="inline-flex items-center gap-1">
					<button
						type="button"
						aria-label="Previous month"
						onclick={() => setMonth(shiftMonth(month, -1))}
						class="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
					>
						‹
					</button>
					<input
						type="month"
						aria-label="Month"
						value={month}
						onchange={(e) => setMonth(e.currentTarget.value)}
						class="rounded-md border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
					/>
					<button
						type="button"
						aria-label="Next month"
						onclick={() => setMonth(shiftMonth(month, 1))}
						class="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
					>
						›
					</button>
				</div>
			{:else if mode === 'year'}
				<div class="inline-flex items-center gap-1">
					<button
						type="button"
						aria-label="Previous year"
						onclick={() => setYear(shiftYear(year, -1))}
						class="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
					>
						‹
					</button>
					<input
						type="number"
						aria-label="Year"
						value={year}
						onchange={(e) => setYear(e.currentTarget.value)}
						class="w-20 rounded-md border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
					/>
					<button
						type="button"
						aria-label="Next year"
						onclick={() => setYear(shiftYear(year, 1))}
						class="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
					>
						›
					</button>
				</div>
			{/if}
		</div>

		<div
			class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
		>
			{#if loading}
				<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
			{:else if error}
				<p class="p-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
			{:else if transactions.length === 0}
				<p class="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
					{mode === 'month'
						? 'No transactions this month.'
						: mode === 'year'
							? 'No transactions this year.'
							: 'No transactions yet.'}
				</p>
			{:else}
				<div class="max-h-[calc(100vh-13rem)] scrollbar-thin overflow-y-auto">
					<table class="w-full text-left text-sm">
						<thead
							class="sticky top-0 border-b border-slate-200 bg-white text-xs tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
						>
							<tr>
								<th class="px-4 py-3 font-medium">Date</th>
								<th class="px-4 py-3 font-medium">Type</th>
								<th class="px-4 py-3 font-medium">Category</th>
								<th class="px-4 py-3 font-medium">Account</th>
								<th class="px-4 py-3 text-right font-medium">Amount</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
							{#each transactions as tx (tx.id)}
								<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
									<td class="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300"
										>{tx.tx_date}</td
									>
									<td class="px-4 py-3">
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {badgeClass[tx.type]}"
										>
											{tx.type}
										</span>
									</td>
									<td class="px-4 py-3 text-slate-700 dark:text-slate-300">
										{categoryLabel(tx)}
										{#if tx.comment}
											<span class="block text-xs text-slate-400 dark:text-slate-500"
												>{tx.comment}</span
											>
										{/if}
									</td>
									<td class="px-4 py-3 text-slate-600 dark:text-slate-300">{accountsLabel(tx)}</td>
									<td
										class="px-4 py-3 text-right font-medium whitespace-nowrap {amountClass(
											tx.type
										)}"
									>
										{signedAmount(tx)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		{#if !loading && !error && count > 0}
			<div
				class="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400"
			>
				<span>{count} transaction{count === 1 ? '' : 's'}</span>
				<div class="inline-flex items-center gap-3">
					<button
						type="button"
						aria-label="Previous page"
						onclick={prevPage}
						disabled={pageNum <= 1}
						class="rounded-md px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:ring-slate-700 dark:hover:bg-slate-800"
					>
						‹ Prev
					</button>
					<span>Page {pageNum} of {totalPages}</span>
					<button
						type="button"
						aria-label="Next page"
						onclick={nextPage}
						disabled={pageNum >= totalPages}
						class="rounded-md px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:ring-slate-700 dark:hover:bg-slate-800"
					>
						Next ›
					</button>
				</div>
			</div>
		{/if}
	</div>
</main>
