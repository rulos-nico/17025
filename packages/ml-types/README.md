# @lab17025/ml-types

Tipos, constantes y validadores compartidos para el sistema de clasificación de documentos ML/DL.

## 📦 Instalación

Este paquete es parte del monorepo y se enlaza automáticamente.

```bash
# En apps/frontend/package.json o apps/backend/package.json
{
  "dependencies": {
    "@lab17025/ml-types": "workspace:*"
  }
}
```

## 🚀 Uso

### Importar constantes

```javascript
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_NAMES,
  CATEGORY_COLORS,
  FILE_CONFIG,
  CONFIDENCE_THRESHOLDS
} from '@lab17025/ml-types';

// Usar categorías
const category = DOCUMENT_CATEGORIES.INFORME_ENSAYO;
const displayName = CATEGORY_NAMES[category]; // "Informe de Ensayo"
const color = CATEGORY_COLORS[category]; // "#4CAF50"
```

### Validar archivos

```javascript
import { validateFile, validateBatch, requiresReview } from '@lab17025/ml-types';

// Validar un archivo
const validation = validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
}

// Validar lote
const batchValidation = validateBatch(files);

// Verificar si requiere revisión
const needsReview = requiresReview(0.65); // true
```

### Formatear datos

```javascript
import { formatFileSize, getConfidenceLevel } from '@lab17025/ml-types';

const size = formatFileSize(1024000); // "1000 KB"
const level = getConfidenceLevel(0.85); // "medium"
```

## 📋 Constantes Disponibles

### Categorías de Documentos
- `DOCUMENT_CATEGORIES` - Enumeración de categorías
- `CATEGORY_NAMES` - Nombres amigables
- `CATEGORY_COLORS` - Colores por categoría
- `CATEGORY_DESCRIPTIONS` - Descripciones

### Configuración de Archivos
- `FILE_CONFIG` - Límites y restricciones
- `SUPPORTED_FILE_TYPES` - Tipos MIME soportados
- `ALLOWED_EXTENSIONS` - Extensiones permitidas

### Umbrales
- `CONFIDENCE_THRESHOLDS` - Umbrales de confianza

### Estados
- `CLASSIFICATION_STATUS` - Estados de clasificación

### Endpoints
- `API_ENDPOINTS` - Rutas de la API

## 🔧 Funciones de Validación

- `validateFile(file)` - Validar archivo individual
- `validateBatch(files)` - Validar lote de archivos
- `validateClassificationResult(result)` - Validar resultado
- `requiresReview(confidence)` - Verificar si requiere revisión
- `getConfidenceLevel(confidence)` - Obtener nivel de confianza
- `formatFileSize(bytes)` - Formatear tamaño
- `isValidCategory(category, validCategories)` - Validar categoría
- `sanitizeFilename(filename)` - Sanitizar nombre de archivo
