<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { goto } from '$app/navigation';
	import { t, translate } from '$lib/i18n';
	import { getAllCiders, getProducers } from '$lib/db/ciders';
	import type { Cider } from '$lib/db/schema';

	let ciders = $state<Cider[]>([]);
	let producers = $state<string[]>([]);
	let selectedProducer = $state('');
	let loading = $state(true);

	async function load() {
		loading = true;
		[ciders, producers] = await Promise.all([getAllCiders(), getProducers()]);
		loading = false;
	}

	onMount(load);
	afterNavigate(load);

	let filtered = $derived(
		selectedProducer ? ciders.filter((c) => c.producer === selectedProducer) : ciders
	);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('nb-NO', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function cardMeta(c: Cider): string {
		const parts: string[] = [];
		if (c.sweetness) parts.push(translate(`sweetness.${c.sweetness}`));
		if (c.carbonation) parts.push(translate(`carbonation.${c.carbonation}`));
		if (c.type && c.type !== 'apple') parts.push(translate(`type.${c.type}`));
		if (c.vintage) parts.push(String(c.vintage));
		if (parts.length === 0 && c.style) parts.push(c.style);
		return parts.join(' · ');
	}

	function notePreview(c: Cider): string {
		const chips: string[] = [];
		if (c.aroma?.length) chips.push(...c.aroma.map((k) => translate(`aroma.${k}`)));
		if (c.structure?.length) chips.push(...c.structure.map((k) => translate(`structure.${k}`)));
		else if (c.flavor?.length) chips.push(...c.flavor.map((k) => translate(`flavor.${k}`)));
		const text = c.comment ?? c.notes?.aroma ?? c.notes?.smak ?? c.notes?.generelt ?? '';
		const joined = [chips.join(', '), text].filter(Boolean).join(' · ');
		return joined.length > 80 ? joined.slice(0, 77) + '…' : joined;
	}
</script>

<svelte:head>
	<title>{$t('app.name')}</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<h1>{$t('overview.title')}</h1>
		{#if producers.length > 0}
			<select
				bind:value={selectedProducer}
				aria-label={$t('overview.filter.label')}
				class="producer-filter"
			>
				<option value="">{$t('overview.filter.all')}</option>
				{#each producers as p}
					<option value={p}>{p}</option>
				{/each}
			</select>
		{/if}
	</header>

	<div class="page-content">
		{#if loading}
			<div class="loading-state"></div>
		{:else if filtered.length === 0 && ciders.length === 0}
			<div class="empty-state">
				<div class="empty-icon" aria-hidden="true">🍎</div>
				<h2>{$t('overview.empty.title')}</h2>
				<p>{$t('overview.empty.description')}</p>
			</div>
		{:else if filtered.length === 0}
			<p class="no-results">{selectedProducer} — ingen treff</p>
		{:else}
			<ul class="cider-list">
				{#each filtered as cider (cider.id)}
					<li>
						<button class="cider-card card" onclick={() => goto(`/cider/${cider.id}`)}>
							<div class="card-main">
								<div class="card-info">
									<span class="cider-name">{cider.name}</span>
									<span class="cider-producer">{cider.producer}</span>
									{#if cardMeta(cider)}
										<span class="cider-meta">{cardMeta(cider)}</span>
									{/if}
								</div>
								<span class="cider-date">{formatDate(cider.dateLogged)}</span>
							</div>
							{#if notePreview(cider)}
								<p class="card-preview">{notePreview(cider)}</p>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}

	.page-header {
		position: sticky;
		top: 0;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
		padding: var(--spacing-md) var(--page-padding) var(--spacing-sm);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		z-index: 10;
	}

	.producer-filter {
		width: auto;
		max-width: 180px;
		padding: 8px 36px 8px 12px;
		font-size: 0.875rem;
		height: auto;
	}

	.page-content {
		flex: 1;
		padding: var(--page-padding);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
	}

	.loading-state {
		height: 200px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		padding: var(--spacing-xl) var(--page-padding);
		text-align: center;
		color: var(--color-text-muted);
		min-height: 60vh;
	}

	.empty-icon {
		font-size: 4rem;
		line-height: 1;
	}

	.empty-state h2 {
		color: var(--color-text);
	}

	.no-results {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-xl) 0;
	}

	.cider-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.cider-card {
		display: block;
		width: 100%;
		padding: var(--spacing-md);
		text-align: left;
		cursor: pointer;
		background: var(--color-surface);
		border: none;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		transition:
			transform 0.1s,
			box-shadow 0.1s;
		-webkit-tap-highlight-color: transparent;
	}

	.cider-card:active {
		transform: scale(0.98);
		box-shadow: none;
	}

	.card-main {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-sm);
	}

	.card-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.cider-name {
		font-weight: 600;
		font-size: 1rem;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cider-producer {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.cider-meta {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.cider-date {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.card-preview {
		margin-top: var(--spacing-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
