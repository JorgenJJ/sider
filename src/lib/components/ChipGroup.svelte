<script lang="ts" generics="T extends string">
	interface Option {
		key: T;
		label: string;
	}

	interface Props {
		label: string;
		options: Option[];
		// Single-select binds a string; multi-select binds a string[].
		value: T | T[] | undefined;
		multi?: boolean;
		showLabel?: boolean;
	}

	let { label, options, value = $bindable(), multi = false, showLabel = true }: Props = $props();

	function isSelected(key: T): boolean {
		if (multi) return Array.isArray(value) && value.includes(key);
		return value === key;
	}

	function toggle(key: T) {
		if (multi) {
			const current = Array.isArray(value) ? value : [];
			value = current.includes(key) ? current.filter((k) => k !== key) : ([...current, key] as T[]);
		} else {
			value = value === key ? (undefined as T | undefined) : key;
		}
	}
</script>

<div class="chip-group">
	{#if showLabel}
		<span class="chip-group-label">{label}</span>
	{/if}
	<div class="chips" role={multi ? 'group' : 'radiogroup'} aria-label={label}>
		{#each options as opt (opt.key)}
			<button
				type="button"
				class="chip"
				class:selected={isSelected(opt.key)}
				role={multi ? 'checkbox' : 'radio'}
				aria-checked={isSelected(opt.key)}
				onclick={() => toggle(opt.key)}
			>
				{opt.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.chip-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.chip-group-label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		height: 30px;
		padding: 0 10px;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-full);
		font-family: var(--font);
		font-size: 0.82rem;
		color: var(--color-text);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			background 0.12s,
			border-color 0.12s,
			color 0.12s;
		white-space: nowrap;
	}

	.chip:active {
		transform: scale(0.96);
	}

	.chip.selected {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-primary-text);
	}
</style>
