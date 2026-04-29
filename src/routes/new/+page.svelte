<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { saveCider, countCiders } from '$lib/db/ciders';
	import { triggerInstallPrompt } from '$lib/stores/installPrompt';
	import NoteField from '$lib/components/NoteField.svelte';
	import type { CiderNotes } from '$lib/db/schema';

	const STYLES = [
		'style.dry',
		'style.semidry',
		'style.semisweet',
		'style.sweet',
		'style.rose',
		'style.sparkling',
		'style.still',
		'style.ice',
		'style.pear'
	];

	let name = $state('');
	let producer = $state('');
	let style = $state('');
	let vintage = $state('');
	let abv = $state('');
	let notes = $state<CiderNotes>({});
	let saving = $state(false);
	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = 'Navn er obligatorisk';
		if (!producer.trim()) e.producer = 'Produsent er obligatorisk';
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
				style: style || undefined,
				vintage: vintage ? parseInt(vintage) : undefined,
				abv: abv ? parseFloat(abv) : undefined,
				dateLogged: new Date().toISOString(),
				notes
			});

			if (isFirst) {
				triggerInstallPrompt.set(true);
			}

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
		<button class="back-btn" onclick={() => goto('/')} aria-label={$t('action.back')}>
			‹
		</button>
		<h1>{$t('new.title')}</h1>
		<div class="header-spacer"></div>
	</header>

	<form class="page-content" onsubmit={handleSubmit} novalidate>
		<!-- Required fields -->
		<section class="form-section">
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
				{#if errors.name}<span class="field-error">{errors.name}</span>{/if}
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
				{#if errors.producer}<span class="field-error">{errors.producer}</span>{/if}
			</div>
		</section>

		<div class="divider"></div>

		<!-- Optional metadata -->
		<section class="form-section">
			<p class="section-label">{$t('new.metadata.section')} <span class="label-optional">(valgfritt)</span></p>

			<div class="form-group">
				<label for="style">{$t('cider.style')}</label>
				<select id="style" bind:value={style}>
					<option value="">{$t('cider.style.placeholder')}</option>
					{#each STYLES as key}
						<option value={$t(key)}>{$t(key)}</option>
					{/each}
				</select>
			</div>

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
		</section>

		<div class="divider"></div>

		<!-- Tasting notes -->
		<section class="form-section">
			<p class="section-label">{$t('cider.notes')} <span class="label-optional">(valgfritt)</span></p>

			{#each ['utseende', 'aroma', 'smak', 'munnfølelse', 'generelt'] as cat}
				<NoteField
					category={cat as keyof CiderNotes}
					label={$t(`notes.${cat}`)}
					hint={$t(`hint.${cat}`)}
					bind:value={notes[cat as keyof CiderNotes]}
				/>
			{/each}
		</section>

		<div class="form-actions">
			<button type="submit" class="btn btn-primary btn-full" disabled={saving}>
				{saving ? $t('action.saving') : $t('action.save')}
			</button>
			<button type="button" class="btn btn-ghost btn-full" onclick={() => goto('/')}>
				{$t('action.cancel')}
			</button>
		</div>
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
		padding: var(--spacing-sm) var(--page-padding);
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		z-index: 10;
	}

	.back-btn {
		background: none;
		border: none;
		font-size: 1.8rem;
		color: var(--color-primary);
		cursor: pointer;
		padding: 0 var(--spacing-sm) 0 0;
		line-height: 1;
		-webkit-tap-highlight-color: transparent;
	}

	.header-spacer {
		width: 32px;
	}

	.page-content {
		flex: 1;
		padding: var(--spacing-lg) var(--page-padding);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.section-label {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
	}

	.divider {
		height: 1px;
		background: var(--color-border);
	}

	input.error {
		border-color: var(--color-danger);
	}

	.field-error {
		font-size: 0.8rem;
		color: var(--color-danger);
	}

	.form-actions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding-bottom: var(--spacing-lg);
	}
</style>
