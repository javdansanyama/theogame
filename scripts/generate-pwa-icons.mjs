import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const outDir = 'public';
mkdirSync(outDir, { recursive: true });

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let i = 0; i < 8; i += 1) {
    c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (tag, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const type = Buffer.from(tag, 'ascii');
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([type, data])), 0);
  return Buffer.concat([len, type, data, checksum]);
};

const makePng = (width, height, raw) => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
};

const createPng = (size, maskable = false) => {
  const width = size;
  const height = size;
  const bytesPerPixel = 4;
  const rowSize = 1 + width * bytesPerPixel;
  const raw = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * (maskable ? 0.33 : 0.37);
  const ring = Math.max(1, Math.round(width * 0.012));

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;

    for (let x = 0; x < width; x += 1) {
      const pixel = rowStart + 1 + x * bytesPerPixel;
      let r = 30;
      let g = 58;
      let b = 138;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        r = 250;
        g = 204;
        b = 21;
      }

      if (Math.abs(dist - radius) < ring) {
        r = 254;
        g = 240;
        b = 138;
      }

      raw[pixel] = r;
      raw[pixel + 1] = g;
      raw[pixel + 2] = b;
      raw[pixel + 3] = 255;
    }
  }

  return makePng(width, height, raw);
};

writeFileSync(join(outDir, 'pwa-192.png'), createPng(192));
writeFileSync(join(outDir, 'pwa-512.png'), createPng(512));
writeFileSync(join(outDir, 'pwa-512-maskable.png'), createPng(512, true));
process.stdout.write('Generated procedural PWA icons.\n');
