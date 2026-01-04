/**
 * Funciones de validación para clasificación de documentos
 */

import {
  FILE_CONFIG,
  SUPPORTED_FILE_TYPES,
  ALLOWED_EXTENSIONS,
  CONFIDENCE_THRESHOLDS,
  ERROR_MESSAGES
} from './constants.js';

/**
 * Validar archivo antes de clasificar
 * @param {File} file - Archivo a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateFile(file) {
  if (!file) {
    return {
      valid: false,
      error: ERROR_MESSAGES.NO_FILE_PROVIDED
    };
  }

  // Validar tamaño
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE
    };
  }

  // Validar tipo MIME
  if (!FILE_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE
    };
  }

  // Validar extensión
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE
    };
  }

  return { valid: true };
}

/**
 * Validar lote de archivos
 * @param {File[]} files - Array de archivos
 * @returns {Object} { valid: boolean, error?: string, invalidFiles?: string[] }
 */
export function validateBatch(files) {
  if (!files || files.length === 0) {
    return {
      valid: false,
      error: ERROR_MESSAGES.NO_FILE_PROVIDED
    };
  }

  if (files.length > FILE_CONFIG.MAX_BATCH_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES.BATCH_TOO_LARGE
    };
  }

  const invalidFiles = [];
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      invalidFiles.push(file.name);
    }
  }

  if (invalidFiles.length > 0) {
    return {
      valid: false,
      error: `Archivos inválidos: ${invalidFiles.join(', ')}`,
      invalidFiles
    };
  }

  return { valid: true };
}

/**
 * Validar resultado de clasificación
 * @param {Object} result - Resultado de clasificación
 * @returns {boolean}
 */
export function validateClassificationResult(result) {
  if (!result || typeof result !== 'object') {
    return false;
  }

  const requiredFields = ['predicted_class', 'confidence', 'all_probabilities'];
  return requiredFields.every(field => field in result);
}

/**
 * Determinar si la clasificación requiere revisión
 * @param {number} confidence - Nivel de confianza (0-1)
 * @returns {boolean}
 */
export function requiresReview(confidence) {
  return confidence < CONFIDENCE_THRESHOLDS.MEDIUM;
}

/**
 * Obtener nivel de confianza
 * @param {number} confidence - Nivel de confianza (0-1)
 * @returns {string} 'high' | 'medium' | 'low'
 */
export function getConfidenceLevel(confidence) {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    return 'high';
  } else if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Formatear tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validar categoría de documento
 * @param {string} category - Categoría a validar
 * @param {string[]} validCategories - Lista de categorías válidas
 * @returns {boolean}
 */
export function isValidCategory(category, validCategories) {
  return validCategories.includes(category);
}

/**
 * Sanitizar nombre de archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} Nombre sanitizado
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}
