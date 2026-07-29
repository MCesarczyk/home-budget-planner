<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open,
		title,
		onclose,
		children
	}: {
		open: boolean;
		title: string;
		onclose: () => void;
		children: Snippet;
	} = $props();

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={open ? onKeydown : undefined} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-4">
		<button
			type="button"
			aria-label="Close"
			onclick={onclose}
			class="absolute inset-0 cursor-default bg-black/50"
		></button>

		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class="relative z-10 flex h-full w-full flex-col bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-xl dark:bg-slate-900"
		>
			<div
				class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
			>
				<h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
				<button
					type="button"
					aria-label="Close dialog"
					onclick={onclose}
					class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
				>
					✕
				</button>
			</div>
			<div class="flex-1 scrollbar-thin overflow-y-auto p-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
