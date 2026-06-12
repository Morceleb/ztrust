# ZTrust Tauri 开发脚本
# 用于启动 Tauri 开发服务器

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ZTrust Tauri 开发模式" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent $PSScriptRoot

# 安装依赖
Write-Host "`n[1/3] 检查依赖..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install 失败" }
} finally {
    Pop-Location
}

# 启动 Tauri 开发服务器
Write-Host "`n[2/3] 启动 Tauri 开发服务器..." -ForegroundColor Yellow
Write-Host "  按 Ctrl+C 停止服务器" -ForegroundColor Gray

Push-Location $ProjectRoot
try {
    npm run tauri dev
} finally {
    Pop-Location
}
