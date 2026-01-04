# Sistema de Clasificación de Documentos con ML/DL

Sistema integrado de Machine Learning / Deep Learning para clasificación automática de documentos del laboratorio ISO 17025.

## 📐 Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  DocumentClassifier Component                              │ │
│  │  - Upload de archivos (drag & drop)                        │ │
│  │  - Visualización de resultados                             │ │
│  │  - Probabilidades por categoría                            │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │ documentClassificationService.js            │
└───────────────────┼─────────────────────────────────────────────┘
                    │ HTTP (fetch)
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API REST                                                  │ │
│  │  - /api/documents/classify                                 │ │
│  │  - /api/documents/classify-batch                           │ │
│  │  - /api/documents/categories                               │ │
│  │  - Validación con Multer                                   │ │
│  │  - Proxy para servicio ML                                  │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │ mlService.js (axios)                        │
└───────────────────┼─────────────────────────────────────────────┘
                    │ HTTP
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                 SERVICIO ML (Python/FastAPI)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Clasificador de Documentos                                │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  1. DocumentProcessor                                │ │ │
│  │  │     - Extracción de texto (PDF, DOCX, imágenes)      │ │ │
│  │  │     - OCR con Tesseract                              │ │ │
│  │  │     - Extracción de metadatos                        │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  2. Modelo Deep Learning                             │ │ │
│  │  │     - Embeddings + Bi-LSTM                           │ │ │
│  │  │     - Clasificación multi-clase (8+ categorías)      │ │ │
│  │  │     - TensorFlow/Keras                               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                        PAQUETES COMPARTIDOS                      │
│  - @lab17025/ml-types: Constantes y validadores                 │
│  - @lab17025/iso17025-utils: Utilidades del laboratorio         │
│  - @lab17025/shared-types: Tipos compartidos                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Características Principales

### 1. **Clasificación Automática**
- 8+ categorías de documentos ISO 17025
- Confianza medida (0-100%)
- Indicador de revisión manual cuando confianza < 70%

### 2. **Procesamiento Multi-formato**
- PDF (con pdfplumber y PyPDF2)
- DOCX (python-docx)
- TXT (texto plano)
- Imágenes (PNG, JPG) con OCR

### 3. **Extracción de Metadatos**
- Código de documento (ej: LAB-2025-001)
- Fechas encontradas
- Palabras clave relevantes
- Conteo de palabras/caracteres

### 4. **API REST Completa**
- Clasificación individual
- Clasificación por lotes (hasta 10 archivos)
- Endpoints de salud y categorías

### 5. **Interfaz Interactiva**
- Drag & drop de archivos
- Visualización de probabilidades
- Gráficas de confianza
- Responsive design

## 📂 Estructura del Proyecto

```
lab-iso17025-monorepo/
├── apps/
│   ├── ml-service/              ← 🧠 Servicio Python ML/DL
│   │   ├── app/
│   │   │   ├── models/
│   │   │   │   └── classifier.py       # Modelo de clasificación
│   │   │   ├── utils/
│   │   │   │   └── document_processor.py  # Procesador de docs
│   │   │   ├── schemas/
│   │   │   │   └── responses.py        # Esquemas Pydantic
│   │   │   └── config.py               # Configuración
│   │   ├── models/                     # Modelos entrenados (.h5, .pkl)
│   │   ├── main.py                     # Punto de entrada FastAPI
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── backend/                 ← 🔌 Backend Node.js
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   └── documentRoutes.js   # Rutas de documentos
│   │   │   ├── services/
│   │   │   │   └── mlService.js        # Cliente servicio ML
│   │   │   ├── middleware/
│   │   │   │   └── errorHandler.js     # Manejo de errores
│   │   │   └── server.js               # Servidor Express
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── frontend/                ← 🎨 Frontend React
│       ├── src/
│       │   ├── components/
│       │   │   └── DocumentClassifier/
│       │   │       ├── DocumentClassifier.js
│       │   │       └── DocumentClassifier.css
│       │   └── services/
│       │       └── documentClassificationService.js
│       └── ...
│
├── packages/
│   ├── ml-types/                ← 📦 Tipos compartidos ML
│   │   ├── constants.js
│   │   ├── validators.js
│   │   └── index.js
│   ├── iso17025-utils/
│   └── shared-types/
│
└── docs/
    ├── arquitectura-monorepo.md
    ├── clasificacion-documentos-ml.md  ← Este archivo
    └── ...
```

## 🚀 Instalación y Configuración

### 1. Servicio ML (Python)

```bash
cd apps/ml-service

# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env

# (Opcional) Instalar Tesseract OCR para imágenes
# Windows: https://github.com/UB-Mannheim/tesseract/wiki
# Linux: sudo apt-get install tesseract-ocr tesseract-ocr-spa

# Ejecutar
python main.py
```

El servicio estará disponible en: `http://localhost:8000`

### 2. Backend (Node.js)

```bash
cd apps/backend

# Instalar dependencias
pnpm install

# Configurar
cp .env.example .env
# Editar .env (especialmente ML_SERVICE_URL)

# Ejecutar en desarrollo
pnpm run dev
```

El backend estará en: `http://localhost:3000`

### 3. Frontend (React)

```bash
cd apps/frontend

# Agregar dependencia al paquete ml-types
pnpm add @lab17025/ml-types@workspace:*

# Crear archivo .env.local
echo "VITE_API_URL=http://localhost:3000" > .env.local

# Ejecutar
pnpm run dev
```

El frontend estará en: `http://localhost:5173`

### 4. Instalar paquetes compartidos

```bash
# Desde la raíz del monorepo
pnpm install
```

## 🔧 Uso del Sistema

### Desde el Frontend

1. **Acceder al componente de clasificación**
   ```javascript
   import DocumentClassifier from './components/DocumentClassifier/DocumentClassifier';
   
   function App() {
     return <DocumentClassifier />;
   }
   ```

2. **Subir documento**
   - Arrastrar y soltar en la zona indicada
   - O hacer clic para seleccionar archivo
   - Archivos permitidos: PDF, DOCX, TXT, PNG, JPG (máx 10MB)

3. **Ver resultados**
   - Categoría predicha con color distintivo
   - Nivel de confianza en %
   - Probabilidades de todas las categorías
   - Metadatos extraídos (código, fechas, etc.)
   - Advertencia si requiere revisión manual

### Desde el Backend (API)

```javascript
// Clasificar un documento
const formData = new FormData();
formData.append('file', file);
formData.append('extract_metadata', 'true');

const response = await fetch('http://localhost:3000/api/documents/classify', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "filename": "informe_001.pdf",
//   "predicted_class": "informe_ensayo",
//   "confidence": 0.95,
//   "all_probabilities": { ... },
//   "metadata": { ... },
//   "requires_review": false
// }
```

### Directamente al Servicio ML

```bash
# Usando curl
curl -X POST "http://localhost:8000/api/classify" \
  -F "file=@documento.pdf" \
  -F "extract_metadata=true"
```

## 🧠 Modelo de Machine Learning

### Arquitectura

```python
Entrada: Texto del documento
    ↓
Tokenización y padding (max_length=512)
    ↓
Embedding Layer (vocab_size=10000, dim=128)
    ↓
Bi-LSTM (64 units) → Dropout (0.5)
    ↓
Bi-LSTM (32 units) → Dropout (0.5)
    ↓
Dense (64, relu) → Dropout (0.5)
    ↓
Dense (num_classes, softmax)
    ↓
Salida: Probabilidades por categoría
```

### Entrenamiento

Para entrenar el modelo con tus propios datos:

1. **Preparar datos**
   ```
   training_data/
   ├── informe_ensayo/
   │   ├── doc1.pdf
   │   ├── doc2.pdf
   ├── certificado_calibracion/
   │   ├── cert1.pdf
   ├── procedimiento/
   │   ├── proc1.docx
   └── ...
   ```

2. **Crear script de entrenamiento**
   ```python
   # apps/ml-service/scripts/train_model.py
   from app.models.classifier import DocumentClassifier
   from app.utils.document_processor import DocumentProcessor
   
   # Cargar datos, preprocesar, entrenar
   # Guardar modelo entrenado
   ```

3. **Ejecutar entrenamiento**
   ```bash
   python scripts/train_model.py --data-path ./training_data --epochs 20
   ```

### Mejoras Futuras

- **Modelos pre-entrenados**: BERT, RoBERTa en español
- **Transfer Learning**: Fine-tuning de modelos existentes
- **Active Learning**: Mejorar con feedback de usuarios
- **NER**: Extracción de entidades (nombres, fechas, números)
- **Versionado**: MLflow para tracking de modelos

## 📊 Categorías de Documentos

| Categoría | Descripción | Color |
|-----------|-------------|-------|
| **Informe de Ensayo** | Resultados de ensayos realizados | 🟢 Verde |
| **Certificado de Calibración** | Calibración de equipos | 🔵 Azul |
| **Procedimiento** | Procedimientos y métodos | 🟠 Naranja |
| **Registro** | Formularios y registros | 🟣 Morado |
| **Protocolo** | Protocolos de validación | 🔵 Cyan |
| **Oferta** | Ofertas comerciales | 🟡 Amarillo |
| **Contrato** | Contratos | 🔴 Rojo |
| **Plan de Calidad** | Planes de gestión | 🔵 Índigo |
| **Otro** | Otros documentos | ⚪ Gris |

## 🔗 Integración con el Sistema Existente

### 1. Agregar ruta en el frontend

```javascript
// apps/frontend/src/App.js
import DocumentClassifier from './components/DocumentClassifier/DocumentClassifier';

// Agregar ruta
<Route path="/clasificador" element={<DocumentClassifier />} />
```

### 2. Agregar al menú de navegación

```javascript
// apps/frontend/src/components/Sidebar/Sidebar.js
const menuItems = [
  // ... items existentes
  {
    label: 'Clasificador ML',
    path: '/clasificador',
    icon: '🧠',
    roles: ['admin', 'responsable_tecnico']
  }
];
```

### 3. Integrar con Google Drive

```javascript
// Después de clasificar, subir a Drive
import { uploadToGoogleDrive } from '../../services/googleDriveService';

const result = await classifyDocument(file);
await uploadToGoogleDrive(file, result.predicted_class);
```

## 🐛 Troubleshooting

### Error: "No se pudo conectar al servicio ML"
- Verificar que el servicio ML esté ejecutándose en el puerto 8000
- Comprobar `ML_SERVICE_URL` en `.env` del backend

### Error: "Tesseract not found"
- Instalar Tesseract OCR
- Configurar ruta en `document_processor.py`

### Baja precisión del modelo
- Aumentar datos de entrenamiento
- Ajustar hiperparámetros
- Considerar modelos pre-entrenados

### Archivos grandes fallan
- Ajustar `MAX_FILE_SIZE` en configuración
- Implementar procesamiento en chunks

## 📈 Métricas y Monitoreo

### Métricas del Modelo
- Precisión (Accuracy)
- Precisión por clase (Precision)
- Recall por clase
- F1-Score
- Matriz de confusión

### Logs
```bash
# Servicio ML
tail -f apps/ml-service/logs/app.log

# Backend
tail -f apps/backend/logs/app.log
```

## 🚢 Despliegue en Producción

### Docker

```bash
# Construir servicio ML
cd apps/ml-service
docker build -t lab17025-ml-service .
docker run -p 8000:8000 lab17025-ml-service

# Construir backend
cd apps/backend
docker build -t lab17025-backend .
docker run -p 3000:3000 lab17025-backend
```

### Docker Compose

```yaml
version: '3.8'
services:
  ml-service:
    build: ./apps/ml-service
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
    volumes:
      - ./models:/app/models
  
  backend:
    build: ./apps/backend
    ports:
      - "3000:3000"
    environment:
      - ML_SERVICE_URL=http://ml-service:8000
    depends_on:
      - ml-service
```

## 📚 Referencias

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TensorFlow/Keras](https://www.tensorflow.org/)
- [ISO/IEC 17025](https://www.iso.org/standard/66912.html)
- [Document Classification with Deep Learning](https://arxiv.org/abs/1406.1078)

## 🤝 Contribuir

Para agregar nuevas categorías o mejorar el modelo:

1. Preparar datos de entrenamiento
2. Actualizar `DOCUMENT_CATEGORIES` en `packages/ml-types/constants.js`
3. Reentrenar modelo
4. Actualizar documentación

## 📝 Licencia

MIT
