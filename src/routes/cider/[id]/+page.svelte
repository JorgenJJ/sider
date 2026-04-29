<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { getCiderById, saveCider, deleteCider } from '$lib/db/ciders';
	import NoteField from '$lib/components/NoteField.svelte';
	import type { Cider, CiderNotes } from '$lib/db/schema';

	let { data } = $props<{ data: { id: string } }>();

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

	let cider = $state<Cider | null>(null);
	let editing = $state(false);
	let saving = $state(false);
	let confirmDelete = $state(false);
	let notFound = $state(false);

	// Editable copies
	let editName = $state('');
	let editProducer = $state('');
	let editStyle = $state('');
	let editVintage = $state('');
	let editAbv = $state('');
	let editNotes = $state<CiderNotes>({});

	onMount(async () => {
		const found = await getCiderById(data.id);
		if (!found) {
			notFound = true;
			return;
		}
		cider = found;
		resetEditable();
	});

	function resetEditable() {
		if (!cider) return;
		editName = cider.name;
		editProducer = cider.producer;
		editStyle = cider.style ?? '';
		editVintage = cider.vintage ? String(cider.vintage) : '';
		editAbv = cider.abv ? String(cider.abv) : '';
		editNotes = { ...cider.notes };
	}

	function startEdit() {
		resetEditable();
		editing = true;
	}

	function cancelEdit() {
		editing = false;
	}

	async function saveEdit() {
		if (!cider) return;
		saving = true;
		const updated: Cider = {
			...cider,
			name: editName.trim() || cider.name,
			producer: editProducer.trim() || cider.producer,
			style: editStyle || undefined,
			vintage: editVintage ? parseInt(editVintage) : undefined,
			abv: editAbv ? parseFloat(editAbv) : undefined,
			notes: editNotes
		};
		await saveCider(updated);
		cider = updated;
		editing = false;
		saving = false;
	}

	async function handleDelete() {
		if (!cider) return;
		await deleteCider(cider.id);
		goto('/');
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('nb-NO', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	const NOTE_CATEGORIES: Array<keyof CiderNotes> = [
		'utseende',
		'aroma',
		'smak',
		'munnfølelse',
		'generelt'
	];
</script>

<svelte:head>
	<title>{cider?.name ?? $t('detail.title')} — {$t('app.name')}</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<button class="back-btn" onclick={() => goto('/')} aria-label={$t('action.back')}>‹</button>
		<h1 class="header-title">{cider?.name ?? $t('detail.title')}</h1>
		{#if cider && !editing}
			<button class="edit-btn" onclick={startEdit} aria-label={$t('action.edit')}>
				{$t('action.edit')}
			</button>
		{:else}
			<div class="header-spacer"></div>
		{/if}
	</header>

	<div class="page-content">
		{#if notFound}
			<p class="not-found">Sideringen ble ikke funnet.</p>
		{:else if !cider}
			<div class="loading-state"></div>
		{:else if editing}
			<!-- Edit mode -->
			<form onsubmit={(e) => { e.preventDefault(); saveEdit(); }}>
				<section class="form-section">
					<div class="form-group">
						<label for="edit-name">{$t('cider.name')}</label>
						<input id="edit-name" type="text" bind:value={editName} />
					</div>
					<div class="form-group">
						<label for="edit-producer">{$t('cider.producer')}</label>
						<input id="edit-producer" type="text" bind:value={editProducer} />
					</div>
					<div class="form-group">
						<label for="edit-style">{$t('cider.style')}</label>
						<select id="edit-style" bind:value={editStyle}>
							<option value="">{$t('cider.style.placeholder')}</option>
							{#each STYLES as key}
								<option value={$t(key)}>{$t(key)}</option>
							{/each}
						</select>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label for="edit-vintage">{$t('cider.vintage')}</label>
							<input id="edit-vintage" type="number" bind:value={editVintage} />
						</div>
						<div class="form-group">
							<label for="edit-abv">{$t('cider.abv')}</label>
							<input id="edit-abv" type="number" step="0.1" bind:value={editAbv} />
						</div>
					</div>
				</section>

				<div class="divider"></div>

				<section class="form-section">
					{#each NOTE_CATEGORIES as cat}
						<NoteField
							category={cat}
							label={$t(`notes.${cat}`)}
							hint={$t(`hint.${cat}`)}
							bind:value={editNotes[cat]}
						/>
					{/each}
				</section>

				<div class="form-actions">
					<button type="submit" class="btn btn-primary btn-full" disabled={saving}>
						{saving ? $t('action.saving') : $t('action.done')}
					</button>
					<button type="button" class="btn btn-ghost btn-full" onclick={cancelEdit}>
						{$t('action.cancel')}
					</button>
					<button type="button" class="btn btn-danger btn-full" onclick={() => (confirmDelete = true)}>
						{$t('action.delete')}
					</button>
				</div>
			</form>
		{:else}
			<!-- Read mode -->
			<div class="detail-meta card">
				<div class="meta-row">
					<span class="meta-label">{$t('cider.producer')}</span>
					<span class="meta-value">{cider.producer}</span>
				</div>
				{#if cider.style}
					<div class="meta-row">
						<span class="meta-label">{$t('cider.style')}</span>
						<span class="meta-value">{cider.style}</span>
					</div>
				{/if}
				{#if cider.vintage}
					<div class="meta-row">
						<span class="meta-label">{$t('cider.vintage')}</span>
						<span class="meta-value">{cider.vintage}</span>
					</div>
				{/if}
				{#if cider.abv}
					<div class="meta-row">
						<span class="meta-label">{$t('cider.abv')}</span>
						<span class="meta-value">{cider.abv}%</span>
					</div>
				{/if}
				<div class="meta-row">
					<span class="meta-label">{$t('detail.logged')}</span>
					<span class="meta-value">{formatDate(cider.dateLogged)}</span>
				</div>
			</div>

			<div class="notes-section">
				{#each NOTE_CATEGORIES as cat}
					{#if cider.notes[cat]}
						<div class="note-block">
							<h3 class="note-cat-label">{$t(`notes.${cat}`)}</h3>
							<p class="note-text">{cider.notes[cat]}</p>
						</div>
					{/if}
				{/each}
				{#if !NOTE_CATEGORIES.some((c) => cider?.notes[c])}
					<p class="no-notes">{$t('detail.noNotes')}</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Delete confirmation -->
{#if confirmDelete}
	<div class="backdrop" onclick={() => (confirmDelete = false)} role="presentation"></div>
	<div class="confirm-sheet" role="dialog" aria-modal="true">
		<div class="sheet-handle"></div>
		<h2>{$t('confirm.delete.title')}</h2>
		<p>{$t('confirm.delete.body')}</p>
		<button class="btn btn-danger btn-full" onclick={handleDelete}>
			{$t('confirm.delete.yes')}
		</button>
		<button class="btn btn-ghost btn-full" onclick={() => (confirmDelete = false)}>
			{$t('confirm.delete.no')}
		</button>
	</div>
{/if}

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

	.header-title {
		flex: 1;
		font-size: 1.1rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		flex-shrink: 0;
	}

	.edit-btn {
		background: none;
		border: none;
		color: var(--color-primary);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		padding: var(--spacing-sm);
		-webkit-tap-highlight-color: transparent;
		flex-shrink: 0;
	}

	.header-spacer {
		width: 60px;
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

	.loading-state {
		height: 200px;
	}

	.not-found {
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--spacing-xl) 0;
	}

	/* Read mode */
	.detail-meta {
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: 0;
	}

	.meta-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
	}

	.meta-row:last-child {
		border-bottom: none;
	}

	.meta-label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.meta-value {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.notes-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.note-block {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.note-cat-label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--color-primary);
	}

	.note-text {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-text);
	}

	.no-notes {
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* Edit mode */
	form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
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

	.form-actions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding-bottom: var(--spacing-lg);
	}

	/* Delete confirmation sheet */
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 99;
	}

	.confirm-sheet {
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
	}

	.sheet-handle {
		width: 40px;
		height: 4px;
		background: var(--color-border);
		border-radius: var(--radius-full);
	}

	.confirm-sheet h2 {
		font-size: 1.1rem;
	}

	.confirm-sheet p {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}
</style>
