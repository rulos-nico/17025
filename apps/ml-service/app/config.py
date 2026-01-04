"""Configuración del servicio ML"""

import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Servidor
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Modelos
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models/document_classifier_model.h5")
    TOKENIZER_PATH: str = os.getenv("TOKENIZER_PATH", "./models/tokenizer.pkl")
    LABEL_ENCODER_PATH: str = os.getenv("LABEL_ENCODER_PATH", "./models/label_encoder.pkl")
    
    # Clasificación
    MAX_SEQUENCE_LENGTH: int = int(os.getenv("MAX_SEQUENCE_LENGTH", "512"))
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "32"))
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.7"))
    
    # Categorías de documentos ISO 17025
    DOCUMENT_CATEGORIES: List[str] = [
        "informe_ensayo",
        "certificado_calibracion",
        "procedimiento",
        "registro",
        "protocolo",
        "oferta",
        "contrato",
        "plan_calidad",
        "otro"
    ]
    
    # Directorios
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    TEMP_DIR: str = os.getenv("TEMP_DIR", "./temp")
    
    class Config:
        env_file = ".env"


settings = Settings()
