# Servicio de Clasificación de Documentos ML/DL

Microservicio Python con FastAPI para clasificación automática de documentos del laboratorio ISO 17025.

## 🚀 Características

- **Clasificación automática** de documentos en 8+ categorías
- **Soporte múltiples formatos**: PDF, DOCX, TXT, imágenes (PNG, JPG)
- **OCR integrado** con Tesseract para documentos escaneados
- **Extracción de metadatos** específicos ISO 17025
- **API REST** con FastAPI
- **Procesamiento por lotes**
- **Modelo reentrenable**

## 📋 Categorías de Documentos

1. Informe de Ensayo
2. Certificado de Calibración
3. Procedimiento
4. Registro
5. Protocolo
6. Oferta
7. Contrato
8. Plan de Calidad
9. Otro

## 🛠️ Instalación

### Requisitos Previos

- Python 3.9+
- Tesseract OCR (opcional, para imágenes)

### Instalar Dependencias

```bash
cd apps/ml-service
pip install -r requirements.txt
```

### Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### Instalar Tesseract (Opcional)

**Windows:**
```bash
# Descargar de: https://github.com/UB-Mannheim/tesseract/wiki
# Instalar y agregar a PATH
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-spa
```

## 🏃 Ejecutar

### Desarrollo

```bash
python main.py
```

O con uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Producción con Docker

```bash
docker build -t ml-service .
docker run -p 8000:8000 ml-service
```

## 📡 API Endpoints

### Health Check
```http
GET /
```

### Clasificar Documento
```http
POST /api/classify
Content-Type: multipart/form-data

file: [archivo]
extract_metadata: true
```

**Respuesta:**
```json
{
  "success": true,
  "filename": "informe_001.pdf",
  "predicted_class": "informe_ensayo",
  "confidence": 0.95,
  "all_probabilities": {
    "informe_ensayo": 0.95,
    "certificado_calibracion": 0.03,
    "procedimiento": 0.02
  },
  "metadata": {
    "codigo_documento": "LAB-2025-001",
    "fechas_encontradas": ["15/01/2025"]
  },
  "requires_review": false
}
```

### Clasificación por Lotes
```http
POST /api/classify-batch
Content-Type: multipart/form-data

files: [archivo1, archivo2, ...]
```

### Obtener Categorías
```http
GET /api/categories
```

## 🧠 Entrenar Modelo

### Preparar Datos

Organizar datos de entrenamiento:
```
training_data/
├── informe_ensayo/
│   ├── doc1.pdf
│   ├── doc2.pdf
├── certificado_calibracion/
│   ├── cert1.pdf
├── procedimiento/
│   ├── proc1.docx
```

### Entrenar

```python
# Script de entrenamiento
python scripts/train_model.py --data-path ./training_data --epochs 20
```

## 🔗 Integración con el Backend

El servicio se comunica con el backend Node.js a través de HTTP:

```javascript
// Backend llama al servicio ML
const response = await fetch('http://localhost:8000/api/classify', {
  method: 'POST',
  body: formData
});
```

## 📊 Arquitectura del Modelo

- **Embeddings**: Word embeddings pre-entrenados o TF-IDF
- **Red Neuronal**: Bi-LSTM con Dropout
- **Clasificador**: Softmax multi-clase
- **Framework**: TensorFlow/Keras (fácil cambiar a PyTorch)

## 🔧 Personalización

### Agregar Nuevas Categorías

1. Actualizar `DOCUMENT_CATEGORIES` en `.env`
2. Preparar datos de entrenamiento
3. Reentrenar modelo

### Cambiar a PyTorch

1. Modificar `requirements.txt`: comentar TensorFlow, descomentar PyTorch
2. Actualizar `app/models/classifier.py` con implementación PyTorch

## 📈 Mejoras Futuras

- [ ] Usar modelos pre-entrenados (BERT, RoBERTa)
- [ ] Active Learning para mejorar clasificación
- [ ] Extracción de entidades (NER)
- [ ] API para feedback de usuarios
- [ ] Dashboard de métricas
- [ ] Versionado de modelos (MLflow)

## 🐛 Troubleshooting

**Error: Tesseract not found**
- Instalar Tesseract OCR y agregar a PATH

**Error: Model not loaded**
- Verificar que existe `models/document_classifier_model.h5`
- O entrenar un nuevo modelo

**Baja precisión**
- Aumentar datos de entrenamiento
- Ajustar hiperparámetros
- Usar modelos pre-entrenados

## 📝 Licencia

MIT
