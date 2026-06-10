# ZTrust Tauri 构建脚本
# 用于构建和打包 Tauri 应用

param(
    [switch]$Release,
    [switch]$Debug,
    [string]$Target = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ZTrust Tauri 构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 检查 Rust 环境
Write-Host "`n[1/5] 检查 Rust 环境..." -ForegroundColor Yellow
$rustcVersion = rustc --version 2>$null
$cargoVersion = cargo --version 2>$null

if (-not $rustcVersion) {
    Write-Host "错误: 未找到 Rust 环境" -ForegroundColor Red
    Write-Host "请先安装 Rust: https://rustup.rs" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Rust: $rustcVersion" -ForegroundColor Green
Write-Host "  Cargo: $cargoVersion" -ForegroundColor Green

# 安装前端依赖
Write-Host "`n[2/5] 安装前端依赖..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install 失败" }
} finally {
    Pop-Location
}

# 安装 Tauri CLI（如果需要）
Write-Host "`n[3/5] 检查 Tauri CLI..." -ForegroundColor Yellow
$tauriVersion = cargo tauri --version 2>$null
if (-not $tauriVersion) {
    Write-Host "  安装 Tauri CLI..." -ForegroundColor Yellow
    cargo install tauri-cli --locked
}

Write-Host "  Tauri CLI: $tauriVersion" -ForegroundColor Green

# 构建前端
Write-Host "`n[4/5] 构建前端..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    if ($Debug) {
        npm run dev
    } else {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "前端构建失败" }
    }
} finally {
    Pop-Location
}

# 构建 Tauri
Write-Host "`n[5/5] 构建 Tauri 应用..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    $buildArgs = @("tauri", "build")

    if ($Release) {
        $buildArgs += "--release"
    }

    if ($Target) {
        $buildArgs += "--target"
        $buildArgs += $Target
    }

    & npm run @buildArgs
    if ($LASTEXITCODE -ne 0) { throw "Tauri 构建失败" }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  构建完成!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan

    # 显示输出文件
    $distDir = Join-Path $ProjectRoot "src-tauri" "target" "release" "bundle"
    if (Test-Path $distDir) {
        Write-Host "`n输出文件:" -ForegroundColor Yellow
        Get-ChildItem $distDir -Recurse -File | ForEach-Object {
            Write-Host "  $($_.FullName)" -ForegroundColor White
        }
    }
} finally {
    Pop-Location
}
