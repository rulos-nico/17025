# Guía de Inicio Rápido - Sistema de Clasificación ML/DL

Este documento te ayudará a poner en marcha el sistema de clasificación de documentos con Machine Learning.

## ⚡ Inicio Rápido (3 pasos)

### Paso 1: Instalar Dependencias del Monorepo

```bash
# En la raíz del proyecto
pnpm install
```

### Paso 2: Instalar Dependencias Python (Servicio ML)

```bash
# Opción A: Usar el script del monorepo
pnpm run ml:install

# Opción B: Manual
cd apps/ml-service
pip install -r requirements.txt
cd ../..
```

### Paso 3: Configurar Variables de Entorno

```bash
# Backend
cd apps/backend
cp .env.example .env
# Editar .env si es necesario (valores por defecto funcionan)

# Servicio ML
cd ../ml-service
cp .env.example .env
# Editar .env si es necesario
```

## 🚀 Ejecutar el Sistema

### Opción A: Todo en uno (Recomendado para desarrollo)

```bash
# Desde la raíz, ejecutar todo el stack
pnpm run full-stack
```

Esto iniciará:
- ✅ Frontend (React) → http://localhost:5173
- ✅ Backend (Node.js) → http://localhost:3000
- ✅ Servicio ML (Python) → http://localhost:8000

### Opción B: Servicios individuales

```bash
# Terminal 1: Frontend
pnpm run dev

# Terminal 2: Backend
pnpm run dev:backend

# Terminal 3: Servicio ML
pnpm run ml:start
```

### Opción C: Solo servicios backend (si ya tienes frontend corriendo)

```bash
pnpm run services:start
```

## 🧪 Probar el Sistema

### 1. Verificar que los servicios estén corriendo

```bash
# Verificar servicio ML
curl http://localhost:8000

# Verificar backend
curl http://localhost:3000/health
```

### 2. Desde el navegador

1. Abrir http://localhost:5173
2. Navegar a `/clasificador` (o donde hayas integrado el componente)
3. Subir un documento PDF, DOCX o imagen
4. Ver la clasificación automática

### 3. Probar la API directamente

```bash
# Clasificar un documento con curl
curl -X POST "http://localhost:3000/api/documents/classify" \
  -F "file=@/ruta/a/documento.pdf" \
  -F "extract_metadata=true"
```

## 📋 Scripts Disponibles

### En la raíz del monorepo:

```bash
# Desarrollo
pnpm dev              # Solo frontend
pnpm dev:backend      # Solo backend
pnpm dev:all          # Todos los workspaces
pnpm full-stack       # Frontend + Backend + ML

# ML
pnpm ml:install       # Instalar deps Python
pnpm ml:start         # Iniciar servicio ML

# Build
pnpm build            # Build todos los paquetes
pnpm build:frontend   # Build frontend
pnpm build:backend    # Build backend

# Utilidades
pnpm preview          # Preview build frontend
pnpm lint             # Lint todo
pnpm clean            # Limpiar node_modules y dist
```

### En apps/ml-service:

```bash
python main.py                    # Iniciar servicio
python scripts/train_model.py    # Entrenar modelo (cuando exista)
pip install -r requirements.txt   # Instalar dependencias
```

### En apps/backend:

```bash
pnpm dev              # Desarrollo con nodemon
pnpm start            # Producción
pnpm test             # Tests (cuando existan)
```

## 🔧 Requisitos del Sistema

### Software necesario:

- **Node.js** ≥ 18.0.0
- **pnpm** ≥ 8.0.0
- **Python** ≥ 3.9
- **Tesseract OCR** (opcional, solo para OCR en imágenes)

### Instalar requisitos:

#### Windows:

```powershell
# Node.js y pnpm
winget install OpenJS.NodeJS
npm install -g pnpm

# Python
winget install Python.Python.3.11

# Tesseract (opcional)
# Descargar de: https://github.com/UB-Mannheim/tesseract/wiki
```

#### Linux/Mac:

```bash
# Node.js y pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Python (si no está instalado)
sudo apt-get install python3 python3-pip

# Tesseract (opcional)
sudo apt-get install tesseract-ocr tesseract-ocr-spa
```

## 🐛 Solución de Problemas Comunes

### Error: "comando python no encontrado"

```bash
# Usar python3 en lugar de python
python3 main.py

# O crear alias
alias python=python3
```

### Error: "pip: command not found"

```bash
# Instalar pip
python -m ensurepip --upgrade
```

### Error: "No se pudo conectar al servicio ML"

1. Verificar que el servicio ML esté corriendo: `curl http://localhost:8000`
2. Verificar la variable `ML_SERVICE_URL` en `apps/backend/.env`
3. Verificar firewall/antivirus

### Error: "Port 8000 already in use"

```bash
# Encontrar el proceso
netstat -ano | findstr :8000

# Matar el proceso (Windows)
taskkill /PID <PID> /F

# En Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Modelo no cargado / Baja precisión

El modelo incluido es solo una demostración. Para obtener buenos resultados:

1. Recolectar documentos reales del laboratorio
2. Organizarlos por categoría
3. Entrenar el modelo con tus datos
4. Guardar el modelo entrenado en `apps/ml-service/models/`

## 📊 Verificar que Todo Funciona

### Checklist:

- [ ] `pnpm install` sin errores
- [ ] `pnpm run ml:install` exitoso
- [ ] Frontend carga en http://localhost:5173
- [ ] Backend responde en http://localhost:3000/health
- [ ] Servicio ML responde en http://localhost:8000
- [ ] Puedo subir un archivo PDF y obtener clasificación
- [ ] Las probabilidades suman ~100%
- [ ] Los metadatos se extraen correctamente

## 🎯 Próximos Pasos

1. **Entrenar con datos reales**: Recolectar documentos del laboratorio
2. **Integrar con Google Drive**: Guardar clasificaciones automáticamente
3. **Agregar al menú**: Añadir enlace en el sidebar
4. **Configurar base de datos**: Guardar historial de clasificaciones
5. **Desplegar**: Configurar en producción con Docker

## 📚 Documentación Adicional

- [Documentación completa de ML](./clasificacion-documentos-ml.md)
- [Arquitectura del monorepo](./arquitectura-monorepo.md)
- [API del servicio ML](../apps/ml-service/README.md)
- [API del backend](../apps/backend/README.md)

## 💬 ¿Necesitas Ayuda?

Si tienes problemas:

1. Revisa los logs en las terminales
2. Verifica que todos los servicios estén corriendo
3. Consulta la sección de troubleshooting en la documentación completa
4. Revisa los archivos `.env.example` para configuración correcta

¡Listo para clasificar documentos con IA! 🚀🤖
