/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/svelte" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Claim all clients immediately so the SW activates without a page reload
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});
