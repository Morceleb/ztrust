/**
 * 生成 ICO 图标文件
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');

function createICO(outputPath) {
    // 读取 32x32 PNG
    const png32Path = path.join(iconsDir, '32x32.png');
    const png32 = fs.readFileSync(png32Path);

    // ICO 文件格式
    // ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG data

    const iconDir = Buffer.alloc(6);
    iconDir.writeUInt16LE(0, 0);      // Reserved
    iconDir.writeUInt16LE(1, 2);      // Type: 1 = ICO
    iconDir.writeUInt16LE(1, 4);      // Number of images

    const iconEntry = Buffer.alloc(16);
    iconEntry.writeUInt8(32, 0);       // Width (0 = 256)
    iconEntry.writeUInt8(32, 1);       // Height
    iconEntry.writeUInt8(0, 2);        // Color palette
    iconEntry.writeUInt8(0, 3);        // Reserved
    iconEntry.writeUInt16LE(1, 4);     // Color planes
    iconEntry.writeUInt16LE(32, 6);    // Bits per pixel
    iconEntry.writeUInt32LE(png32.length, 8);  // Size of image data
    iconEntry.writeUInt32LE(22, 12);    // Offset to image data (6 + 16 = 22)

    const ico = Buffer.concat([iconDir, iconEntry, png32]);
    fs.writeFileSync(outputPath, ico);
    console.log('Created:', outputPath);
}

console.log('Generating ICO...');
createICO(path.join(iconsDir, 'icon.ico'));
console.log('Done!');
