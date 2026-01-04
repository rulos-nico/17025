"""
Servicio de clasificación de documentos usando ML/DL
FastAPI REST API para clasificar documentos del laboratorio ISO 17025
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

from app.models.classifier import DocumentClassifier
from app.schemas.responses import ClassificationResponse, HealthResponse
from app.utils.document_processor import DocumentProcessor
from app.config import settings

# Cargar variables de entorno
load_dotenv()

# Inicializar aplicación
app = FastAPI(
    title="ISO 17025 - Document Classification Service",
    description="Servicio de clasificación automática de documentos de laboratorio",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend y Backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar componentes
classifier = DocumentClassifier()
document_processor = DocumentProcessor()


@app.get("/", response_model=HealthResponse)
async def health_check():
    """Verificar estado del servicio"""
    return {
        "status": "healthy",
        "service": "Document Classification Service",
        "version": "1.0.0",
        "model_loaded": classifier.is_loaded()
    }


@app.post("/api/classify", response_model=ClassificationResponse)
async def classify_document(
    file: UploadFile = File(...),
    extract_metadata: bool = True
):
    """
    Clasificar un documento y extraer información relevante
    
    Args:
        file: Archivo a clasificar (PDF, DOCX, TXT, PNG, JPG)
        extract_metadata: Si se debe extraer metadatos adicionales
        
    Returns:
        Clasificación del documento con probabilidades y metadatos
    """
    try:
        # Validar tipo de archivo
        allowed_extensions = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg']
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no soportado. Permitidos: {', '.join(allowed_extensions)}"
            )
        
        # Procesar documento
        text_content = await document_processor.extract_text(file)
        
        # Clasificar
        prediction = classifier.predict(text_content)
        
        # Extraer metadatos adicionales si se solicita
        metadata = None
        if extract_metadata:
            metadata = await document_processor.extract_metadata(file, text_content)
        
        return {
            "success": True,
            "filename": file.filename,
            "predicted_class": prediction["class"],
            "confidence": prediction["confidence"],
            "all_probabilities": prediction["probabilities"],
            "metadata": metadata,
            "requires_review": prediction["confidence"] < settings.CONFIDENCE_THRESHOLD
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/classify-batch")
async def classify_batch(files: List[UploadFile] = File(...)):
    """Clasificar múltiples documentos en lote"""
    results = []
    
    for file in files:
        try:
            text_content = await document_processor.extract_text(file)
            prediction = classifier.predict(text_content)
            
            results.append({
                "filename": file.filename,
                "predicted_class": prediction["class"],
                "confidence": prediction["confidence"],
                "success": True
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e),
                "success": False
            })
    
    return {"results": results, "total": len(files)}


@app.post("/api/train")
async def retrain_model(
    training_data_path: str,
    epochs: int = 10
):
    """
    Reentrenar el modelo con nuevos datos
    (Endpoint protegido - implementar autenticación)
    """
    try:
        await classifier.train(training_data_path, epochs)
        return {"message": "Modelo reentrenado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories")
async def get_categories():
    """Obtener todas las categorías disponibles"""
    return {
        "categories": classifier.get_categories(),
        "count": len(classifier.get_categories())
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )
