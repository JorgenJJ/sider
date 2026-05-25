import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ── Sensory model based on the physical cider tasting wheel (siderhjul) ────
// HURTIGANALYSE axes: carbonation, colour, clarity, structure, sweetness,
// alcohol. Aromas are grouped (see AROMA_GROUPS). See
// docs/specs/flavor-wheel-aromas.md.
export type SweetnessKey = 'dry' | 'semidry' | 'semisweet' | 'sweet';
// Carbonation expanded from still/sparkling to the wheel's four levels.
// Legacy value 'still' is normalised to 'flat' for display/edit.
export type CarbonationKey = 'flat' | 'creamy' | 'pearling' | 'sparkling';
export type CiderTypeKey = 'apple' | 'pear' | 'ice' | 'rose' | 'other';

export const SWEETNESS_KEYS: SweetnessKey[] = ['dry', 'semidry', 'semisweet', 'sweet'];
export const CARBONATION_KEYS: CarbonationKey[] = ['flat', 'creamy', 'pearling', 'sparkling'];
export const TYPE_KEYS: CiderTypeKey[] = ['apple', 'pear', 'ice', 'rose', 'other'];

// ── "Se" (look) axes — i18n via `color.<key>`, `clarity.<key>` ─────────────
export type ColorKey = 'lightyellow' | 'golden' | 'amber' | 'pink';
export type ClarityKey = 'clear' | 'cloudy' | 'hazy';
export const COLOR_KEYS: ColorKey[] = ['lightyellow', 'golden', 'amber', 'pink'];
export const CLARITY_KEYS: ClarityKey[] = ['clear', 'cloudy', 'hazy'];

// ── "Smak" (palate) structure — wheel's Struktur axis ──────────────────────
export type StructureKey = 'sharp' | 'acidic' | 'round' | 'full';
export const STRUCTURE_KEYS: StructureKey[] = ['sharp', 'acidic', 'round', 'full'];

// ── Avvik (faults / off-aromas) — i18n via `fault.<key>` ───────────────────
export type FaultKey =
	| 'wetcardboard'
	| 'dampcellar'
	| 'rotten'
	| 'musty'
	| 'vinegar'
	| 'acetone'
	| 'sulfur';
export const FAULT_KEYS: FaultKey[] = [
	'wetcardboard',
	'dampcellar',
	'rotten',
	'musty',
	'vinegar',
	'acetone',
	'sulfur'
];

// ── Grouped aromas (Lukt) — i18n via `aromaGroup.<key>` and `aroma.<key>` ──
// Inspired by the siderhjul's aroma sections (epler / gjær / tilsetning).
export type AromaKey =
	| 'greenapple'
	| 'ripeapple'
	| 'bakedapple'
	| 'applejelly'
	| 'quince'
	| 'applepeel'
	| 'pear'
	| 'citrus'
	| 'grapefruit'
	| 'peach'
	| 'plum'
	| 'tropical'
	| 'kiwi'
	| 'blackcurrant'
	| 'raspberry'
	| 'blackberry'
	| 'lingonberry'
	| 'cherry'
	| 'rosehip'
	| 'elderflower'
	| 'whiteflowers'
	| 'lavender'
	| 'honey'
	| 'hops'
	| 'rhubarb'
	| 'ginger'
	| 'clove'
	| 'licorice'
	| 'cinnamon'
	| 'vanilla'
	| 'bread'
	| 'biscuit'
	| 'brioche'
	| 'almond'
	| 'banana'
	| 'butter'
	| 'oak'
	| 'wood'
	| 'sherry'
	| 'prunes'
	| 'leather'
	| 'smoke'
	// Legacy keys, kept only so old records still render:
	| 'apple'
	| 'floral'
	| 'spice'
	| 'yeast';

export interface AromaGroup {
	key: string;
	aromas: AromaKey[];
}

export const AROMA_GROUPS: AromaGroup[] = [
	{ key: 'apples', aromas: ['greenapple', 'ripeapple', 'bakedapple', 'applejelly', 'quince', 'applepeel'] },
	{ key: 'fruit', aromas: ['pear', 'citrus', 'grapefruit', 'peach', 'plum', 'tropical', 'kiwi'] },
	{ key: 'berry', aromas: ['blackcurrant', 'raspberry', 'blackberry', 'lingonberry', 'cherry', 'rosehip'] },
	{ key: 'floralHerb', aromas: ['elderflower', 'whiteflowers', 'lavender', 'honey', 'hops', 'rhubarb'] },
	{ key: 'spice', aromas: ['ginger', 'clove', 'licorice', 'cinnamon', 'vanilla'] },
	{ key: 'yeast', aromas: ['bread', 'biscuit', 'brioche', 'almond', 'banana', 'butter'] },
	{ key: 'barrel', aromas: ['oak', 'wood', 'sherry', 'prunes', 'leather', 'smoke'] }
];

export const AROMA_KEYS: AromaKey[] = AROMA_GROUPS.flatMap((g) => g.aromas);

// ── Legacy sensory keys, kept for backwards-compatible reads ───────────────
export type AppearanceKey = 'lightyellow' | 'golden' | 'amber' | 'pink' | 'hazy';
export type FlavorKey = 'fresh' | 'fruity' | 'acidic' | 'bitter' | 'tannic' | 'funky';

// Map a stored (possibly legacy) carbonation value to a current key.
export function normalizeCarbonation(value: string | undefined): CarbonationKey | undefined {
	if (!value) return undefined;
	if (value === 'still') return 'flat';
	return value as CarbonationKey;
}

// Best-effort split of a legacy `appearance` array into colour + clarity.
export function colorFromAppearance(appearance: AppearanceKey[] | undefined): ColorKey | undefined {
	return appearance?.find((k): k is ColorKey => k !== 'hazy');
}
export function clarityFromAppearance(
	appearance: AppearanceKey[] | undefined
): ClarityKey | undefined {
	return appearance?.includes('hazy') ? 'hazy' : undefined;
}

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
	// Independent axes:
	sweetness?: SweetnessKey;
	carbonation?: CarbonationKey;
	type?: CiderTypeKey;
	// Tasting-wheel sensory model (v3):
	color?: ColorKey;
	clarity?: ClarityKey;
	aroma?: AromaKey[];
	structure?: StructureKey[];
	faults?: FaultKey[];
	comment?: string;
	// Optional metadata:
	vintage?: number;
	abv?: number;
	// Legacy fields, still readable but no longer written:
	appearance?: AppearanceKey[];
	flavor?: FlavorKey[];
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
		dbPromise = openDB<SiderDB>('sider-db', 3, {
			upgrade(db, oldVersion) {
				if (oldVersion < 1) {
					const store = db.createObjectStore('ciders', { keyPath: 'id' });
					store.createIndex('by-producer', 'producer');
					store.createIndex('by-date', 'dateLogged');
				}
				// v2 and v3 are additive — new optional fields on Cider. Legacy
				// fields (`style`, `notes`, `appearance`, `flavor`) are preserved
				// on existing records so no in-place rewrite is required.
			}
		});
	}
	return dbPromise;
}
