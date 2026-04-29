#!/usr/bin/env node
/**
 * Local test server for the Sider PWA build.
 * Serves the build/ folder with SPA fallback (index.html for unknown routes).
 *
 * Usage:
 *   node serve.mjs          (all platforms)
 *   ./serve.mjs             (macOS / Linux after: chmod +x serve.mjs)
 *   Double-click serve.bat  (Windows)
 *
 * No npm install needed — uses only Node.js built-ins.
 * Run `npm run build` (on macOS/Linux/WSL) first if build/ is stale.
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { resolve, join, extname } from 'path';
import { fileURLToPath } from 'url';

const BUILD_DIR = resolve(fileURLToPath(import.meta.url), '..', 'build');
const PORT = 4173;

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.webmanifest': 'application/manifest+json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

createServer(async (req, res) => {
	const urlPath = req.url.split('?')[0];
	let filePath = join(BUILD_DIR, urlPath);

	// Resolve directories to index.html
	try {
		const s = await stat(filePath);
		if (s.isDirectory()) filePath = join(filePath, 'index.html');
	} catch {
		// File doesn't exist → SPA fallback
		filePath = join(BUILD_DIR, 'index.html');
	}

	try {
		const content = await readFile(filePath);
		const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
		// Long-lived cache for hashed assets, no-cache for everything else
		const isHashed = urlPath.includes('/_app/immutable/');
		res.writeHead(200, {
			'Content-Type': mime,
			'Cache-Control': isHashed ? 'public, max-age=31536000, immutable' : 'no-cache',
		});
		res.end(content);
	} catch {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('Not found');
	}
}).listen(PORT, '0.0.0.0', () => {
	console.log('');
	console.log('  🍎  Sider');
	console.log(`  ➜  Local:   http://localhost:${PORT}`);
	console.log(`  ➜  Network: http://<your-ip>:${PORT}  (for testing on mobile)`);
	console.log('');
	console.log('  Note: PWA service worker requires HTTPS or localhost.');
	console.log('  To rebuild:  npm run build  (macOS / Linux / WSL)');
	console.log('');
	console.log('  Ctrl+C to stop');
	console.log('');
});
