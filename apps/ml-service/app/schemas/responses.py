"""Esquemas de respuesta de la API"""

from pydantic import BaseModel
from typing import Dict, Optional, List


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool


class ClassificationResponse(BaseModel):
    success: bool
    filename: str
    predicted_class: str
    confidence: float
    all_probabilities: Dict[str, float]
    metadata: Optional[Dict] = None
    requires_review: bool


class BatchClassificationResult(BaseModel):
    filename: str
    predicted_class: Optional[str] = None
    confidence: Optional[float] = None
    success: bool
    error: Optional[str] = None


class BatchClassificationResponse(BaseModel):
    results: List[BatchClassificationResult]
    total: int
