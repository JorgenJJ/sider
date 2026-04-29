import { writable } from 'svelte/store';

/** Set to true after the user saves their first cider to trigger the install prompt. */
export const triggerInstallPrompt = writable(false);
