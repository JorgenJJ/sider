import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			// Service worker source lives in src/
			srcDir: 'src',
			filename: 'service-worker.ts',
			strategies: 'injectManifest',
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,webmanifest}']
			},
			manifest: {
				id: '/',
				name: 'Sider',
				short_name: 'Sider',
				description: 'Logg og smak norske sidere',
				lang: 'nb',
				theme_color: '#3D6B4F',
				background_color: '#F7F4EF',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/icons/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icons/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			},
			devOptions: {
				enabled: false
			}
		})
	]
});
