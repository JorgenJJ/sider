// Generates PNG app icons from the master SVG.
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svg = readFileSync(join(root, 'static/icons/icon.svg'));

const targets = [
	{ size: 192, file: 'static/icons/icon-192.png' },
	{ size: 512, file: 'static/icons/icon-512.png' }
];

for (const { size, file } of targets) {
	await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(join(root, file));
	console.log(`wrote ${file} (${size}x${size})`);
}
