/**
 * prebuild.js - 打包前清理脚本
 * 清理 node_modules 中不需要的目录和文件，减小打包体积
 * 不再隐藏 node_modules，因为 electron-builder 需要它来验证依赖
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const nmDir = path.join(rootDir, 'node_modules');

const dirsToRemove = ['test', '__tests__', 'demo', 'example', 'docs', 'scripts', '.github'];
const extsToRemove = ['.md', '.txt'];

function cleanPackage(dir) {
  for (const d of dirsToRemove) {
    const p = path.join(dir, d);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`  [clean] Removed ${path.relative(rootDir, p)}`);
    }
  }

  try {
    const entries = fs.readdirSync(dir);
    for (const f of entries) {
      if (extsToRemove.some(ext => f.endsWith(ext)) && !f.endsWith('.d.ts')) {
        fs.unlinkSync(path.join(dir, f));
      }
    }
  } catch {}
}

function walkAndClean(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (dirsToRemove.includes(entry.name)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`  [clean] Removed ${path.relative(rootDir, fullPath)}`);
      } else {
        cleanPackage(fullPath);
        walkAndClean(fullPath);
      }
    }
  }
}

console.log('[prebuild] Cleaning node_modules...');
walkAndClean(nmDir);
console.log('[prebuild] Done.');
