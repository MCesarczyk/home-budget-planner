<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/auth/auth.store.svelte';
	import { theme } from '$lib/theme/theme.store.svelte';
	import ThemeToggle from '$lib/theme/ThemeToggle.svelte';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();

	onMount(() => {
		theme.init();
		auth.refresh();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="fixed top-4 right-4 z-50">
	<ThemeToggle />
</div>
{#if auth.isAuthenticated}
	<Nav />
{/if}
{@render children()}
