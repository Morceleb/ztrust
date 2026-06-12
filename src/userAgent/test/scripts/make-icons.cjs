/**
 * 生成简单的 PNG 图标
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

function createPNG(width, height, filename) {
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData.writeUInt8(8, 8);
    ihdrData.writeUInt8(2, 9);
    ihdrData.writeUInt8(0, 10);
    ihdrData.writeUInt8(0, 11);
    ihdrData.writeUInt8(0, 12);

    const ihdrChunk = createChunk('IHDR', ihdrData);

    const rawData = [];
    for (let y = 0; y < height; y++) {
        rawData.push(0);
        for (let x = 0; x < width; x++) {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.35;
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            if (dist < radius) {
                rawData.push(255, 255, 255);
            } else {
                rawData.push(59, 130, 246);
            }
        }
    }

    const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });
    const idatChunk = createChunk('IDAT', compressed);
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
    const filepath = path.join(iconsDir, filename);
    fs.writeFileSync(filepath, png);
    console.log('Created:', filepath);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
    let crc = 0xFFFFFFFF;
    const table = makeCRCTable();
    for (let i = 0; i < buffer.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xFF];
    }
    return crc ^ 0xFFFFFFFF;
}

function makeCRCTable() {
    const table = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c;
    }
    return table;
}

console.log('Generating icons...');
createPNG(32, 32, '32x32.png');
createPNG(128, 128, '128x128.png');
createPNG(256, 256, '128x128@2x.png');
console.log('Done!');
