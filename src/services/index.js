/**
 * Servicios de la aplicación
 * Laboratorio ISO 17025
 * 
 * Arquitectura de servicios:
 * - driveService: Gestión de archivos y carpetas en Google Drive
 * - sheetsDBService: Base de datos usando Google Sheets
 * - googleSheets: Operaciones de bajo nivel con Sheets API
 * - ensayoSheetService: Workflow de ensayos
 */

// ============================================
// SERVICIO DE GOOGLE DRIVE
// ============================================
export {
  default as DriveService,
  initGoogleServices,
  requestAuthorization,
  isAuthenticated,
  getAccessToken,
  // Carpetas
  createFolder,
  createProjectStructure,
  createPerforationFolder,
  findFolder,
  listFiles,
  // Archivos
  copyTemplate,
  createEnsayoSheet,
  getFileMetadata,
  renameFile,
  moveFile,
  deleteFile,
  // Permisos
  shareWithUser,
  shareWithLink,
  getPermissions,
  removePermission,
  // Exportación
  exportSheetAsPdf,
  exportSheetAsExcel,
  downloadFile,
  // Utilidades
  generateProjectCode,
  generateEnsayoCode,
  generatePerforationCode,
} from './driveService.js';

// ============================================
// SERVICIO DE BASE DE DATOS (Google Sheets)
// ============================================
export {
  default as SheetsDBService,
  // Operaciones genéricas
  findAll,
  findById,
  findWhere,
  create,
  update,
  remove,
  // Entidades
  Proyectos,
  Perforaciones,
  Ensayos,
  Clientes,
  Usuarios,
  Equipos,
  Logs,
  // Dashboard
  Dashboard,
} from './sheetsDBService.js';

// ============================================
// SERVICIO DE GOOGLE SHEETS (bajo nivel)
// ============================================
export {
  default as GoogleSheetsService,
  readSheet,
  readSheetAsObjects,
  writeSheet,
  appendSheet,
  getSpreadsheetMetadata,
  listSheets,
  createSheet,
  deleteSheet as deleteSheetTab,
  clearRange,
  batchGet,
  batchUpdate,
  getSheetUrl,
  getExportUrl,
} from './googleSheets.js';

// ============================================
// SERVICIO DE WORKFLOW DE ENSAYOS
// ============================================
export {
  default as EnsayoSheetServiceDefault,
  EnsayoSheetService,
  WorkflowService,
  ENSAYO_WORKFLOW_STATES,
  WORKFLOW_TRANSITIONS,
} from './ensayoSheetService.js';
