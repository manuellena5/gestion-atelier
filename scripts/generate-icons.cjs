const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function hexToRgb(hex) {
  const value = parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function generateIcon(size, outPath, bgHex, fgHex) {
  const [bgR, bgG, bgB] = hexToRgb(bgHex);
  const [fgR, fgG, fgB] = hexToRgb(fgHex);

  const raw = Buffer.alloc((size * 3 + 1) * size);
  const radius = size * 0.32;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset] = 0; // filter type: none
    offset += 1;
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const inside = dx * dx + dy * dy <= radius * radius;
      if (inside) {
        raw[offset] = fgR;
        raw[offset + 1] = fgG;
        raw[offset + 2] = fgB;
      } else {
        raw[offset] = bgR;
        raw[offset + 1] = bgG;
        raw[offset + 2] = bgB;
      }
      offset += 3;
    }
  }

  const idatData = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(outPath, png);
  console.log(`Generated ${outPath}`);
}

const publicDir = path.join(__dirname, '..', 'public');
generateIcon(192, path.join(publicDir, 'icon-192.png'), '#B5806A', '#F2E6E0');
generateIcon(512, path.join(publicDir, 'icon-512.png'), '#B5806A', '#F2E6E0');
