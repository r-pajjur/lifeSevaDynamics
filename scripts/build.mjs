/**
 * Assembles the deployable site:
 *   site/*                        -> dist/
 *   wayfinder/dist/.../browser/*  -> dist/wayfinder/
 * The Angular build runs before this (see package.json).
 */
import { cp, rm, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const angular = join(root, 'wayfinder', 'dist', 'wayfinder', 'browser');

await access(angular).catch(() => {
  console.error(`Angular build output missing at ${angular} — run the wayfinder build first.`);
  process.exit(1);
});

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, 'site'), dist, { recursive: true });
await cp(angular, join(dist, 'wayfinder'), { recursive: true });

console.log('Assembled dist/ — landing page, site apps, wayfinder/');
