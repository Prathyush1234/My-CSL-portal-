import fs from 'fs';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateIconPng(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // default filter
  ihdr[12] = 0; // no interlace

  const rowSize = width * 4;
  const rawData = Buffer.alloc((1 + rowSize) * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = (width / 2) * (isMaskable ? 0.72 : 0.88);
  const innerRadius = radius * 0.85;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark teal shipyard navy background
      let r = 2, g = 26, b = 36, a = 255;

      if (dist <= radius) {
        // Outer gold border ring
        if (dist >= radius - 6) {
          r = 245; g = 158; b = 11; a = 255;
        } else if (dist <= innerRadius) {
          // Inner emblem zone: bright cyan / teal / gold
          const angle = Math.atan2(dy, dx);
          const spoke = Math.abs(Math.sin(angle * 4));
          if (spoke > 0.82 && dist <= innerRadius * 0.8) {
            r = 245; g = 158; b = 11; a = 255; // gold spokes
          } else if (dist <= innerRadius * 0.45 && dist >= innerRadius * 0.35) {
            r = 0; g = 229; b = 255; a = 255; // cyan inner wheel
          } else if (dist <= innerRadius * 0.15) {
            r = 255; g = 255; b = 255; a = 255; // central white hub
          } else {
            r = 3; g = 43; b = 58; a = 255; // dark cyan navy fill
          }
        } else {
          r = 0; g = 168; b = 204; a = 255; // cyan wheel rim
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync('public/pwa-192x192.png', generateIconPng(192, 192, false));
fs.writeFileSync('public/pwa-512x512.png', generateIconPng(512, 512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', generateIconPng(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', generateIconPng(180, 180, false));
console.log('Successfully generated all PWA PNG icons!');
