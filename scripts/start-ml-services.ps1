# Script para iniciar todos los servicios del sistema ML
# Ejecutar desde la raíz del proyecto

Write-Host "🚀 Iniciando servicios del sistema de clasificación ML..." -ForegroundColor Green

# Verificar requisitos
Write-Host "`n📋 Verificando requisitos..." -ForegroundColor Yellow

# Verificar Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js no encontrado. Por favor instala Node.js ≥18.0.0" -ForegroundColor Red
    exit 1
}

# Verificar pnpm
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $pnpmVersion = pnpm --version
    Write-Host "✓ pnpm instalado: $pnpmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ pnpm no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Verificar Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonVersion = python --version
    Write-Host "✓ Python instalado: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python no encontrado. Por favor instala Python ≥3.9" -ForegroundColor Red
    exit 1
}

# Instalar dependencias si no existen
if (-Not (Test-Path "node_modules")) {
    Write-Host "`n📦 Instalando dependencias del monorepo..." -ForegroundColor Yellow
    pnpm install
}

if (-Not (Test-Path "apps/ml-service/venv")) {
    Write-Host "`n🐍 Creando entorno virtual Python..." -ForegroundColor Yellow
    cd apps/ml-service
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    cd ../..
} else {
    Write-Host "✓ Entorno Python ya existe" -ForegroundColor Green
}

# Verificar archivos .env
Write-Host "`n⚙️ Verificando configuración..." -ForegroundColor Yellow

if (-Not (Test-Path "apps/backend/.env")) {
    Write-Host "⚠️ Creando apps/backend/.env desde .env.example" -ForegroundColor Yellow
    Copy-Item "apps/backend/.env.example" "apps/backend/.env"
}

if (-Not (Test-Path "apps/ml-service/.env")) {
    Write-Host "⚠️ Creando apps/ml-service/.env desde .env.example" -ForegroundColor Yellow
    Copy-Item "apps/ml-service/.env.example" "apps/ml-service/.env"
}

# Crear directorios necesarios
if (-Not (Test-Path "apps/ml-service/models")) {
    New-Item -Path "apps/ml-service/models" -ItemType Directory | Out-Null
}
if (-Not (Test-Path "apps/ml-service/uploads")) {
    New-Item -Path "apps/ml-service/uploads" -ItemType Directory | Out-Null
}
if (-Not (Test-Path "apps/ml-service/temp")) {
    New-Item -Path "apps/ml-service/temp" -ItemType Directory | Out-Null
}

Write-Host "`n✅ Todo listo. Iniciando servicios..." -ForegroundColor Green
Write-Host "`n📍 URLs de los servicios:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   ML API:   http://localhost:8000" -ForegroundColor White
Write-Host "`n⏹️ Presiona Ctrl+C para detener todos los servicios`n" -ForegroundColor Yellow

# Iniciar todos los servicios usando concurrently
pnpm run full-stack
