# Backend API - Laboratorio ISO 17025

Backend Node.js con Express que actúa como intermediario entre el frontend React y el servicio de ML/DL.

## 🚀 Características

- API REST con Express
- Proxy para servicio ML de clasificación
- Validación de archivos con Multer
- Manejo centralizado de errores
- CORS configurado para desarrollo

## 🛠️ Instalación

```bash
cd apps/backend
npm install
# o
pnpm install
```

## ⚙️ Configuración

```bash
cp .env.example .env
# Editar .env
```

Variables importantes:
- `ML_SERVICE_URL`: URL del servicio ML (default: http://localhost:8000)
- `PORT`: Puerto del backend (default: 3000)
- `MAX_FILE_SIZE`: Tamaño máximo de archivo en bytes

## 🏃 Ejecutar

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📡 Endpoints

### Health Check
```http
GET /health
```

### Clasificar Documento
```http
POST /api/documents/classify
Content-Type: multipart/form-data

file: [archivo]
extract_metadata: true
```

### Clasificar Múltiples
```http
POST /api/documents/classify-batch
Content-Type: multipart/form-data

files: [archivo1, archivo2, ...]
```

### Obtener Categorías
```http
GET /api/documents/categories
```

### Guardar Clasificación
```http
POST /api/documents/save-classification
Content-Type: application/json

{
  "filename": "doc.pdf",
  "predicted_class": "informe_ensayo",
  "confidence": 0.95
}
```

## 🔗 Integración

El backend se comunica con:
1. **Frontend React** (puerto 5173) - Recibe peticiones
2. **Servicio ML Python** (puerto 8000) - Clasifica documentos

## 📝 Estructura

```
apps/backend/
├── src/
│   ├── server.js              # Punto de entrada
│   ├── routes/
│   │   └── documentRoutes.js  # Rutas de documentos
│   ├── services/
│   │   └── mlService.js       # Cliente del servicio ML
│   └── middleware/
│       └── errorHandler.js    # Manejo de errores
├── package.json
└── .env.example
```
