"""
Modelo de clasificación de documentos
Soporta TensorFlow/Keras y PyTorch
"""

import os
import numpy as np
import joblib
from typing import Dict, List, Optional
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder

from app.config import settings


class DocumentClassifier:
    """Clasificador de documentos usando Deep Learning"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.label_encoder = None
        self.load_models()
    
    def load_models(self):
        """Cargar modelo y componentes entrenados"""
        try:
            if os.path.exists(settings.MODEL_PATH):
                self.model = keras.models.load_model(settings.MODEL_PATH)
                print(f"✓ Modelo cargado desde {settings.MODEL_PATH}")
            else:
                print(f"⚠ No se encontró modelo en {settings.MODEL_PATH}")
                print("  Se usará un modelo por defecto o debe entrenarse uno nuevo")
                self._create_default_model()
            
            if os.path.exists(settings.TOKENIZER_PATH):
                self.tokenizer = joblib.load(settings.TOKENIZER_PATH)
                print(f"✓ Tokenizer cargado")
            
            if os.path.exists(settings.LABEL_ENCODER_PATH):
                self.label_encoder = joblib.load(settings.LABEL_ENCODER_PATH)
                print(f"✓ Label encoder cargado")
            else:
                # Crear encoder con categorías por defecto
                self.label_encoder = LabelEncoder()
                self.label_encoder.fit(settings.DOCUMENT_CATEGORIES)
                
        except Exception as e:
            print(f"Error cargando modelos: {e}")
            self._create_default_model()
    
    def _create_default_model(self):
        """Crear modelo básico para demostración"""
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout, Bidirectional
        
        vocab_size = 10000
        embedding_dim = 128
        max_length = settings.MAX_SEQUENCE_LENGTH
        num_classes = len(settings.DOCUMENT_CATEGORIES)
        
        model = Sequential([
            Embedding(vocab_size, embedding_dim, input_length=max_length),
            Bidirectional(LSTM(64, return_sequences=True)),
            Dropout(0.5),
            Bidirectional(LSTM(32)),
            Dropout(0.5),
            Dense(64, activation='relu'),
            Dropout(0.5),
            Dense(num_classes, activation='softmax')
        ])
        
        model.compile(
            loss='categorical_crossentropy',
            optimizer='adam',
            metrics=['accuracy']
        )
        
        self.model = model
        print("✓ Modelo por defecto creado (debe entrenarse con datos reales)")
    
    def predict(self, text: str, use_numerical_features: bool = True) -> Dict:
        """
        Clasificar un documento
        
        Args:
            text: Texto del documento
            use_numerical_features: Usar features numéricas extraídas
            
        Returns:
            Diccionario con clase predicha, confianza, probabilidades y números extraídos
        """
        if self.model is None:
            raise ValueError("Modelo no cargado")
        
        # Preprocesar texto CON extracción de números
        from app.utils.text_preprocessor import TextPreprocessor
        preprocessor = TextPreprocessor()
        
        processed_text, extracted_numbers, numerical_features, validation = preprocessor.preprocess(
            text,
            create_features=use_numerical_features,
            validate=True
        )
        
        # Tokenizar texto preprocesado
        if self.tokenizer:
            sequences = self.tokenizer.texts_to_sequences([processed_text])
            padded = pad_sequences(sequences, maxlen=settings.MAX_SEQUENCE_LENGTH)
        else:
            # Fallback simple si no hay tokenizer
            padded = self._simple_preprocess(processed_text)
        
        # Predecir con red neuronal
        predictions = self.model.predict(padded, verbose=0)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        
        # Obtener clase
        if self.label_encoder:
            predicted_class = self.label_encoder.classes_[predicted_idx]
        else:
            predicted_class = settings.DOCUMENT_CATEGORIES[predicted_idx]
        
        # Todas las probabilidades
        all_probs = {}
        for idx, prob in enumerate(predictions[0]):
            if self.label_encoder:
                category = self.label_encoder.classes_[idx]
            else:
                category = settings.DOCUMENT_CATEGORIES[idx] if idx < len(settings.DOCUMENT_CATEGORIES) else f"class_{idx}"
            all_probs[category] = float(prob)
        
        # Análisis adicional basado en números
        number_based_scores = preprocessor.analyze_document_type_by_numbers(extracted_numbers)
        
        # Combinar predicción del modelo con análisis de números
        # (opcional: ajustar probabilidades con reglas basadas en números)
        combined_probs = all_probs.copy()
        for category, score in number_based_scores.items():
            if category in combined_probs and score > 0:
                # Dar 20% de peso al análisis numérico
                combined_probs[category] = 0.8 * combined_probs[category] + 0.2 * score
        
        # Renormalizar
        total = sum(combined_probs.values())
        if total > 0:
            combined_probs = {k: v/total for k, v in combined_probs.items()}
        
        # Recalcular clase y confianza con probabilidades combinadas
        final_predicted_idx = max(range(len(list(combined_probs.values()))), 
                                  key=lambda i: list(combined_probs.values())[i])
        final_predicted_class = list(combined_probs.keys())[final_predicted_idx]
        final_confidence = list(combined_probs.values())[final_predicted_idx]
        
        return {
            "class": final_predicted_class,
            "confidence": float(final_confidence),
            "probabilities": combined_probs,
            "extracted_numbers": extracted_numbers,  # Números reales extraídos
            "numerical_features": numerical_features.tolist() if numerical_features is not None else None,
            "validation": validation,  # Resultados de validación
            "number_analysis": number_based_scores  # Análisis basado en números
        }
    
    def _simple_preprocess(self, text: str) -> np.ndarray:
        """Preprocesamiento simple sin tokenizer"""
        # Convertir texto a secuencia numérica básica
        words = text.lower().split()
        sequence = [hash(word) % 10000 for word in words[:settings.MAX_SEQUENCE_LENGTH]]
        padded = np.zeros((1, settings.MAX_SEQUENCE_LENGTH))
        padded[0, :len(sequence)] = sequence
        return padded
    
    async def train(self, training_data_path: str, epochs: int = 10):
        """Entrenar el modelo con nuevos datos"""
        # Implementar lógica de entrenamiento
        # Cargar datos, preparar, entrenar y guardar modelo
        raise NotImplementedError("Implementar lógica de entrenamiento")
    
    def is_loaded(self) -> bool:
        """Verificar si el modelo está cargado"""
        return self.model is not None
    
    def get_categories(self) -> List[str]:
        """Obtener todas las categorías disponibles"""
        if self.label_encoder:
            return self.label_encoder.classes_.tolist()
        return settings.DOCUMENT_CATEGORIES
    
    def save_model(self, path: Optional[str] = None):
        """Guardar modelo y componentes"""
        if path is None:
            path = settings.MODEL_PATH
        
        self.model.save(path)
        
        if self.tokenizer:
            joblib.dump(self.tokenizer, settings.TOKENIZER_PATH)
        
        if self.label_encoder:
            joblib.dump(self.label_encoder, settings.LABEL_ENCODER_PATH)
        
        print(f"✓ Modelo guardado en {path}")
