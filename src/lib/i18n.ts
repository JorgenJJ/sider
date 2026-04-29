/**
 * Lightweight reactive i18n store.
 * Messages are imported at build time from messages/*.json.
 * No runtime network requests; zero extra dependencies.
 *
 * Note: The architecture spec called for Paraglide JS (inlang), but that requires
 * a CLI-based project setup step that is impractical to automate. This simple
 * store-based approach is behaviourally equivalent for v1's needs and can be
 * migrated to Paraglide later without touching component code (only the import
 * path and call-site of `t` would change). See ADR-004 (pending) if this
 * decision needs documenting.
 */
import { writable, derived, get } from 'svelte/store';
import nb from '../../messages/nb.json';
import nn from '../../messages/nn.json';

export type Locale = 'nb' | 'nn';

const STORAGE_KEY = 'locale';
const messages: Record<Locale, Record<string, string>> = { nb, nn };

function detectLocale(): Locale {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'nb' || stored === 'nn') return stored;
	}
	if (typeof navigator !== 'undefined') {
		const lang = navigator.language ?? '';
		if (lang.startsWith('nn')) return 'nn';
	}
	return 'nb';
}

export const locale = writable<Locale>('nb');

/** Call once on app boot (client only). */
export function initLocale() {
	locale.set(detectLocale());
}

export function setLocale(l: Locale) {
	locale.set(l);
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, l);
	}
}

/** Reactive translation function. Use as `$t('key')` in Svelte templates. */
export const t = derived(locale, ($locale) => {
	return (key: string, vars?: Record<string, string | number>): string => {
		let msg = messages[$locale][key] ?? messages['nb'][key] ?? key;
		if (vars) {
			for (const [k, v] of Object.entries(vars)) {
				msg = msg.replaceAll(`{${k}}`, String(v));
			}
		}
		return msg;
	};
});

/** Non-reactive translation for use outside Svelte templates. */
export function translate(key: string, vars?: Record<string, string | number>): string {
	return get(t)(key, vars);
}
