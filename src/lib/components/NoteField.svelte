<script lang="ts">
	import { getSuggestions, type SuggestionChip } from '$lib/suggestions';
	import { t } from '$lib/i18n';
	import type { NoteCategory } from '$lib/db/schema';

	interface Props {
		category: NoteCategory;
		value?: string;
		label: string;
		hint: string;
		onchange?: (value: string) => void;
	}

	let { category, value = $bindable(''), label, hint, onchange }: Props = $props();

	let suggestions = $state<SuggestionChip[]>([]);
	let focused = $state(false);
	let loaded = $state(false);

	async function handleFocus() {
		focused = true;
		if (!loaded) {
			suggestions = await getSuggestions(category);
			loaded = true;
		}
	}

	function handleBlur() {
		// Delay so chip clicks register before hiding
		setTimeout(() => {
			focused = false;
		}, 200);
	}

	function applyChip(chip: string) {
		const trimmed = value.trimEnd();
		value = trimmed ? trimmed + ', ' + chip : chip;
		onchange?.(value);
	}

	function handleInput(e: Event) {
		value = (e.target as HTMLTextAreaElement).value;
		onchange?.(value);
	}
</script>

<div class="note-field">
	<label for="note-{category}">{label}</label>

	<div class="textarea-wrap" class:focused>
		<textarea
			id="note-{category}"
			rows="3"
			placeholder={hint}
			{value}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
		></textarea>
	</div>

	{#if focused && suggestions.length > 0}
		<div class="chips" role="group" aria-label={$t('suggestions.label')}>
			{#each suggestions as chip}
				<button
					type="button"
					class="chip"
					onmousedown={(e) => e.preventDefault()}
					onclick={() => applyChip(chip.text)}
				>
					{chip.text}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.note-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.textarea-wrap textarea {
		width: 100%;
		padding: 12px 14px;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: var(--font);
		font-size: 0.95rem;
		color: var(--color-text);
		background: var(--color-surface);
		outline: none;
		resize: vertical;
		min-height: 76px;
		transition: border-color 0.15s;
		line-height: 1.5;
	}

	.textarea-wrap.focused textarea {
		border-color: var(--color-primary);
	}

	textarea::placeholder {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding-top: 2px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		height: 32px;
		padding: 0 12px;
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		font-family: var(--font);
		font-size: 0.82rem;
		color: var(--color-text);
		cursor: pointer;
		transition:
			background 0.12s,
			border-color 0.12s;
		-webkit-tap-highlight-color: transparent;
		white-space: nowrap;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chip:hover,
	.chip:focus {
		background: #e0f0e8;
		border-color: var(--color-primary);
		outline: none;
	}

	.chip:active {
		transform: scale(0.96);
	}
</style>
