<script lang="ts" generics="T extends string">
	import ChipGroup from './ChipGroup.svelte';

	interface Option {
		key: T;
		label: string;
	}
	interface Group {
		key: string;
		label: string;
		options: Option[];
	}
	interface Props {
		label: string;
		groups: Group[];
		// Flat list of selected aroma keys across all groups.
		value: T[] | undefined;
	}

	let { label, groups, value = $bindable([]) }: Props = $props();

	let open = $state<Record<string, boolean>>({});

	function countFor(group: Group): number {
		const v = Array.isArray(value) ? value : [];
		return group.options.filter((o) => v.includes(o.key)).length;
	}
</script>

<div class="aroma-picker">
	<span class="aroma-picker-label">{label}</span>
	<div class="groups">
		{#each groups as group (group.key)}
			{@const selected = countFor(group)}
			<div class="group" class:open={open[group.key]}>
				<button
					type="button"
					class="group-header"
					class:has-selection={selected > 0}
					aria-expanded={open[group.key] ?? false}
					onclick={() => (open[group.key] = !open[group.key])}
				>
					<span class="caret" class:open={open[group.key]}>▸</span>
					<span class="group-name">{group.label}</span>
					{#if selected > 0}
						<span class="group-count">{selected}</span>
					{/if}
				</button>
				{#if open[group.key]}
					<div class="group-body">
						<ChipGroup label={group.label} options={group.options} bind:value multi showLabel={false} />
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.aroma-picker {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.aroma-picker-label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.groups {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.group-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-full);
		padding: 6px 12px;
		font-family: var(--font);
		font-size: 0.85rem;
		color: var(--color-text);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.group-header.has-selection {
		border-color: var(--color-primary);
	}

	.group-name {
		flex: 1;
		text-align: left;
		font-weight: 600;
	}

	.group-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		background: var(--color-primary);
		color: var(--color-primary-text);
		border-radius: var(--radius-full);
		font-size: 0.72rem;
		font-weight: 700;
	}

	.caret {
		display: inline-block;
		transition: transform 0.15s;
		color: var(--color-text-muted);
	}

	.caret.open {
		transform: rotate(90deg);
	}

	.group-body {
		padding: 8px 4px 4px;
	}
</style>
