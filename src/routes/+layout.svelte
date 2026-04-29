<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { initLocale, t } from '$lib/i18n';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import InAppBrowserBanner from '$lib/components/InAppBrowserBanner.svelte';

	let { children } = $props();

	onMount(() => {
		initLocale();
	});

	const navItems = [
		{ path: '/', icon: '🍺', labelKey: 'nav.overview' },
		{ path: '/new', icon: '+', labelKey: 'nav.new', isAction: true },
		{ path: '/settings', icon: '⚙', labelKey: 'nav.settings' }
	];

	function isActive(path: string) {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	}
</script>

<div class="app-shell">
	<InAppBrowserBanner />

	<main class="app-main">
		{@render children()}
	</main>

	<nav class="bottom-nav" aria-label={$t('nav.overview')}>
		{#each navItems as item}
			<button
				class="nav-item"
				class:active={isActive(item.path)}
				class:action={item.isAction}
				onclick={() => goto(item.path)}
				aria-current={isActive(item.path) ? 'page' : undefined}
				aria-label={$t(item.labelKey)}
			>
				<span class="nav-icon" aria-hidden="true">{item.icon}</span>
				<span class="nav-label">{$t(item.labelKey)}</span>
			</button>
		{/each}
	</nav>
</div>

<InstallPrompt />

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		height: 100dvh;
	}

	.app-main {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.bottom-nav {
		display: flex;
		align-items: stretch;
		height: calc(var(--nav-height) + var(--safe-bottom));
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
		padding-bottom: var(--safe-bottom);
		flex-shrink: 0;
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		-webkit-tap-highlight-color: transparent;
		transition: color 0.15s;
		padding: 0;
	}

	.nav-item.active {
		color: var(--color-primary);
	}

	.nav-icon {
		font-size: 1.4rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 32px;
	}

	.nav-item.action .nav-icon {
		width: 44px;
		height: 44px;
		background: var(--color-primary);
		color: #fff;
		border-radius: var(--radius-full);
		font-size: 1.6rem;
		margin-top: -8px;
		box-shadow: 0 2px 8px rgba(61, 107, 79, 0.4);
		transition: background 0.15s;
	}

	.nav-item.action:hover .nav-icon,
	.nav-item.action:focus .nav-icon {
		background: var(--color-primary-hover);
	}

	.nav-label {
		font-size: 0.7rem;
		font-weight: 500;
	}

	.nav-item.action .nav-label {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}
</style>
