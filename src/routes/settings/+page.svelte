<script lang="ts">
	import { t, locale, setLocale, type Locale } from '$lib/i18n';
	import { exportJSON, importJSON } from '$lib/db/ciders';

	let importStatus = $state<{ type: 'success' | 'error'; message: string } | null>(null);
	let importing = $state(false);

	async function handleExport() {
		const json = await exportJSON();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `sider-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		importing = true;
		importStatus = null;
		try {
			const text = await file.text();
			const { added, skipped } = await importJSON(text);
			if (added === 0 && skipped === 0) {
				importStatus = { type: 'error', message: $t('settings.import.empty') };
			} else {
				importStatus = {
					type: 'success',
					message: $t('settings.import.success', { added, skipped })
				};
			}
		} catch {
			importStatus = { type: 'error', message: $t('settings.import.error') };
		} finally {
			importing = false;
			// Reset file input
			(e.target as HTMLInputElement).value = '';
		}
	}

	function handleLocaleChange(e: Event) {
		setLocale((e.target as HTMLSelectElement).value as Locale);
	}
</script>

<svelte:head>
	<title>{$t('settings.title')} — {$t('app.name')}</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<h1>{$t('settings.title')}</h1>
	</header>

	<div class="page-content">
		<!-- Language -->
		<section class="settings-section">
			<p class="section-heading">{$t('settings.language')}</p>
			<div class="card settings-card">
				<div class="settings-row">
					<label for="lang-select">{$t('settings.language')}</label>
					<select
						id="lang-select"
						value={$locale}
						onchange={handleLocaleChange}
						class="lang-select"
					>
						<option value="nb">{$t('settings.language.nb')}</option>
						<option value="nn">{$t('settings.language.nn')}</option>
					</select>
				</div>
			</div>
		</section>

		<!-- Data -->
		<section class="settings-section">
			<p class="section-heading">{$t('settings.data.section')}</p>
			<div class="card settings-card">
				<!-- Export -->
				<div class="settings-item">
					<div class="item-text">
						<span class="item-label">{$t('settings.export')}</span>
						<span class="item-desc">{$t('settings.export.description')}</span>
					</div>
					<button class="btn btn-ghost item-action" onclick={handleExport}>
						{$t('settings.export.button')}
					</button>
				</div>

				<div class="item-divider"></div>

				<!-- Import -->
				<div class="settings-item">
					<div class="item-text">
						<span class="item-label">{$t('settings.import')}</span>
						<span class="item-desc">{$t('settings.import.description')}</span>
					</div>
					<label class="btn btn-ghost item-action" for="import-input">
						{importing ? '…' : $t('settings.import.button')}
						<input
							id="import-input"
							type="file"
							accept="application/json,.json"
							onchange={handleImport}
							style="display:none"
						/>
					</label>
				</div>

				{#if importStatus}
					<div class="notice notice-{importStatus.type}">
						{importStatus.message}
					</div>
				{/if}
			</div>
		</section>

		<!-- About -->
		<section class="settings-section">
			<p class="section-heading">{$t('settings.about.section')}</p>
			<div class="card settings-card">
				<div class="settings-row">
					<span class="item-label">{$t('app.name')}</span>
					<span class="item-desc">{$t('settings.version', { version: '0.1.0' })}</span>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}

	.page-header {
		padding: var(--spacing-md) var(--page-padding) var(--spacing-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.page-content {
		flex: 1;
		padding: var(--spacing-lg) var(--page-padding);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.section-heading {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		padding: 0 var(--spacing-xs);
	}

	.settings-card {
		overflow: visible;
	}

	.settings-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px var(--spacing-md);
	}

	.settings-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-md);
		padding: 14px var(--spacing-md);
	}

	.item-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.item-label {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.item-desc {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.item-action {
		height: 36px;
		padding: 0 var(--spacing-md);
		font-size: 0.875rem;
		flex-shrink: 0;
		cursor: pointer;
	}

	.item-divider {
		height: 1px;
		background: var(--color-border);
		margin: 0 var(--spacing-md);
	}

	.lang-select {
		width: auto;
		padding: 8px 36px 8px 12px;
		font-size: 0.875rem;
		height: auto;
	}

	.notice {
		margin: 0 var(--spacing-md) var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
	}

	.notice-success {
		background: #e8f4ec;
		color: #1e5c35;
	}

	.notice-error {
		background: #fdf0ef;
		color: #922b21;
	}
</style>
