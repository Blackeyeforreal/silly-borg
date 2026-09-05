import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c ^ buf[i]) >>> 0;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) >>> 0 : (c >>> 1) >>> 0;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(size: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines: size lines, each line = 1 byte filter (0) + size * 4 bytes RGBA
  const lineSize = 1 + size * 4;
  const rawData = Buffer.alloc(size * lineSize);

  for (let y = 0; y < size; y++) {
    const lineOffset = y * lineSize;
    rawData[lineOffset] = 0; // None filter
    for (let x = 0; x < size; x++) {
      const pxOffset = lineOffset + 1 + x * 4;
      
      // Draw a rounded rectangle / blue background with white sparkle/document accent
      const dx = x - size / 2;
      const dy = y - size / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isInner = dist < (size / 2 - 1);

      if (isInner) {
        // Gradient blue: #2563EB to #1D4ED8
        rawData[pxOffset] = 37;      // R
        rawData[pxOffset + 1] = 99;  // G
        rawData[pxOffset + 2] = 235; // B
        rawData[pxOffset + 3] = 255; // A

        // Draw a central white document emblem
        const margin = size * 0.25;
        if (x >= margin && x <= size - margin && y >= margin && y <= size - margin) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(process.cwd(), 'extension', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach((size) => {
  const png = createPng(size);
  const target = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(target, png);
  console.log(`Generated ${target} (${png.length} bytes)`);
});
