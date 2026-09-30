<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Elevate 215 School Data</title>
</svelte:head>

<header>
	<a href="/">Elevate 215 — School Data</a>
</header>
<main>
	{@render children()}
</main>

<style>
	:global(:root) {
		--brand: #0e2a68;
		--bg: #f3f3f1;
		--surface: #fcfcfb;
		--border: #dcdbd6;
		--text: #0b0b0b;
		--text2: #52514e;
		--missing: #fff5de;
		--outdated: #efefec;
		--problem: #fbeaea;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--bg: #111110;
			--surface: #1a1a19;
			--border: #3a3a37;
			--text: #ffffff;
			--text2: #c3c2b7;
			--missing: #362b10;
			--outdated: #242422;
			--problem: #3a1818;
		}
	}
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		font: 15px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif;
		background: var(--bg);
		color: var(--text);
	}
	:global(a) {
		color: inherit;
	}
	header {
		background: var(--brand);
		padding: 14px 24px;
	}
	header a {
		color: #fff;
		font-weight: 600;
		font-size: 18px;
		text-decoration: none;
	}
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 20px 24px 48px;
	}
	@media (max-width: 700px) {
		header,
		main {
			padding-left: 16px;
			padding-right: 16px;
		}
	}
</style>
