/**
 * Generates all PWA/iOS/Android icons from the source image.
 *
 * Android PWA:  pwa-192x192.png, pwa-512x512.png (maskable with padding)
 * iOS:          apple-touch-icon.png (180x180, white bg, no transparency)
 * Favicon:      favicon-32x32.png
 */
import sharp from 'sharp';
import { existsSync } from 'fs';

const SRC = 'image_84450242(1).png';

if (!existsSync(SRC)) {
  console.error(`❌ Source image not found: ${SRC}`);
  process.exit(1);
}

// White background flat square — used as base for all icons
async function makeIconBase(size, paddingFraction = 0.12) {
  const padding = Math.round(size * paddingFraction);
  const innerSize = size - padding * 2;

  const resized = await sharp(SRC)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png();
}

// Maskable icon: more padding so content stays in the 80% safe zone
async function makeMaskable(size) {
  const padding = Math.round(size * 0.15);
  const innerSize = size - padding * 2;

  const resized = await sharp(SRC)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png();
}

const jobs = [
  // Standard PWA icon
  { file: 'public/pwa-192x192.png',     fn: () => makeIconBase(192) },
  // Maskable PWA icon (Android adaptive icon safe zone)
  { file: 'public/pwa-512x512.png',     fn: () => makeMaskable(512) },
  // iOS home screen icon (no transparency, white bg)
  { file: 'public/apple-touch-icon.png', fn: () => makeIconBase(180) },
  // Small favicon
  { file: 'public/favicon-32x32.png',   fn: () => makeIconBase(32, 0.08) },
];

for (const { file, fn } of jobs) {
  await (await fn()).toFile(file);
  console.log(`✅ ${file}`);
}

// Update favicon.svg to use the PNG as embedded image (simple wrapper)
console.log('\n✅ All icons generated.');
