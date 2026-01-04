#!/bin/bash

# Script para iniciar todos los servicios del sistema ML
# Ejecutar desde la raíz del proyecto: ./scripts/start-ml-services.sh

echo "🚀 Iniciando servicios del sistema de clasificación ML..."

# Verificar requisitos
echo ""
echo "📋 Verificando requisitos..."

# Verificar Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js instalado: $(node --version)"
else
    echo "✗ Node.js no encontrado. Por favor instala Node.js ≥18.0.0"
    exit 1
fi

# Verificar pnpm
if command -v pnpm &> /dev/null; then
    echo "✓ pnpm instalado: $(pnpm --version)"
else
    echo "✗ pnpm no encontrado. Instalando..."
    npm install -g pnpm
fi

# Verificar Python
if command -v python3 &> /dev/null; then
    echo "✓ Python instalado: $(python3 --version)"
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    echo "✓ Python instalado: $(python --version)"
    PYTHON_CMD=python
else
    echo "✗ Python no encontrado. Por favor instala Python ≥3.9"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Instalando dependencias del monorepo..."
    pnpm install
fi

if [ ! -d "apps/ml-service/venv" ]; then
    echo ""
    echo "🐍 Creando entorno virtual Python..."
    cd apps/ml-service
    $PYTHON_CMD -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../..
else
    echo "✓ Entorno Python ya existe"
fi

# Verificar archivos .env
echo ""
echo "⚙️ Verificando configuración..."

if [ ! -f "apps/backend/.env" ]; then
    echo "⚠️ Creando apps/backend/.env desde .env.example"
    cp apps/backend/.env.example apps/backend/.env
fi

if [ ! -f "apps/ml-service/.env" ]; then
    echo "⚠️ Creando apps/ml-service/.env desde .env.example"
    cp apps/ml-service/.env.example apps/ml-service/.env
fi

# Crear directorios necesarios
mkdir -p apps/ml-service/models
mkdir -p apps/ml-service/uploads
mkdir -p apps/ml-service/temp

echo ""
echo "✅ Todo listo. Iniciando servicios..."
echo ""
echo "📍 URLs de los servicios:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   ML API:   http://localhost:8000"
echo ""
echo "⏹️ Presiona Ctrl+C para detener todos los servicios"
echo ""

# Iniciar todos los servicios usando concurrently
pnpm run full-stack
