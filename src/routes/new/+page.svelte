<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { saveCider, countCiders } from '$lib/db/ciders';
	import { triggerInstallPrompt } from '$lib/stores/installPrompt';
	import ChipGroup from '$lib/components/ChipGroup.svelte';
	import {
		SWEETNESS_KEYS,
		CARBONATION_KEYS,
		TYPE_KEYS,
		APPEARANCE_KEYS,
		AROMA_KEYS,
		FLAVOR_KEYS,
		type SweetnessKey,
		type CarbonationKey,
		type CiderTypeKey,
		type AppearanceKey,
		type AromaKey,
		type FlavorKey
	} from '$lib/db/schema';

	let name = $state('');
	let producer = $state('');
	let sweetness = $state<SweetnessKey | undefined>(undefined);
	let carbonation = $state<CarbonationKey | undefined>(undefined);
	let type = $state<CiderTypeKey | undefined>('apple');
	let appearance = $state<AppearanceKey[]>([]);
	let aroma = $state<AromaKey[]>([]);
	let flavor = $state<FlavorKey[]>([]);
	let vintage = $state('');
	let abv = $state('');
	let comment = $state('');
	let showMore = $state(false);
	let saving = $state(false);
	let errors = $state<Record<string, string>>({});

	let sweetnessOptions = $derived(SWEETNESS_KEYS.map((k) => ({ key: k, label: $t(`sweetness.${k}`) })));
	let carbonationOptions = $derived(
		CARBONATION_KEYS.map((k) => ({ key: k, label: $t(`carbonation.${k}`) }))
	);
	let typeOptions = $derived(TYPE_KEYS.map((k) => ({ key: k, label: $t(`type.${k}`) })));
	let appearanceOptions = $derived(
		APPEARANCE_KEYS.map((k) => ({ key: k, label: $t(`appearance.${k}`) }))
	);
	let aromaOptions = $derived(AROMA_KEYS.map((k) => ({ key: k, label: $t(`aroma.${k}`) })));
	let flavorOptions = $derived(FLAVOR_KEYS.map((k) => ({ key: k, label: $t(`flavor.${k}`) })));

	function validate(): boolean {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = $t('validation.name.required');
		if (!producer.trim()) e.producer = $t('validation.producer.required');
		errors = e;
		return Object.keys(e).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;
		saving = true;
		try {
			const isFirst = (await countCiders()) === 0;
			await saveCider({
				id: crypto.randomUUID(),
				name: name.trim(),
				producer: producer.trim(),
				dateLogged: new Date().toISOString(),
				sweetness,
				carbonation,
				type,
				appearance: appearance.length ? $state.snapshot(appearance) : undefined,
				aroma: aroma.length ? $state.snapshot(aroma) : undefined,
				flavor: flavor.length ? $state.snapshot(flavor) : undefined,
				vintage: vintage ? parseInt(vintage) : undefined,
				abv: abv ? parseFloat(abv) : undefined,
				comment: comment.trim() || undefined
			});
			if (isFirst) triggerInstallPrompt.set(true);
			await goto('/');
		} catch (err) {
			console.error('Save failed:', err);
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('new.title')} — {$t('app.name')}</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<button class="back-btn" onclick={() => goto('/')} aria-label={$t('action.back')}>‹</button>
		<h1>{$t('new.title')}</h1>
		<div class="header-spacer"></div>
	</header>

	<form class="page-content" onsubmit={handleSubmit} novalidate>
		<div class="form-group">
			<label for="name">{$t('cider.name')}</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				placeholder={$t('cider.name.placeholder')}
				autocomplete="off"
				class:error={errors.name}
			/>
		</div>
		<div class="form-group">
			<label for="producer">{$t('cider.producer')}</label>
			<input
				id="producer"
				type="text"
				bind:value={producer}
				placeholder={$t('cider.producer.placeholder')}
				autocomplete="off"
				class:error={errors.producer}
			/>
		</div>
		{#if errors.name || errors.producer}
			<span class="field-error">{errors.name || errors.producer}</span>
		{/if}

		<div class="chip-row">
			<ChipGroup label={$t('cider.sweetness')} options={sweetnessOptions} bind:value={sweetness} />
			<ChipGroup
				label={$t('cider.carbonation')}
				options={carbonationOptions}
				bind:value={carbonation}
			/>
		</div>

		<ChipGroup
			label={$t('cider.appearance')}
			options={appearanceOptions}
			bind:value={appearance}
			multi
		/>
		<ChipGroup label={$t('cider.aroma')} options={aromaOptions} bind:value={aroma} multi />
		<ChipGroup label={$t('cider.flavor')} options={flavorOptions} bind:value={flavor} multi />

		<button
			type="button"
			class="more-toggle"
			aria-expanded={showMore}
			onclick={() => (showMore = !showMore)}
		>
			<span class="caret" class:open={showMore}>▸</span>
			{$t('action.more')}
		</button>

		{#if showMore}
			<div class="more-panel">
				<ChipGroup label={$t('cider.type')} options={typeOptions} bind:value={type} />
				<div class="form-row">
					<div class="form-group">
						<label for="vintage">{$t('cider.vintage')}</label>
						<input
							id="vintage"
							type="number"
							bind:value={vintage}
							placeholder={$t('cider.vintage.placeholder')}
							min="1900"
							max={new Date().getFullYear() + 1}
						/>
					</div>
					<div class="form-group">
						<label for="abv">{$t('cider.abv')}</label>
						<input
							id="abv"
							type="number"
							bind:value={abv}
							placeholder={$t('cider.abv.placeholder')}
							min="0"
							max="100"
							step="0.1"
						/>
					</div>
				</div>
				<div class="form-group">
					<label for="comment">{$t('cider.comment')}</label>
					<textarea
						id="comment"
						rows="3"
						bind:value={comment}
						placeholder={$t('cider.comment.placeholder')}
					></textarea>
				</div>
			</div>
		{/if}

		<button type="submit" class="btn btn-primary btn-full save-btn" disabled={saving}>
			{saving ? $t('action.saving') : $t('action.save')}
		</button>
	</form>
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
		padding: 6px var(--page-padding);
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		z-index: 10;
	}

	.page-header h1 {
		font-size: 1.1rem;
	}

	.back-btn {
		background: none;
		border: none;
		font-size: 1.6rem;
		color: var(--color-primary);
		cursor: pointer;
		padding: 0;
		line-height: 1;
		-webkit-tap-highlight-color: transparent;
	}

	.header-spacer {
		width: 24px;
	}

	.page-content {
		flex: 1;
		padding: 10px var(--page-padding) 12px;
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.form-group label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.form-group input,
	.form-group textarea {
		padding: 8px 12px;
	}

	.chip-row {
		display: grid;
		grid-template-columns: 1.6fr 1fr;
		gap: 10px;
	}

	.chip-row > :global(.chip-group) {
		min-width: 0;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
	}

	input.error {
		border-color: var(--color-danger);
	}

	.field-error {
		font-size: 0.78rem;
		color: var(--color-danger);
		margin-top: -4px;
	}

	.more-toggle {
		align-self: flex-start;
		background: none;
		border: none;
		color: var(--color-primary);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		padding: 2px 0;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		-webkit-tap-highlight-color: transparent;
	}

	.caret {
		display: inline-block;
		transition: transform 0.15s;
	}

	.caret.open {
		transform: rotate(90deg);
	}

	.more-panel {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.save-btn {
		margin-top: 4px;
		height: 44px;
	}
</style>
