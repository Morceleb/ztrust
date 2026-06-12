/**
 * postbuild.js - 打包后处理
 * electron-builder 完成后执行清理（如果有需要的话）
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const prodNm = path.join(rootDir, 'prod_node_modules');

// 清理临时的 prod_node_modules（如果有）
if (fs.existsSync(prodNm)) {
  fs.rmSync(prodNm, { recursive: true, force: true });
  console.log('[postbuild] prod_node_modules cleaned up');
}

console.log('[postbuild] Done.');
