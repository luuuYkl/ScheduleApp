# 智远日程 - Windows 服务器部署脚本
# 使用方法: 以管理员身份运行此脚本

param(
    [string]$Action = "install"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  智远日程 - Windows 服务器部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "请以管理员身份运行此脚本!" -ForegroundColor Red
    exit 1
}

# 项目根目录
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ServerPath = Join-Path $ProjectRoot "server"

Write-Host "项目根目录: $ProjectRoot" -ForegroundColor Yellow
Write-Host "后端目录: $ServerPath" -ForegroundColor Yellow

# 检查 Node.js 是否已安装
function Check-NodeJS {
    try {
        $nodeVersion = node --version
        Write-Host "[OK] Node.js 已安装: $nodeVersion" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[错误] Node.js 未安装，请先安装 Node.js LTS 版本" -ForegroundColor Red
        Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
        return $false
    }
}

# 检查 PM2 是否已安装
function Check-PM2 {
    try {
        $pm2Version = pm2 --version
        Write-Host "[OK] PM2 已安装: $pm2Version" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[警告] PM2 未安装，正在安装..." -ForegroundColor Yellow
        npm install -g pm2
        npm install -g pm2-windows-service
        return $true
    }
}

# 安装依赖
function Install-Dependencies {
    Write-Host "`n>>> 安装后端依赖..." -ForegroundColor Cyan
    Set-Location $ServerPath
    
    if (Test-Path "package.json") {
        npm install
        Write-Host "[OK] 后端依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "[错误] 找不到 server/package.json" -ForegroundColor Red
        return $false
    }
    
    Set-Location $ProjectRoot
    return $true
}

# 配置环境变量
function Setup-Environment {
    Write-Host "`n>>> 配置环境变量..." -ForegroundColor Cyan
    
    $envFile = Join-Path $ServerPath ".env"
    $envExample = Join-Path $ServerPath ".env.example"
    
    if (-not (Test-Path $envFile)) {
        if (Test-Path $envExample) {
            Copy-Item $envExample $envFile
            Write-Host "[OK] 已创建 .env 文件，请编辑配置" -ForegroundColor Green
            Write-Host "配置文件: $envFile" -ForegroundColor Yellow
        } else {
            Write-Host "[警告] 找不到 .env.example 模板" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[OK] .env 文件已存在" -ForegroundColor Green
    }
}

# 启动服务
function Start-Services {
    Write-Host "`n>>> 启动服务..." -ForegroundColor Cyan
    Set-Location $ProjectRoot
    
    # 使用 PM2 启动
    if (Test-Path "ecosystem.config.cjs") {
        pm2 start ecosystem.config.cjs
        pm2 save
        Write-Host "[OK] 服务已启动" -ForegroundColor Green
        Write-Host "`n查看服务状态: pm2 status" -ForegroundColor Yellow
        Write-Host "查看日志: pm2 logs" -ForegroundColor Yellow
    } else {
        Write-Host "[错误] 找不到 ecosystem.config.cjs" -ForegroundColor Red
    }
}

# 主流程
switch ($Action) {
    "install" {
        if (Check-NodeJS) {
            Check-PM2
            Install-Dependencies
            Setup-Environment
        }
    }
    "start" {
        Start-Services
    }
    "all" {
        if (Check-NodeJS) {
            Check-PM2
            Install-Dependencies
            Setup-Environment
            Start-Services
        }
    }
    default {
        Write-Host "未知操作: $Action" -ForegroundColor Red
        Write-Host "可用操作: install, start, all" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  部署完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan