import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface CiderNotes {
	utseende?: string; // Look — colour, clarity, carbonation
	aroma?: string; // Smell — fruit, earth, off-notes
	smak?: string; // Taste — sweetness, acidity, bitterness, fruit character
	munnfølelse?: string; // Mouthfeel — body, carbonation, finish length
	generelt?: string; // General impressions / free overflow
}

export type NoteCategory = keyof CiderNotes;

// ── Reserved for future rating feature — NOT exposed in v1 UI ──────────────
// Scale is intentionally unspecified; do not assume 1–5.
// Introduce via a DB version bump when the rating feature is designed.
export interface CiderRatings {
	utseende?: number;
	aroma?: number;
	smak?: number;
	munnfølelse?: number;
	totalinntrykk?: number;
}
// ────────────────────────────────────────────────────────────────────────────

export interface Cider {
	id: string; // crypto.randomUUID()
	name: string; // Cider product name
	producer: string; // Producer / brewery name
	style?: string; // e.g. "Tørr", "Halvtørr", "Søt", "Rosé"
	vintage?: number; // Production year
	abv?: number; // Alcohol by volume (%)
	dateLogged: string; // ISO 8601 date string
	notes: CiderNotes; // Per-category tasting notes
	ratings?: CiderRatings; // Reserved — not populated or read in v1
	imagePath?: string; // Reserved for future image capture — do not expose in UI
}

interface SiderDB extends DBSchema {
	ciders: {
		key: string;
		value: Cider;
		indexes: {
			'by-producer': string;
			'by-date': string;
		};
	};
}

let dbPromise: Promise<IDBPDatabase<SiderDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SiderDB>> {
	if (!dbPromise) {
		dbPromise = openDB<SiderDB>('sider-db', 1, {
			upgrade(db) {
				const store = db.createObjectStore('ciders', { keyPath: 'id' });
				store.createIndex('by-producer', 'producer');
				store.createIndex('by-date', 'dateLogged');
			}
		});
	}
	return dbPromise;
}
