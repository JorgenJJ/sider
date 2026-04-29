import { getAllCiders } from './db/ciders';
import type { NoteCategory } from './db/schema';

export interface SuggestionChip {
	text: string;
	count: number;
}

/**
 * Extract sentence-level suggestions for a given note category from past entries.
 * Returns up to 8 chips ranked by frequency.
 * Returns empty array if fewer than 2 past entries exist for this category.
 */
export async function getSuggestions(category: NoteCategory): Promise<SuggestionChip[]> {
	const ciders = await getAllCiders();

	// Collect non-empty values for this category
	const values = ciders.map((c) => c.notes[category]).filter((v): v is string => Boolean(v?.trim()));

	// Need at least 2 entries to generate useful suggestions
	if (values.length < 2) return [];

	// Split into sentence-level tokens
	const tokens: string[] = [];
	for (const value of values) {
		const parts = value
			.split(/[.,!\n]+/)
			.map((p) => p.trim())
			.filter((p) => p.length >= 3);
		tokens.push(...parts);
	}

	// Build frequency map (lowercase key, preserves last-seen casing)
	const freq = new Map<string, { original: string; count: number }>();
	for (const token of tokens) {
		const key = token.toLowerCase();
		const entry = freq.get(key);
		if (entry) {
			entry.count++;
			entry.original = token; // keep most recent casing
		} else {
			freq.set(key, { original: token, count: 1 });
		}
	}

	// Sort by frequency desc, then alphabetically
	return [...freq.values()]
		.sort((a, b) => b.count - a.count || a.original.localeCompare(b.original, 'nb'))
		.slice(0, 8)
		.map(({ original, count }) => ({ text: original, count }));
}
