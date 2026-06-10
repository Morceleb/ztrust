# ZTrust 清理脚本
# 用于清理构建产物

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ZTrust 清理脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent $PSScriptRoot

# 清理前端构建产物
Write-Host "`n[1/3] 清理前端构建产物..." -ForegroundColor Yellow
$distDir = Join-Path $ProjectRoot "dist"
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
    Write-Host "  已清理: dist/" -ForegroundColor Green
}

# 清理 Tauri 构建产物
Write-Host "`n[2/3] 清理 Tauri 构建产物..." -ForegroundColor Yellow
$tauriTargetDir = Join-Path $ProjectRoot "src-tauri" "target"
if (Test-Path $tauriTargetDir) {
    Remove-Item -Recurse -Force $tauriTargetDir
    Write-Host "  已清理: src-tauri/target/" -ForegroundColor Green
}

# 清理 node_modules
Write-Host "`n[3/3] 清理 node_modules..." -ForegroundColor Yellow
$nodeModulesDir = Join-Path $ProjectRoot "node_modules"
if (Test-Path $nodeModulesDir) {
    Write-Host "  跳过 node_modules，保留以加快下次构建" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  清理完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
