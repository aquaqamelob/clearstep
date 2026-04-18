import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public");

const PRIMARY = "#0ea5e9";
const PRIMARY_DARK = "#0369a1";
const FG = "#ffffff";

function svg({ size, padding = 0, bg = PRIMARY, bgDark = PRIMARY_DARK }) {
  const inner = size - padding * 2;
  const r = size * 0.18;
  const fontSize = inner * 0.42;
  const y = size / 2 + fontSize * 0.34;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${bgDark}"/>
    </linearGradient>
  </defs>
  <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${r}" ry="${r}" fill="url(#g)"/>
  <text x="50%" y="${y}" text-anchor="middle"
        font-family="-apple-system, system-ui, Helvetica, Arial, sans-serif"
        font-weight="800" font-size="${fontSize}" fill="${FG}" letter-spacing="-2">CS</text>
</svg>`.trim();
}

async function write(name, buf) {
  const path = join(OUT_DIR, name);
  await sharp(Buffer.from(buf)).png().toFile(path);
  console.log("✔", name);
}

await mkdir(OUT_DIR, { recursive: true });

await write("icon-192.png", svg({ size: 192 }));
await write("icon-512.png", svg({ size: 512 }));
await write("icon-maskable-512.png", svg({ size: 512, padding: 64 }));
await write("apple-touch-icon.png", svg({ size: 180 }));
await write("favicon.png", svg({ size: 64 }));

console.log("✔ all icons generated");
