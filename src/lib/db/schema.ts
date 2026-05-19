import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ── Sweetness, carbonation and type are now independent axes ───────────────
// Earlier `style` mixed them (a cider can be both "Tørr" and "Stille").
export type SweetnessKey = 'dry' | 'semidry' | 'semisweet' | 'sweet';
export type CarbonationKey = 'still' | 'sparkling';
export type CiderTypeKey = 'apple' | 'pear' | 'ice' | 'rose' | 'other';

export const SWEETNESS_KEYS: SweetnessKey[] = ['dry', 'semidry', 'semisweet', 'sweet'];
export const CARBONATION_KEYS: CarbonationKey[] = ['still', 'sparkling'];
export const TYPE_KEYS: CiderTypeKey[] = ['apple', 'pear', 'ice', 'rose', 'other'];

// Sensory chip keys — i18n via `appearance.<key>`, `aroma.<key>`, `flavor.<key>`.
export const APPEARANCE_KEYS = ['lightyellow', 'golden', 'amber', 'pink', 'hazy'] as const;
export const AROMA_KEYS = ['apple', 'pear', 'citrus', 'floral', 'spice', 'yeast'] as const;
export const FLAVOR_KEYS = ['fresh', 'fruity', 'acidic', 'bitter', 'tannic', 'funky'] as const;

export type AppearanceKey = (typeof APPEARANCE_KEYS)[number];
export type AromaKey = (typeof AROMA_KEYS)[number];
export type FlavorKey = (typeof FLAVOR_KEYS)[number];

// ── Legacy per-category notes, kept for backwards-compatible reads ─────────
// New records use a single free-text `comment` field instead.
export interface CiderNotes {
	utseende?: string;
	aroma?: string;
	smak?: string;
	munnfølelse?: string;
	generelt?: string;
}

export type NoteCategory = keyof CiderNotes;

// ── Reserved for future rating feature — NOT exposed in v1 UI ──────────────
export interface CiderRatings {
	utseende?: number;
	aroma?: number;
	smak?: number;
	munnfølelse?: number;
	totalinntrykk?: number;
}

export interface Cider {
	id: string;
	name: string;
	producer: string;
	dateLogged: string;
	// New simplified axes (v2):
	sweetness?: SweetnessKey;
	carbonation?: CarbonationKey;
	type?: CiderTypeKey;
	appearance?: AppearanceKey[];
	aroma?: AromaKey[];
	flavor?: FlavorKey[];
	comment?: string;
	// Optional metadata:
	vintage?: number;
	abv?: number;
	// Legacy fields, still readable but no longer written:
	style?: string;
	notes?: CiderNotes;
	// Reserved:
	ratings?: CiderRatings;
	imagePath?: string;
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
		dbPromise = openDB<SiderDB>('sider-db', 2, {
			upgrade(db, oldVersion) {
				if (oldVersion < 1) {
					const store = db.createObjectStore('ciders', { keyPath: 'id' });
					store.createIndex('by-producer', 'producer');
					store.createIndex('by-date', 'dateLogged');
				}
				// v2 is additive — new optional fields on Cider. Legacy `style`
				// and `notes` are preserved on existing records so no in-place
				// rewrite is required.
			}
		});
	}
	return dbPromise;
}
