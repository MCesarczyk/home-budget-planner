<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/auth/auth.store.svelte';

	let { children } = $props();

	onMount(() => {
		auth.refresh();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
