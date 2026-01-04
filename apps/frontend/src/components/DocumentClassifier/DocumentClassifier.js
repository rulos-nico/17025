import React, { useState, useCallback } from 'react';
import {
  classifyDocument,
  validateFile,
  formatCategoryName,
  getCategoryColor
} from '../../services/documentClassificationService';
import './DocumentClassifier.css';

/**
 * Componente para clasificar documentos con ML/DL
 */
export default function DocumentClassifier() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    setError(null);
    setResult(null);

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClassify = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const classification = await classifyDocument(file, true);
      setResult(classification);
    } catch (err) {
      setError(err.message || 'Error al clasificar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="document-classifier">
      <h2>🧠 Clasificador de Documentos ML/DL</h2>
      <p className="subtitle">
        Sube un documento y nuestro modelo de machine learning lo clasificará automáticamente
      </p>

      {!result ? (
        <>
          {/* Zona de arrastre */}
          <div
            className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="file-info">
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            ) : (
              <>
                <div className="drop-icon">📁</div>
                <p>Arrastra un archivo aquí</p>
                <p className="drop-hint">o haz clic para seleccionar</p>
                <p className="drop-formats">PDF, DOCX, TXT, PNG, JPG (máx. 10MB)</p>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
              onChange={handleFileInputChange}
              className="file-input"
            />
          </div>

          {/* Botones de acción */}
          {file && (
            <div className="action-buttons">
              <button onClick={handleClassify} disabled={loading} className="btn-primary">
                {loading ? 'Clasificando...' : '🔍 Clasificar Documento'}
              </button>
              <button onClick={handleReset} className="btn-secondary">
                ❌ Cancelar
              </button>
            </div>
          )}
        </>
      ) : (
        /* Resultado de la clasificación */
        <div className="classification-result">
          <div className="result-header">
            <h3>✅ Clasificación Completada</h3>
            <button onClick={handleReset} className="btn-new">
              📄 Clasificar Otro
            </button>
          </div>

          <div className="result-card">
            <div className="result-main">
              <div
                className="category-badge"
                style={{ backgroundColor: getCategoryColor(result.predicted_class) }}
              >
                {formatCategoryName(result.predicted_class)}
              </div>
              <div className="confidence">
                <span className="confidence-label">Confianza:</span>
                <span className="confidence-value">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {result.requires_review && (
              <div className="review-warning">
                ⚠️ Confianza baja - Se recomienda revisión manual
              </div>
            )}

            {/* Probabilidades de todas las categorías */}
            <div className="probabilities">
              <h4>Probabilidades por categoría:</h4>
              <div className="probability-list">
                {Object.entries(result.all_probabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, prob]) => (
                    <div key={category} className="probability-item">
                      <span className="probability-label">
                        {formatCategoryName(category)}
                      </span>
                      <div className="probability-bar-container">
                        <div
                          className="probability-bar"
                          style={{
                            width: `${prob * 100}%`,
                            backgroundColor: getCategoryColor(category)
                          }}
                        />
                      </div>
                      <span className="probability-value">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Metadatos extraídos */}
            {result.metadata && (
              <div className="metadata">
                <h4>📋 Metadatos Extraídos:</h4>
                <dl className="metadata-list">
                  {result.metadata.codigo_documento && (
                    <>
                      <dt>Código:</dt>
                      <dd>{result.metadata.codigo_documento}</dd>
                    </>
                  )}
                  <dt>Palabras:</dt>
                  <dd>{result.metadata.word_count?.toLocaleString()}</dd>
                  <dt>Caracteres:</dt>
                  <dd>{result.metadata.text_length?.toLocaleString()}</dd>
                  {result.metadata.fechas_encontradas && (
                    <>
                      <dt>Fechas:</dt>
                      <dd>{result.metadata.fechas_encontradas.join(', ')}</dd>
                    </>
                  )}
                  {result.metadata.keywords_detected && (
                    <>
                      <dt>Keywords:</dt>
                      <dd>
                        {result.metadata.keywords_detected
                          .map(formatCategoryName)
                          .join(', ')}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensajes de error */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analizando documento...</p>
        </div>
      )}
    </div>
  );
}
