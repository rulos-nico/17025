/**
 * Servicio de Google Sheets API
 * Laboratorio ISO 17025
 * 
 * Este módulo proporciona funciones de bajo nivel para interactuar
 * con Google Sheets API. Para operaciones de base de datos, usar sheetsDBService.js
 * Para operaciones de Drive, usar driveService.js
 */

// Config is loaded via driveService initialization

// ============================================
// RE-EXPORTAR SERVICIOS PRINCIPALES
// ============================================

// Re-exportar funciones de driveService para compatibilidad
export {
  initGoogleServices,
  requestAuthorization,
  isAuthenticated,
  getAccessToken,
} from './driveService.js';

// ============================================
// OPERACIONES DE GOOGLE SHEETS
// ============================================

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Obtiene el token de acceso desde driveService
 */
const getToken = async () => {
  const { getAccessToken } = await import('./driveService.js');
  const token = getAccessToken();
  if (!token) {
    throw new Error('No autenticado');
  }
  return token;
};

/**
 * Lee datos de un rango de un Google Sheet
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} range - Rango a leer (ej: 'Sheet1!A1:D10')
 * @returns {Promise<Array>} - Array de filas
 */
export const readSheet = async (spreadsheetId, range) => {
  const token = await getToken();
  
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error leyendo sheet: ${response.status}`);
  }
  
  const data = await response.json();
  return data.values || [];
};

/**
 * Lee un rango y lo convierte a objetos usando la primera fila como headers
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} range - Rango a leer
 * @returns {Promise<Array>} - Array de objetos
 */
export const readSheetAsObjects = async (spreadsheetId, range) => {
  const rows = await readSheet(spreadsheetId, range);
  
  if (rows.length < 2) return [];
  
  const headers = rows[0];
  const data = rows.slice(1);
  
  return data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] ?? null;
    });
    return obj;
  });
};

/**
 * Escribe datos en un rango de un Google Sheet
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} range - Rango donde escribir
 * @param {Array} values - Array de filas a escribir
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const writeSheet = async (spreadsheetId, range, values) => {
  const token = await getToken();
  
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  
  if (!response.ok) {
    throw new Error(`Error escribiendo sheet: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Agrega filas al final de un sheet
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} range - Rango (ej: 'Sheet1!A:Z')
 * @param {Array} values - Array de filas a agregar
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const appendSheet = async (spreadsheetId, range, values) => {
  const token = await getToken();
  
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  
  if (!response.ok) {
    throw new Error(`Error agregando filas: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Obtiene metadatos de un spreadsheet
 * @param {string} spreadsheetId - ID del spreadsheet
 * @returns {Promise<Object>} - Metadatos del spreadsheet
 */
export const getSpreadsheetMetadata = async (spreadsheetId) => {
  const token = await getToken();
  
  const url = `${SHEETS_API_BASE}/${spreadsheetId}?fields=spreadsheetId,properties,sheets.properties`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error obteniendo metadatos: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Lista las hojas (tabs) de un spreadsheet
 * @param {string} spreadsheetId - ID del spreadsheet
 * @returns {Promise<Array>} - Array de hojas con sus propiedades
 */
export const listSheets = async (spreadsheetId) => {
  const metadata = await getSpreadsheetMetadata(spreadsheetId);
  return metadata.sheets?.map(s => s.properties) || [];
};

/**
 * Crea una nueva hoja en un spreadsheet
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} title - Título de la nueva hoja
 * @returns {Promise<Object>} - Propiedades de la hoja creada
 */
export const createSheet = async (spreadsheetId, title) => {
  const token = await getToken();
  
  const url = `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        addSheet: {
          properties: { title },
        },
      }],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Error creando hoja: ${response.status}`);
  }
  
  const data = await response.json();
  return data.replies?.[0]?.addSheet?.properties;
};

/**
 * Elimina una hoja de un spreadsheet
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {number} sheetId - ID numérico de la hoja
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
export const deleteSheet = async (spreadsheetId, sheetId) => {
  const token = await getToken();
  
  const url = `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        deleteSheet: { sheetId },
      }],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Error eliminando hoja: ${response.status}`);
  }
  
  return true;
};

/**
 * Limpia un rango de celdas
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} range - Rango a limpiar
 * @returns {Promise<boolean>} - true si se limpió correctamente
 */
export const clearRange = async (spreadsheetId, range) => {
  const token = await getToken();
  
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error limpiando rango: ${response.status}`);
  }
  
  return true;
};

/**
 * Obtiene múltiples rangos en una sola petición
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {Array<string>} ranges - Array de rangos a leer
 * @returns {Promise<Object>} - Objeto con los datos de cada rango
 */
export const batchGet = async (spreadsheetId, ranges) => {
  const token = await getToken();
  
  const rangesParam = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchGet?${rangesParam}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error en batchGet: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Convertir a objeto indexado por rango
  const result = {};
  data.valueRanges?.forEach((vr, index) => {
    result[ranges[index]] = vr.values || [];
  });
  
  return result;
};

/**
 * Escribe en múltiples rangos en una sola petición
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {Object} data - Objeto { range: values }
 * @returns {Promise<Object>} - Respuesta de la API
 */
export const batchUpdate = async (spreadsheetId, data) => {
  const token = await getToken();
  
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`;
  
  const requestData = {
    valueInputOption: 'USER_ENTERED',
    data: Object.entries(data).map(([range, values]) => ({
      range,
      values,
    })),
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });
  
  if (!response.ok) {
    throw new Error(`Error en batchUpdate: ${response.status}`);
  }
  
  return response.json();
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Genera URL de visualización de un sheet
 */
export const getSheetUrl = (spreadsheetId) => 
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

/**
 * Genera URL de exportación
 */
export const getExportUrl = (spreadsheetId, format = 'xlsx') =>
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=${format}`;

// ============================================
// SERVICIO EXPORTADO
// ============================================

const GoogleSheetsService = {
  // Lectura
  readSheet,
  readSheetAsObjects,
  batchGet,
  
  // Escritura
  writeSheet,
  appendSheet,
  batchUpdate,
  clearRange,
  
  // Metadatos
  getSpreadsheetMetadata,
  listSheets,
  createSheet,
  deleteSheet,
  
  // URLs
  getSheetUrl,
  getExportUrl,
};

export default GoogleSheetsService;
