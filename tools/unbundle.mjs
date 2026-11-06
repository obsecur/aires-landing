#!/usr/bin/env node
// Convierte el HTML "autodesempaquetable" que exporta Claude Design en un sitio
// estático normal (index.html + assets/). Evita la pantalla de carga del bundler
// (la "A" sobre fondo marrón, el cartel "Unpacking..." y los márgenes claros).
//
// Uso: node tools/unbundle.mjs <export.html> [carpeta-salida=.]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const [input, outDir = '.'] = process.argv.slice(2);
if (!input) { console.error('Uso: node tools/unbundle.mjs <export.html> [salida]'); process.exit(1); }

const html = fs.readFileSync(input, 'utf8');
const block = (t) => {
  const m = html.match(new RegExp(`<script type="__bundler/${t}">([\\s\\S]*?)</script>`));
  return m ? JSON.parse(m[1]) : null;
};
const manifest = block('manifest');
let template = block('template');
if (!manifest || !template) { console.error('No parece un bundle de Claude Design.'); process.exit(1); }
const extResources = block('ext_resources') || [];

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg',
  'font/woff2': 'woff2', 'font/woff': 'woff', 'text/javascript': 'js', 'application/javascript': 'js', 'text/css': 'css' };
const named = Object.fromEntries(extResources.map((r) => [r.uuid, path.basename(new URL(r.id).pathname)]));

const assetsDir = path.join(outDir, 'assets');
fs.rmSync(assetsDir, { recursive: true, force: true });
fs.mkdirSync(assetsDir, { recursive: true });

const urls = {};
for (const [uuid, e] of Object.entries(manifest)) {
  let buf = Buffer.from(e.data, 'base64');
  if (e.compressed) buf = zlib.gunzipSync(buf);
  const file = named[uuid] || `${uuid.slice(0, 8)}.${EXT[e.mime] || 'bin'}`;
  fs.writeFileSync(path.join(assetsDir, file), buf);
  urls[uuid] = `assets/${file}`;
}
for (const [uuid, url] of Object.entries(urls)) template = template.split(uuid).join(url);
template = template.replace(/\s+integrity="[^"]*"/gi, '').replace(/\s+crossorigin="[^"]*"/gi, '');

// Mapa de recursos externos (React) para que el runtime use las copias locales.
const resources = Object.fromEntries(extResources.filter((r) => urls[r.uuid]).map((r) => [r.id, urls[r.uuid]]));

// Primer pintado: fondo marrón del intro desde el primer frame (sin flash claro),
// template crudo oculto hasta que el runtime renderiza, y logo precargado.
const bg = (template.match(/--color-accent-900:\s*(#[0-9a-f]{3,8})/i) || [])[1] || '#402310';
const logo = (template.match(/data-intro[\s\S]*?url\(&quot;(assets\/[^&]+)&quot;\)/) || [])[1];
const head = [
  `<style>html{background:${bg}}x-dc{display:none}</style>`,
  logo ? `<link rel="preload" as="image" href="${logo}" crossorigin>` : '',
  `<script>window.__resources = ${JSON.stringify(resources).replace(/<\//g, '<\\/')};</script>`,
].filter(Boolean).join('\n');
// Va después del <meta charset> (tiene que quedar dentro de los primeros bytes).
const anchor = /<meta charset[^>]*>/i.test(template) ? /<meta charset[^>]*>/i : /<head[^>]*>/i;
template = template.replace(anchor, (m) => `${m}\n${head}`);
if (!/<html[^>]*\blang=/i.test(template)) template = template.replace(/<html/i, '<html lang="es"');

fs.writeFileSync(path.join(outDir, 'index.html'), template);
console.log(`OK: index.html + ${Object.keys(urls).length} assets en ${assetsDir}`);
