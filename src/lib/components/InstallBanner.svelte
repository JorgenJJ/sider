<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { triggerInstallPrompt } from '$lib/stores/installPrompt';

	const DISMISSED_KEY = 'pwa-banner-dismissed';

	let show = $state(false);
	let isIOS = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let deferredPrompt = $state<any>(null);

	function isInAppBrowser(): boolean {
		const ua = navigator.userAgent;
		return (
			/FBAN|FBAV|Instagram|Snapchat|Line|WeChat|Twitter|TikTok/.test(ua) ||
			(/Android/.test(ua) && /wv/.test(ua)) ||
			(/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua) && !/CriOS|FxiOS/.test(ua))
		);
	}

	function dismiss() {
		show = false;
		try {
			localStorage.setItem(DISMISSED_KEY, 'true');
		} catch {
			// ignore
		}
	}

	async function install() {
		if (!isIOS && deferredPrompt) {
			deferredPrompt.prompt();
			await deferredPrompt.userChoice;
			deferredPrompt = null;
			dismiss();
			return;
		}
		// iOS Safari has no programmatic install; delegate to the bottom-sheet
		// flow in InstallPrompt.svelte, which renders the Share-button steps.
		triggerInstallPrompt.set(true);
	}

	onMount(() => {
		if (typeof window === 'undefined') return;

		const standalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		if (standalone) return;

		try {
			if (localStorage.getItem(DISMISSED_KEY) === 'true') return;
		} catch {
			// ignore
		}

		if (isInAppBrowser()) return; // in-app browsers can't install; show that banner instead

		const ua = navigator.userAgent;
		isIOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
		if (isIOS) show = true;

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			show = true;
		});
	});
</script>

{#if show}
	<div class="install-banner" role="region" aria-label={$t('install.banner.title')}>
		<svg
			class="install-banner-icon"
			viewBox="0 0 512 512"
			aria-hidden="true"
			width="32"
			height="32"
		>
			<rect width="512" height="512" rx="96" fill="#3D6B4F" />
			<circle cx="216" cy="320" r="120" fill="#F7F4EF" />
			<circle cx="296" cy="320" r="120" fill="#F7F4EF" />
			<path
				d="M252 198 C249 168 240 152 262 132 C273 138 270 165 268 198 Z"
				fill="#B87333"
			/>
			<path d="M268 158 C300 130 360 130 372 162 C346 192 296 196 268 158 Z" fill="#B87333" />
		</svg>
		<div class="install-banner-copy">
			<strong>{$t('install.banner.title')}</strong>
			<span>{$t('install.banner.subtitle')}</span>
		</div>
		<button class="install-banner-cta" onclick={install}>{$t('install.cta')}</button>
		<button
			class="install-banner-close"
			onclick={dismiss}
			aria-label={$t('install.dismiss')}>×</button
		>
	</div>
{/if}

<style>
	.install-banner {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 10px var(--page-padding);
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.install-banner-icon {
		flex-shrink: 0;
		border-radius: 8px;
	}

	.install-banner-copy {
		flex: 1;
		display: flex;
		flex-direction: column;
		line-height: 1.25;
		min-width: 0;
	}

	.install-banner-copy strong {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.install-banner-copy span {
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.install-banner-cta {
		background: var(--color-primary);
		color: var(--color-primary-text);
		border: none;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 8px 14px;
		border-radius: var(--radius-full);
		cursor: pointer;
		flex-shrink: 0;
		-webkit-tap-highlight-color: transparent;
	}

	.install-banner-cta:hover {
		background: var(--color-primary-hover);
	}

	.install-banner-close {
		background: none;
		border: none;
		color: var(--color-text-muted);
		font-size: 1.4rem;
		line-height: 1;
		padding: 4px 6px;
		cursor: pointer;
		flex-shrink: 0;
		-webkit-tap-highlight-color: transparent;
	}
</style>
