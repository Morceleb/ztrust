# package.ps1 - 优化的 Electron 打包脚本
# 在 electron-builder 运行前清理 node_modules 中的无用文件

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot

Set-Location $rootDir

Write-Host "=== Step 1: Build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== Step 2: Clean node_modules ===" -ForegroundColor Cyan
node "$PSScriptRoot\prebuild.js"

Write-Host "`n=== Step 3: Pack with electron-builder ===" -ForegroundColor Cyan
npx electron-builder --win

Write-Host "`n=== Step 4: Cleanup ===" -ForegroundColor Cyan
node "$PSScriptRoot\postbuild.js"

Write-Host "`n=== Done ===" -ForegroundColor Green
