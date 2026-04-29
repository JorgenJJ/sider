import { getDB, type Cider } from './schema';

export async function getAllCiders(): Promise<Cider[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('ciders', 'by-date');
	// Reverse so newest first
	return all.reverse();
}

export async function getCiderById(id: string): Promise<Cider | undefined> {
	const db = await getDB();
	return db.get('ciders', id);
}

export async function saveCider(cider: Cider): Promise<void> {
	const db = await getDB();
	await db.put('ciders', cider);
}

export async function deleteCider(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('ciders', id);
}

export async function countCiders(): Promise<number> {
	const db = await getDB();
	return db.count('ciders');
}

export async function getProducers(): Promise<string[]> {
	const db = await getDB();
	const all = await db.getAll('ciders');
	const unique = [...new Set(all.map((c) => c.producer).filter(Boolean))];
	return unique.sort((a, b) => a.localeCompare(b, 'nb'));
}

/** Export all ciders as a JSON string */
export async function exportJSON(): Promise<string> {
	const ciders = await getAllCiders();
	return JSON.stringify(
		{
			version: 1,
			exported: new Date().toISOString(),
			ciders
		},
		null,
		2
	);
}

/** Import from JSON. Merges by id — existing records are NOT overwritten. */
export async function importJSON(json: string): Promise<{ added: number; skipped: number }> {
	const data = JSON.parse(json);
	if (!data.ciders || !Array.isArray(data.ciders)) {
		throw new Error('Ugyldig format: mangler "ciders"-array');
	}
	const db = await getDB();
	let added = 0;
	let skipped = 0;
	const tx = db.transaction('ciders', 'readwrite');
	for (const cider of data.ciders) {
		if (!cider.id || typeof cider.id !== 'string') continue;
		const existing = await tx.store.get(cider.id);
		if (existing) {
			skipped++;
		} else {
			await tx.store.put(cider);
			added++;
		}
	}
	await tx.done;
	return { added, skipped };
}
