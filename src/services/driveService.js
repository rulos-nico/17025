/**
 * Servicio de Google Drive
 * Gestión de archivos y carpetas para el laboratorio ISO 17025
 * 
 * Funcionalidades:
 * - Crear estructura de carpetas para proyectos
 * - Copiar plantillas de ensayos
 * - Subir/descargar archivos
 * - Gestionar permisos de compartición
 */

import { GOOGLE_CONFIG, DRIVE_CONFIG, APP_CONFIG } from '../config.js';

// ============================================
// ESTADO Y CONFIGURACIÓN
// ============================================

let gapiLoaded = false;
let tokenClient = null;
let accessToken = null;

// ============================================
// INICIALIZACIÓN DE GOOGLE APIs
// ============================================

/**
 * Carga un script externo de forma dinámica
 */
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * Inicializa Google API Client (gapi)
 */
const initGapiClient = async () => {
  await loadScript('https://apis.google.com/js/api.js');
  
  return new Promise((resolve, reject) => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: GOOGLE_CONFIG.apiKey,
          discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
        });
        gapiLoaded = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};

/**
 * Inicializa Google Identity Services (GIS) para OAuth
 */
const initGisClient = async () => {
  await loadScript('https://accounts.google.com/gsi/client');
  
  return new Promise((resolve) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.clientId,
      scope: GOOGLE_CONFIG.scopes.join(' '),
      callback: (response) => {
        if (response.access_token) {
          accessToken = response.access_token;
        }
      },
    });
    resolve();
  });
};

/**
 * Inicializa los servicios de Google (Drive + Sheets)
 */
export const initGoogleServices = async () => {
  try {
    await Promise.all([initGapiClient(), initGisClient()]);
    return true;
  } catch (error) {
    console.error('Error inicializando Google Services:', error);
    throw error;
  }
};

/**
 * Solicita autorización del usuario
 */
export const requestAuthorization = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client no inicializado'));
      return;
    }
    
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(response);
      } else {
        accessToken = response.access_token;
        resolve(response);
      }
    };
    
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = () => {
  return !!accessToken && gapiLoaded;
};

/**
 * Obtiene el token de acceso actual
 */
export const getAccessToken = () => accessToken;

// ============================================
// OPERACIONES DE CARPETAS
// ============================================

/**
 * Crea una carpeta en Google Drive
 * @param {string} name - Nombre de la carpeta
 * @param {string} parentId - ID de la carpeta padre (opcional)
 * @returns {Promise<Object>} - Datos de la carpeta creada
 */
export const createFolder = async (name, parentId = null) => {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  
  if (parentId) {
    metadata.parents = [parentId];
  }
  
  const response = await window.gapi.client.drive.files.create({
    resource: metadata,
    fields: 'id, name, webViewLink',
  });
  
  return response.result;
};

/**
 * Crea la estructura de carpetas para un nuevo proyecto
 * @param {Object} proyecto - Datos del proyecto
 * @returns {Promise<Object>} - IDs de las carpetas creadas
 */
export const createProjectStructure = async (proyecto) => {
  const year = new Date().getFullYear();
  const folderName = `${proyecto.codigo}_${proyecto.cliente_nombre}`;
  
  // Buscar o crear carpeta del año
  let yearFolder = await findFolder(year.toString(), DRIVE_CONFIG.folders.proyectos.id);
  if (!yearFolder) {
    yearFolder = await createFolder(year.toString(), DRIVE_CONFIG.folders.proyectos.id);
  }
  
  // Crear carpeta del proyecto
  const projectFolder = await createFolder(folderName, yearFolder.id);
  
  // Crear subcarpetas
  const [perforacionesFolder, informesFolder, anexosFolder] = await Promise.all([
    createFolder('Perforaciones', projectFolder.id),
    createFolder('Informes', projectFolder.id),
    createFolder('Anexos', projectFolder.id),
  ]);
  
  return {
    proyecto: projectFolder,
    perforaciones: perforacionesFolder,
    informes: informesFolder,
    anexos: anexosFolder,
    year: yearFolder,
  };
};

/**
 * Crea la estructura de carpetas para una perforación
 * @param {string} codigo - Código de la perforación
 * @param {string} perforacionesFolderId - ID de la carpeta de perforaciones del proyecto
 * @returns {Promise<Object>} - Datos de la carpeta creada
 */
export const createPerforationFolder = async (codigo, perforacionesFolderId) => {
  const folder = await createFolder(codigo, perforacionesFolderId);
  
  // Crear subcarpeta para anexos
  const anexosFolder = await createFolder('Anexos', folder.id);
  
  return {
    perforacion: folder,
    anexos: anexosFolder,
  };
};

/**
 * Busca una carpeta por nombre dentro de un directorio
 * @param {string} name - Nombre de la carpeta
 * @param {string} parentId - ID de la carpeta padre
 * @returns {Promise<Object|null>} - Datos de la carpeta o null
 */
export const findFolder = async (name, parentId) => {
  const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  
  const response = await window.gapi.client.drive.files.list({
    q: query,
    fields: 'files(id, name, webViewLink)',
    spaces: 'drive',
  });
  
  return response.result.files?.[0] || null;
};

/**
 * Lista archivos en una carpeta
 * @param {string} folderId - ID de la carpeta
 * @param {string} mimeType - Filtrar por tipo MIME (opcional)
 * @returns {Promise<Array>} - Lista de archivos
 */
export const listFiles = async (folderId, mimeType = null) => {
  let query = `'${folderId}' in parents and trashed=false`;
  
  if (mimeType) {
    query += ` and mimeType='${mimeType}'`;
  }
  
  const response = await window.gapi.client.drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, webViewLink, modifiedTime, size)',
    orderBy: 'name',
    spaces: 'drive',
  });
  
  return response.result.files || [];
};

// ============================================
// OPERACIONES DE ARCHIVOS
// ============================================

/**
 * Copia una plantilla de ensayo a la carpeta del proyecto
 * @param {string} tipoEnsayo - Tipo de ensayo (traccion, dureza, etc.)
 * @param {string} destinationFolderId - ID de la carpeta destino
 * @param {string} newName - Nuevo nombre del archivo
 * @returns {Promise<Object>} - Datos del archivo copiado
 */
export const copyTemplate = async (tipoEnsayo, destinationFolderId, newName) => {
  const templateId = DRIVE_CONFIG.plantillas[tipoEnsayo] || DRIVE_CONFIG.plantillas.default;
  
  if (!templateId) {
    throw new Error(`No existe plantilla para el tipo de ensayo: ${tipoEnsayo}`);
  }
  
  const response = await window.gapi.client.drive.files.copy({
    fileId: templateId,
    resource: {
      name: newName,
      parents: [destinationFolderId],
    },
    fields: 'id, name, webViewLink',
  });
  
  return response.result;
};

/**
 * Crea un nuevo ensayo copiando la plantilla correspondiente
 * @param {Object} ensayo - Datos del ensayo
 * @param {string} perforacionFolderId - ID de la carpeta de la perforación
 * @returns {Promise<Object>} - Datos del archivo creado
 */
export const createEnsayoSheet = async (ensayo, perforacionFolderId) => {
  const fileName = `${ensayo.codigo}_${ensayo.tipo}`;
  
  const file = await copyTemplate(ensayo.tipo, perforacionFolderId, fileName);
  
  return {
    id: file.id,
    name: file.name,
    url: file.webViewLink,
    editUrl: DRIVE_CONFIG.urls.sheet(file.id),
  };
};

/**
 * Obtiene los metadatos de un archivo
 * @param {string} fileId - ID del archivo
 * @returns {Promise<Object>} - Metadatos del archivo
 */
export const getFileMetadata = async (fileId) => {
  const response = await window.gapi.client.drive.files.get({
    fileId,
    fields: 'id, name, mimeType, webViewLink, modifiedTime, size, parents',
  });
  
  return response.result;
};

/**
 * Renombra un archivo
 * @param {string} fileId - ID del archivo
 * @param {string} newName - Nuevo nombre
 * @returns {Promise<Object>} - Metadatos actualizados
 */
export const renameFile = async (fileId, newName) => {
  const response = await window.gapi.client.drive.files.update({
    fileId,
    resource: { name: newName },
    fields: 'id, name, webViewLink',
  });
  
  return response.result;
};

/**
 * Mueve un archivo a otra carpeta
 * @param {string} fileId - ID del archivo
 * @param {string} newParentId - ID de la nueva carpeta padre
 * @param {string} oldParentId - ID de la carpeta padre actual
 * @returns {Promise<Object>} - Metadatos actualizados
 */
export const moveFile = async (fileId, newParentId, oldParentId) => {
  const response = await window.gapi.client.drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: oldParentId,
    fields: 'id, name, webViewLink, parents',
  });
  
  return response.result;
};

/**
 * Elimina un archivo (lo mueve a la papelera)
 * @param {string} fileId - ID del archivo
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
export const deleteFile = async (fileId) => {
  await window.gapi.client.drive.files.update({
    fileId,
    resource: { trashed: true },
  });
  
  return true;
};

// ============================================
// PERMISOS Y COMPARTICIÓN
// ============================================

/**
 * Comparte un archivo o carpeta con un usuario
 * @param {string} fileId - ID del archivo/carpeta
 * @param {string} email - Email del usuario
 * @param {string} role - Rol (reader, writer, commenter)
 * @param {boolean} sendNotification - Enviar notificación por email
 * @returns {Promise<Object>} - Datos del permiso creado
 */
export const shareWithUser = async (fileId, email, role = 'reader', sendNotification = true) => {
  const response = await window.gapi.client.drive.permissions.create({
    fileId,
    sendNotificationEmail: sendNotification,
    resource: {
      type: 'user',
      role,
      emailAddress: email,
    },
  });
  
  return response.result;
};

/**
 * Comparte un archivo/carpeta con cualquiera que tenga el link
 * @param {string} fileId - ID del archivo/carpeta
 * @param {string} role - Rol (reader, writer, commenter)
 * @returns {Promise<Object>} - Datos del permiso creado
 */
export const shareWithLink = async (fileId, role = 'reader') => {
  const response = await window.gapi.client.drive.permissions.create({
    fileId,
    resource: {
      type: 'anyone',
      role,
    },
  });
  
  return response.result;
};

/**
 * Obtiene los permisos de un archivo
 * @param {string} fileId - ID del archivo
 * @returns {Promise<Array>} - Lista de permisos
 */
export const getPermissions = async (fileId) => {
  const response = await window.gapi.client.drive.permissions.list({
    fileId,
    fields: 'permissions(id, type, role, emailAddress)',
  });
  
  return response.result.permissions || [];
};

/**
 * Elimina un permiso de un archivo
 * @param {string} fileId - ID del archivo
 * @param {string} permissionId - ID del permiso
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
export const removePermission = async (fileId, permissionId) => {
  await window.gapi.client.drive.permissions.delete({
    fileId,
    permissionId,
  });
  
  return true;
};

// ============================================
// EXPORTACIÓN DE ARCHIVOS
// ============================================

/**
 * Exporta un Google Sheet como PDF
 * @param {string} fileId - ID del Sheet
 * @returns {Promise<Blob>} - Blob del PDF
 */
export const exportSheetAsPdf = async (fileId) => {
  const url = DRIVE_CONFIG.urls.pdfExport(fileId);
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error exportando PDF: ${response.status}`);
  }
  
  return await response.blob();
};

/**
 * Exporta un Google Sheet como Excel
 * @param {string} fileId - ID del Sheet
 * @returns {Promise<Blob>} - Blob del archivo Excel
 */
export const exportSheetAsExcel = async (fileId) => {
  const url = DRIVE_CONFIG.urls.sheetExport(fileId, 'xlsx');
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error exportando Excel: ${response.status}`);
  }
  
  return await response.blob();
};

/**
 * Descarga un archivo
 * @param {string} fileId - ID del archivo
 * @returns {Promise<Blob>} - Blob del archivo
 */
export const downloadFile = async (fileId) => {
  const response = await window.gapi.client.drive.files.get({
    fileId,
    alt: 'media',
  });
  
  return new Blob([response.body]);
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Genera el código de un proyecto
 * @param {number} year - Año
 * @param {number} sequence - Número secuencial
 * @returns {string} - Código del proyecto (ej: PRY-2025-001)
 */
export const generateProjectCode = (year, sequence) => {
  return `${APP_CONFIG.prefixes.proyecto}-${year}-${String(sequence).padStart(3, '0')}`;
};

/**
 * Genera el código de un ensayo
 * @param {number} year - Año
 * @param {number} sequence - Número secuencial
 * @returns {string} - Código del ensayo (ej: ENS-2025-001)
 */
export const generateEnsayoCode = (year, sequence) => {
  return `${APP_CONFIG.prefixes.ensayo}-${year}-${String(sequence).padStart(3, '0')}`;
};

/**
 * Genera el código de una perforación
 * @param {string} projectCode - Código del proyecto
 * @param {number} sequence - Número secuencial
 * @returns {string} - Código de la perforación (ej: PRY-2025-001-PER-001)
 */
export const generatePerforationCode = (projectCode, sequence) => {
  return `${projectCode}-${APP_CONFIG.prefixes.perforacion}-${String(sequence).padStart(3, '0')}`;
};

// ============================================
// SERVICIO EXPORTADO
// ============================================

const DriveService = {
  // Inicialización
  init: initGoogleServices,
  authorize: requestAuthorization,
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
};

export default DriveService;
