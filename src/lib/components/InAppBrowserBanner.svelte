<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	const DISMISSED_KEY = 'inapp-banner-dismissed';

	let show = $state(false);
	let pageUrl = $state('');

	function isInAppBrowser(): boolean {
		if (typeof navigator === 'undefined') return false;
		const ua = navigator.userAgent;
		return (
			/FBAN|FBAV|Instagram|Snapchat|Line|WeChat|Twitter|TikTok/.test(ua) ||
			// Android WebView heuristic
			(/Android/.test(ua) && /wv/.test(ua)) ||
			// iOS in-app: WebKit without Safari in UA
			(/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua) && !/CriOS|FxiOS/.test(ua))
		);
	}

	function dismiss() {
		show = false;
		try {
			sessionStorage.setItem(DISMISSED_KEY, 'true');
		} catch {
			// ignore
		}
	}

	onMount(() => {
		try {
			if (sessionStorage.getItem(DISMISSED_KEY)) return;
		} catch {
			// ignore
		}
		if (isInAppBrowser()) {
			pageUrl = window.location.href;
			show = true;
		}
	});
</script>

{#if show}
	<div class="banner" role="alert">
		<span class="banner-text">{$t('inapp.banner')}</span>
		<div class="banner-actions">
			{#if pageUrl}
				<a href={pageUrl} target="_blank" rel="noopener noreferrer" class="banner-link">
					{$t('inapp.open')}
				</a>
			{/if}
			<button class="banner-dismiss" onclick={dismiss} aria-label={$t('action.close')}>
				✕
			</button>
		</div>
	</div>
{/if}

<style>
	.banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 200;
		background: #b45309;
		color: #fff;
		padding: calc(var(--safe-top) + 10px) var(--page-padding) 10px;
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-md);
		font-size: 0.875rem;
		line-height: 1.4;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.banner-text {
		flex: 1;
	}

	.banner-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.banner-link {
		color: #fff;
		font-weight: 600;
		text-decoration: underline;
		white-space: nowrap;
	}

	.banner-dismiss {
		background: none;
		border: none;
		color: #fff;
		font-size: 1rem;
		cursor: pointer;
		padding: 4px;
		line-height: 1;
		-webkit-tap-highlight-color: transparent;
	}
</style>
