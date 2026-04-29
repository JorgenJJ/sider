<script lang="ts">
	import { onMount } from 'svelte';
	import { triggerInstallPrompt } from '$lib/stores/installPrompt';
	import { t } from '$lib/i18n';

	const DISMISSED_KEY = 'pwa-install-dismissed';

	type Platform = 'chromium' | 'ios' | 'unsupported';

	let platform = $state<Platform>('unsupported');
	let show = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let deferredPrompt = $state<any>(null);

	function detectPlatform(): Platform {
		if (typeof navigator === 'undefined') return 'unsupported';
		const ua = navigator.userAgent;
		const isIOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
		// navigator.standalone is true when already installed on iOS
		if (isIOS && !(navigator as Navigator & { standalone?: boolean }).standalone) return 'ios';
		return 'unsupported'; // will be upgraded to 'chromium' when beforeinstallprompt fires
	}

	function isDismissed(): boolean {
		try {
			return localStorage.getItem(DISMISSED_KEY) === 'true';
		} catch {
			return false;
		}
	}

	function isStandalone(): boolean {
		return window.matchMedia('(display-mode: standalone)').matches;
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
		if (platform === 'chromium' && deferredPrompt) {
			deferredPrompt.prompt();
			await deferredPrompt.userChoice;
			deferredPrompt = null;
		}
		dismiss();
	}

	onMount(() => {
		if (isStandalone() || isDismissed()) return;

		platform = detectPlatform();

		// Capture the Chromium install prompt
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			platform = 'chromium';
		});

		// Listen for trigger signal (fires after first cider is saved)
		const unsub = triggerInstallPrompt.subscribe((triggered) => {
			if (triggered && !isDismissed() && !isStandalone()) {
				if (platform === 'chromium' || platform === 'ios') {
					show = true;
				}
			}
		});

		return unsub;
	});
</script>

{#if show}
	<!-- Backdrop -->
	<div class="backdrop" onclick={dismiss} role="presentation"></div>

	<!-- Bottom sheet -->
	<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="install-title">
		<div class="sheet-handle"></div>

		<div class="sheet-icon">🍎</div>
		<h2 id="install-title">{$t('install.title')}</h2>
		<p class="sheet-desc">{$t('install.description')}</p>

		{#if platform === 'ios'}
			<p class="ios-instruction">{$t('install.ios.instruction')}</p>
			<button class="btn btn-primary btn-full" onclick={dismiss}>
				{$t('install.ios.dismiss')}
			</button>
		{:else}
			<button class="btn btn-primary btn-full" onclick={install}>
				{$t('install.cta')}
			</button>
			<button class="btn btn-ghost btn-full" onclick={dismiss}>
				{$t('install.dismiss')}
			</button>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 99;
		animation: fade-in 0.2s ease;
	}

	.sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-surface);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: var(--spacing-md) var(--spacing-lg) calc(var(--spacing-lg) + var(--safe-bottom));
		box-shadow: var(--shadow-sheet);
		z-index: 100;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		text-align: center;
		max-width: var(--max-width);
		margin: 0 auto;
		animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
	}

	.sheet-handle {
		width: 40px;
		height: 4px;
		background: var(--color-border);
		border-radius: var(--radius-full);
		margin-bottom: var(--spacing-sm);
	}

	.sheet-icon {
		font-size: 3rem;
		line-height: 1;
	}

	.sheet h2 {
		font-size: 1.2rem;
	}

	.sheet-desc {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		max-width: 280px;
	}

	.ios-instruction {
		background: var(--color-surface-alt);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		font-size: 0.95rem;
		line-height: 1.6;
		text-align: left;
		width: 100%;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
