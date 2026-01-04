"""
Modelo híbrido que combina texto tokenizado con features numéricas
Para clasificación más precisa usando ambas fuentes de información
"""

import numpy as np
from tensorflow import keras
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, Embedding, LSTM, Dense, Dropout, 
    Bidirectional, Concatenate, BatchNormalization
)


def create_hybrid_model(
    vocab_size: int = 10000,
    embedding_dim: int = 128,
    max_sequence_length: int = 512,
    num_numerical_features: int = 33,  # Del preprocessor
    num_classes: int = 9
):
    """
    Crear modelo híbrido: Texto + Números
    
    Arquitectura:
    - Branch 1: LSTM para texto tokenizado
    - Branch 2: Dense layers para features numéricas
    - Concatenar ambos branches
    - Clasificación final
    """
    
    # BRANCH 1: Procesamiento de TEXTO
    text_input = Input(shape=(max_sequence_length,), name='text_input')
    
    # Embeddings
    text_embedded = Embedding(
        vocab_size, 
        embedding_dim, 
        input_length=max_sequence_length,
        name='embedding'
    )(text_input)
    
    # Bi-LSTM para capturar contexto
    text_lstm1 = Bidirectional(
        LSTM(64, return_sequences=True),
        name='bilstm_1'
    )(text_embedded)
    text_dropout1 = Dropout(0.5)(text_lstm1)
    
    text_lstm2 = Bidirectional(
        LSTM(32),
        name='bilstm_2'
    )(text_dropout1)
    text_dropout2 = Dropout(0.5)(text_lstm2)
    
    text_dense = Dense(64, activation='relu', name='text_dense')(text_dropout2)
    text_output = Dropout(0.3)(text_dense)
    
    # BRANCH 2: Procesamiento de NÚMEROS
    numerical_input = Input(shape=(num_numerical_features,), name='numerical_input')
    
    # Normalización
    numerical_normalized = BatchNormalization(name='batch_norm')(numerical_input)
    
    # Capas densas para features numéricas
    numerical_dense1 = Dense(32, activation='relu', name='numerical_dense_1')(numerical_normalized)
    numerical_dropout1 = Dropout(0.3)(numerical_dense1)
    
    numerical_dense2 = Dense(16, activation='relu', name='numerical_dense_2')(numerical_dropout1)
    numerical_output = Dropout(0.2)(numerical_dense2)
    
    # CONCATENAR ambos branches
    combined = Concatenate(name='concatenate')([text_output, numerical_output])
    
    # Capas de clasificación final
    combined_dense = Dense(64, activation='relu', name='combined_dense')(combined)
    combined_dropout = Dropout(0.3)(combined_dense)
    
    # Output layer
    output = Dense(num_classes, activation='softmax', name='output')(combined_dropout)
    
    # Crear modelo
    model = Model(
        inputs=[text_input, numerical_input],
        outputs=output,
        name='hybrid_document_classifier'
    )
    
    # Compilar
    model.compile(
        loss='categorical_crossentropy',
        optimizer='adam',
        metrics=['accuracy']
    )
    
    return model


# Ejemplo de uso
if __name__ == "__main__":
    # Crear modelo
    model = create_hybrid_model()
    
    print("=" * 60)
    print("MODELO HÍBRIDO - ARQUITECTURA")
    print("=" * 60)
    model.summary()
    
    print("\n" + "=" * 60)
    print("EJEMPLO DE PREDICCIÓN")
    print("=" * 60)
    
    # Datos de ejemplo
    text_input_example = np.random.randint(0, 10000, (1, 512))  # 1 documento tokenizado
    numerical_input_example = np.random.rand(1, 33)  # 1 vector de features numéricas
    
    # Predecir
    prediction = model.predict([text_input_example, numerical_input_example])
    
    print(f"\nPredicciones (probabilidades por clase):")
    print(prediction[0])
    print(f"\nClase predicha: {np.argmax(prediction[0])}")
    print(f"Confianza: {np.max(prediction[0]) * 100:.2f}%")
