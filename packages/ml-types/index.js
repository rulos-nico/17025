/**
 * @lab17025/ml-types
 * Tipos y constantes compartidos para clasificación de documentos ML/DL
 */

// Exportar todo desde constants
export * from './constants.js';

// Exportar todo desde validators
export * from './validators.js';

// Exportaciones por defecto
import * as constants from './constants.js';
import * as validators from './validators.js';

export default {
  ...constants,
  ...validators
};
